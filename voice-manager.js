/**
 * Voice Manager for FarmerChat
 * Handles voice input (Whisper STT) and voice output (TTS with Nova voice)
 */

// Configuration
const VOICE_CONFIG = {
    // OpenAI API endpoint
    apiEndpoint: '/api/voice',

    // Whisper STT settings
    whisper: {
        model: 'whisper-1',
        language: null, // Auto-detect (supports both English and Swahili)
        temperature: 0.2
    },

    // TTS settings
    tts: {
        model: 'tts-1-hd', // Higher quality
        voice: 'nova', // Warm, friendly female voice
        speed: 1.0 // Normal speed
    },

    // Recording settings
    recording: {
        maxDuration: 60000, // 60 seconds max
        mimeType: 'audio/webm;codecs=opus',
        fallbackMimeType: 'audio/mp4'
    }
};

/**
 * Voice Manager Class
 */
class VoiceManager {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentAudio = null;
        this.onTranscriptionComplete = null;
        this.onError = null;
    }

    /**
     * Check if microphone is supported
     */
    isMicrophoneSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Check if audio playback is supported
     */
    isAudioPlaybackSupported() {
        return !!window.Audio;
    }

    /**
     * Start recording audio
     */
    async startRecording() {
        if (!this.isMicrophoneSupported()) {
            this.showNotification('Microphone is not supported on this device.', 'error');
            return false;
        }

        try {
            console.log('[Voice] Requesting microphone access...');

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Determine supported MIME type
            let mimeType = VOICE_CONFIG.recording.mimeType;
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = VOICE_CONFIG.recording.fallbackMimeType;
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = ''; // Let browser choose
                }
            }

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            this.audioChunks = [];

            // Handle data available
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            // Handle recording stop
            this.mediaRecorder.addEventListener('stop', async () => {
                const audioBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
                console.log('[Voice] Recording stopped, audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Send to Whisper API for transcription
                await this.transcribeAudio(audioBlob);
            });

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;

            console.log('[Voice] Recording started');
            this.showNotification('Recording... Speak now', 'info');

            // Auto-stop after max duration
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                    this.showNotification('Recording stopped (max duration reached)', 'warning');
                }
            }, VOICE_CONFIG.recording.maxDuration);

            return true;

        } catch (error) {
            console.error('[Voice] Error starting recording:', error);

            let message = 'Unable to access microphone.';
            if (error.name === 'NotAllowedError') {
                message = 'Microphone permission denied. Please allow microphone access and try again.';
            } else if (error.name === 'NotFoundError') {
                message = 'No microphone found on this device.';
            }

            this.showNotification(message, 'error');

            if (this.onError) {
                this.onError(error);
            }

            return false;
        }
    }

    /**
     * Stop recording audio
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            return;
        }

        console.log('[Voice] Stopping recording...');
        this.mediaRecorder.stop();
        this.isRecording = false;
    }

    /**
     * Transcribe audio using Whisper API
     */
    async transcribeAudio(audioBlob) {
        try {
            console.log('[Voice] Transcribing audio with Whisper...');
            this.showNotification('Processing your voice...', 'info');

            // Create FormData
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('model', VOICE_CONFIG.whisper.model);
            if (VOICE_CONFIG.whisper.language) {
                formData.append('language', VOICE_CONFIG.whisper.language);
            }
            formData.append('temperature', VOICE_CONFIG.whisper.temperature);

            // Send to server endpoint
            const response = await fetch(VOICE_CONFIG.apiEndpoint + '/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Transcription failed: ${response.status}`);
            }

            const data = await response.json();
            const transcription = data.text;
            const language = data.language;

            console.log('[Voice] Transcription:', transcription);
            console.log('[Voice] Detected language:', language);

            this.showNotification(`Understood: "${transcription.substring(0, 50)}${transcription.length > 50 ? '...' : ''}"`, 'success');

            // Trigger callback
            if (this.onTranscriptionComplete) {
                this.onTranscriptionComplete(transcription, language);
            }

            return { transcription, language };

        } catch (error) {
            console.error('[Voice] Transcription error:', error);
            this.showNotification('Failed to process your voice. Please try again.', 'error');

            if (this.onError) {
                this.onError(error);
            }

            return null;
        }
    }

    /**
     * Convert text to speech using TTS API
     */
    async textToSpeech(text, options = {}) {
        try {
            const {
                language = 'auto',
                autoPlay = true,
                stripMarkdown = true
            } = options;

            console.log('[Voice] Converting text to speech:', text.substring(0, 100));

            // Strip markdown if requested
            let speechText = text;
            if (stripMarkdown && window.markdownStripper) {
                speechText = window.markdownStripper.optimizeForNovaVoice(text, {
                    addConversational: true,
                    language: language
                });
            }

            console.log('[Voice] Optimized for speech:', speechText.substring(0, 100));

            // Build voice instructions
            const instructions = window.markdownStripper
                ? window.markdownStripper.buildVoiceInstructions(language)
                : 'Speak warmly and naturally like a friendly agricultural advisor.';

            // Send to TTS endpoint
            const response = await fetch(VOICE_CONFIG.apiEndpoint + '/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: speechText,
                    model: VOICE_CONFIG.tts.model,
                    voice: VOICE_CONFIG.tts.voice,
                    speed: VOICE_CONFIG.tts.speed,
                    instructions: instructions
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `TTS failed: ${response.status}`);
            }

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            console.log('[Voice] TTS audio generated, size:', (audioBlob.size / 1024).toFixed(2), 'KB');

            // Play audio if requested
            if (autoPlay && this.isAudioPlaybackSupported()) {
                await this.playAudio(audioUrl);
            }

            return audioUrl;

        } catch (error) {
            console.error('[Voice] TTS error:', error);
            this.showNotification('Unable to generate voice response.', 'error');

            if (this.onError) {
                this.onError(error);
            }

            return null;
        }
    }

    /**
     * Play audio from URL
     */
    async playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            try {
                // Stop current audio if playing
                this.stopAudio();

                // Create new audio element
                this.currentAudio = new Audio(audioUrl);

                // Handle playback events
                this.currentAudio.addEventListener('ended', () => {
                    console.log('[Voice] Audio playback finished');
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                });

                this.currentAudio.addEventListener('error', (error) => {
                    console.error('[Voice] Audio playback error:', error);
                    reject(error);
                });

                // Play audio
                console.log('[Voice] Playing audio...');
                this.currentAudio.play().catch(reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop current audio playback
     */
    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    /**
     * Check if audio is currently playing
     */
    isPlaying() {
        return this.currentAudio && !this.currentAudio.paused;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `voice-notification voice-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🎤'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Toggle recording (start/stop)
     */
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopRecording();
        this.stopAudio();
    }
}

// Create singleton instance
const voiceManager = new VoiceManager();

// Export for use in other scripts
window.voiceManager = voiceManager;
