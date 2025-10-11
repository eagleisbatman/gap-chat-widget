// Chat widget state
let isChatOpen = false;
let chatkitLoaded = false;

// Toggle chat window
function toggleChat() {
    const container = document.getElementById('chatContainer');
    const button = document.getElementById('chatButton');
    const imageButtons = document.getElementById('imageUploadButtons');

    isChatOpen = !isChatOpen;

    if (isChatOpen) {
        container.classList.add('open');
        button.classList.add('hidden');
        imageButtons.style.display = 'flex'; // Show image upload buttons
        chatkitLoaded = true; // ChatKit is already initialized in chatkit.js
    } else {
        container.classList.remove('open');
        button.classList.remove('hidden');
        imageButtons.style.display = 'none'; // Hide image upload buttons
    }
}

// Open chat
function openChat() {
    if (!isChatOpen) {
        toggleChat();
    }
}

// Close chat
function closeChat() {
    if (isChatOpen) {
        toggleChat();
    }
}

// Initialize ChatKit
async function initializeChatKit() {
    try {
        chatkitLoaded = true;
        const widget = document.getElementById('chatkitWidget');

        // Show loading state
        widget.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading chat...</p>
            </div>
        `;

        // Import and initialize ChatKit
        // This will be replaced with actual ChatKit initialization
        // For now, showing a placeholder
        setTimeout(() => {
            widget.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h3 style="margin-bottom: 1rem;">ChatKit Integration</h3>
                    <p style="color: #6c757d; margin-bottom: 1rem;">
                        To complete the setup:
                    </p>
                    <ol style="text-align: left; max-width: 300px; margin: 0 auto; color: #6c757d;">
                        <li style="margin-bottom: 0.5rem;">Deploy MCP server to Railway</li>
                        <li style="margin-bottom: 0.5rem;">Configure OpenAI Agent Builder</li>
                        <li style="margin-bottom: 0.5rem;">Get workflow ID</li>
                        <li style="margin-bottom: 0.5rem;">Update chatkit.js with your credentials</li>
                    </ol>
                    <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #6c757d;">
                        See README.md for detailed instructions
                    </p>
                </div>
            `;
        }, 1000);

    } catch (error) {
        console.error('Error initializing ChatKit:', error);
        const widget = document.getElementById('chatkitWidget');
        widget.innerHTML = `
            <div class="loading">
                <p style="color: #dc3545;">Failed to load chat. Please try again.</p>
            </div>
        `;
    }
}

// Close chat on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isChatOpen) {
        closeChat();
    }
});

// Responsive: auto-expand chat on mobile when opened
function handleResize() {
    const container = document.getElementById('chatContainer');
    if (window.innerWidth <= 768 && isChatOpen) {
        container.style.width = 'calc(100% - 2rem)';
        container.style.height = 'calc(100% - 2rem)';
    }
}

window.addEventListener('resize', handleResize);

// Image upload button event handlers
document.addEventListener('DOMContentLoaded', () => {
    const cameraButton = document.getElementById('cameraButton');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');

    // Camera capture
    if (cameraButton) {
        cameraButton.addEventListener('click', async () => {
            if (window.imageUploadManager) {
                await window.imageUploadManager.captureFromCamera();
            }
        });
    }

    // File upload
    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (event) => {
            if (window.imageUploadManager) {
                await window.imageUploadManager.handleFileUpload(event);
            }
        });
    }
});
