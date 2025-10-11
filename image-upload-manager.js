/**
 * Image Upload Manager for FarmerChat
 * Handles camera capture and file upload for plant disease diagnosis
 */

// Maximum image size (5MB for Gemini API, leaving some overhead)
const MAX_IMAGE_SIZE_MB = 4.5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Image Upload Manager Class
 */
class ImageUploadManager {
    constructor() {
        this.currentImage = null;
        this.onImageSelected = null; // Callback when image is ready
    }

    /**
     * Check if camera is supported
     */
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Check if file upload is supported
     */
    isFileUploadSupported() {
        return !!(window.File && window.FileReader);
    }

    /**
     * Compress image if too large
     */
    async compressImage(file, maxSizeMB = MAX_IMAGE_SIZE_MB) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions to reduce file size
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1920; // Max width/height

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (height / width) * maxDimension;
                            width = maxDimension;
                        } else {
                            width = (width / height) * maxDimension;
                            height = maxDimension;
                        }
                    }

                    // Create canvas and compress
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels until under size limit
                    let quality = 0.9;
                    const tryCompress = () => {
                        canvas.toBlob(
                            (blob) => {
                                if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.3) {
                                    // Convert blob to base64
                                    const compressedReader = new FileReader();
                                    compressedReader.onload = () => {
                                        resolve({
                                            dataUrl: compressedReader.result,
                                            size: blob.size,
                                            width: width,
                                            height: height,
                                            compressed: blob.size < file.size
                                        });
                                    };
                                    compressedReader.onerror = reject;
                                    compressedReader.readAsDataURL(blob);
                                } else {
                                    // Try with lower quality
                                    quality -= 0.1;
                                    tryCompress();
                                }
                            },
                            file.type === 'image/png' ? 'image/jpeg' : file.type, // Convert PNG to JPEG for better compression
                            quality
                        );
                    };

                    tryCompress();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Validate image file
     */
    validateImage(file) {
        // Check if file exists
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        // Check file type
        if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase())) {
            return {
                valid: false,
                error: `Unsupported format. Please use JPEG, PNG, or WebP images.`
            };
        }

        // Check file size (we'll compress if needed, but check initial size)
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 20) {
            return {
                valid: false,
                error: `Image is too large (${sizeMB.toFixed(1)}MB). Please use an image smaller than 20MB.`
            };
        }

        return { valid: true };
    }

    /**
     * Process and prepare image for upload
     */
    async processImage(file) {
        try {
            console.log('[ImageUpload] Processing image:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

            // Validate image
            const validation = this.validateImage(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Compress if needed
            const result = await this.compressImage(file);

            console.log('[ImageUpload] Image processed:', {
                originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                finalSize: `${(result.size / 1024 / 1024).toFixed(2)}MB`,
                dimensions: `${result.width}x${result.height}`,
                compressed: result.compressed
            });

            this.currentImage = {
                dataUrl: result.dataUrl,
                size: result.size,
                width: result.width,
                height: result.height,
                name: file.name,
                type: file.type
            };

            return this.currentImage;

        } catch (error) {
            console.error('[ImageUpload] Error processing image:', error);
            throw error;
        }
    }

    /**
     * Handle file upload from input element
     */
    async handleFileUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return null;

        try {
            const image = await this.processImage(file);

            // Show preview
            this.showImagePreview(image);

            // Trigger callback if set
            if (this.onImageSelected) {
                this.onImageSelected(image);
            }

            return image;

        } catch (error) {
            this.showNotification(error.message, 'error');
            return null;
        }
    }

    /**
     * Handle camera capture
     */
    async captureFromCamera() {
        if (!this.isCameraSupported()) {
            this.showNotification('Camera is not supported on this device.', 'error');
            return null;
        }

        try {
            console.log('[ImageUpload] Requesting camera access...');

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use rear camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            // Create camera capture dialog
            const dialog = this.createCameraDialog(stream);
            document.body.appendChild(dialog);

            return new Promise((resolve) => {
                // Handle capture button
                dialog.querySelector('#captureButton').addEventListener('click', async () => {
                    const video = dialog.querySelector('#cameraVideo');
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);

                    // Stop camera
                    stream.getTracks().forEach(track => track.stop());
                    dialog.remove();

                    // Convert to blob and process
                    canvas.toBlob(async (blob) => {
                        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        const image = await this.processImage(file);

                        // Show preview
                        this.showImagePreview(image);

                        // Trigger callback
                        if (this.onImageSelected) {
                            this.onImageSelected(image);
                        }

                        resolve(image);
                    }, 'image/jpeg', 0.9);
                });

                // Handle cancel button
                dialog.querySelector('#cancelCapture').addEventListener('click', () => {
                    stream.getTracks().forEach(track => track.stop());
                    dialog.remove();
                    resolve(null);
                });
            });

        } catch (error) {
            console.error('[ImageUpload] Camera error:', error);

            let message = 'Unable to access camera.';
            if (error.name === 'NotAllowedError') {
                message = 'Camera permission denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                message = 'No camera found on this device.';
            }

            this.showNotification(message, 'error');
            return null;
        }
    }

    /**
     * Create camera capture dialog
     */
    createCameraDialog(stream) {
        const dialog = document.createElement('div');
        dialog.className = 'camera-dialog-overlay';
        dialog.innerHTML = `
            <div class="camera-dialog">
                <div class="camera-header">
                    <h3>📸 Capture Plant Image</h3>
                </div>
                <div class="camera-body">
                    <video id="cameraVideo" class="camera-video" autoplay playsinline></video>
                    <p class="camera-hint">Position the plant to clearly show leaves, stems, or affected areas</p>
                </div>
                <div class="camera-actions">
                    <button class="btn-secondary" id="cancelCapture">Cancel</button>
                    <button class="btn-primary" id="captureButton">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Capture Photo
                    </button>
                </div>
            </div>
        `;

        // Start video stream
        const video = dialog.querySelector('#cameraVideo');
        video.srcObject = stream;

        return dialog;
    }

    /**
     * Show image preview dialog
     */
    showImagePreview(image) {
        // Remove existing preview if any
        const existing = document.querySelector('.image-preview-overlay');
        if (existing) existing.remove();

        const preview = document.createElement('div');
        preview.className = 'image-preview-overlay';
        preview.innerHTML = `
            <div class="image-preview-dialog">
                <div class="image-preview-header">
                    <h3>🌿 Plant Image Ready</h3>
                    <button class="close-preview" id="closePreview">×</button>
                </div>
                <div class="image-preview-body">
                    <img src="${image.dataUrl}" alt="Plant image" class="preview-image">
                    <div class="image-info">
                        <p><strong>Size:</strong> ${(image.size / 1024 / 1024).toFixed(2)}MB</p>
                        <p><strong>Dimensions:</strong> ${image.width}×${image.height}</p>
                    </div>
                    <p class="preview-hint">✅ Image ready for diagnosis. Send it in your message to get plant health analysis.</p>
                </div>
                <div class="image-preview-actions">
                    <button class="btn-primary" id="confirmPreview">Got It</button>
                </div>
            </div>
        `;

        document.body.appendChild(preview);
        setTimeout(() => preview.classList.add('show'), 10);

        // Handle close buttons
        const closeButtons = preview.querySelectorAll('#closePreview, #confirmPreview');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                preview.classList.remove('show');
                setTimeout(() => preview.remove(), 300);
            });
        });
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `image-notification image-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Get current image (if any)
     */
    getCurrentImage() {
        return this.currentImage;
    }

    /**
     * Clear current image
     */
    clearImage() {
        this.currentImage = null;
    }
}

// Create singleton instance
const imageUploadManager = new ImageUploadManager();

// Export for use in other scripts
window.imageUploadManager = imageUploadManager;
