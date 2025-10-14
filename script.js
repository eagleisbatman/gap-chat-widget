// Chat widget state
let isChatOpen = false;
let chatkitLoaded = false;

// Current language (default: English)
let currentLanguage = 'en';

// Toggle chat window
function toggleChat() {
    const container = document.getElementById('chatContainer');
    const button = document.getElementById('chatButton');

    isChatOpen = !isChatOpen;

    if (isChatOpen) {
        container.classList.add('open');
        button.classList.add('hidden');
        chatkitLoaded = true; // ChatKit is already initialized in chatkit.js
    } else {
        container.classList.remove('open');
        button.classList.remove('hidden');
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

// Language configuration
const LANGUAGE_CONFIG = {
    en: {
        greeting: 'Welcome to FarmerChat! Ask me about weather, planting advice, or irrigation.',
        placeholder: 'Ask about weather, planting, irrigation...',
        starterPrompts: [
            { label: '☀️ Weather Forecast', prompt: 'What is the weather forecast?' },
            { label: '🌱 Planting Advice', prompt: 'Should I plant maize?' },
            { label: '💧 Irrigation Schedule', prompt: 'Do I need to irrigate this week?' },
            { label: '🌾 Farming Advisory', prompt: 'Give me farming recommendations for the next 2 weeks.' }
        ]
    },
    sw: {
        greeting: 'Karibu FarmerChat! Uliza kuhusu hali ya hewa, kupanda, au umwagiliaji.',
        placeholder: 'Uliza kuhusu hali ya hewa, kupanda, umwagiliaji...',
        starterPrompts: [
            { label: '🌤️ Hali ya Hewa', prompt: 'Hali ya hewa wiki hii ni vipi?' },
            { label: '🌱 Kupanda', prompt: 'Je, nipande mahindi sasa?' },
            { label: '💧 Umwagiliaji', prompt: 'Je, nimwagilie wiki hii?' },
            { label: '🌾 Ushauri wa Kilimo', prompt: 'Nipe ushauri wa kilimo kwa wiki 2 zijazo.' }
        ]
    }
};

// Function to update ChatKit language
function updateChatKitLanguage(lang) {
    currentLanguage = lang;

    // Update ChatKit using the global function
    if (window.switchChatKitLanguage) {
        window.switchChatKitLanguage(lang);
    }

    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');

    console.log(`[Language] Switched to ${lang === 'en' ? 'English' : 'Swahili'}`);
}

// Image upload and voice button event handlers
document.addEventListener('DOMContentLoaded', () => {
    const cameraButton = document.getElementById('cameraButton');
    const uploadButton = document.getElementById('uploadButton');
    const voiceButton = document.getElementById('voiceButton');
    const fileInput = document.getElementById('fileInput');
    const langEnglish = document.getElementById('langEnglish');
    const langSwahili = document.getElementById('langSwahili');

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

    // Voice input
    if (voiceButton && window.voiceManager) {
        const recordingPulse = voiceButton.querySelector('.recording-pulse');

        // Set up transcription callback
        window.voiceManager.onTranscriptionComplete = (transcription, language) => {
            console.log('[Voice] Transcription received:', transcription);

            // Send transcription to ChatKit
            if (window.chatkitInstance && window.chatkitInstance.sendMessage) {
                window.chatkitInstance.sendMessage(transcription);
            } else {
                console.warn('[Voice] ChatKit instance not available to send message');
            }
        };

        // Voice button click handler
        voiceButton.addEventListener('click', async () => {
            if (window.voiceManager.isRecording) {
                // Stop recording
                window.voiceManager.stopRecording();
                voiceButton.classList.remove('recording');
                if (recordingPulse) recordingPulse.style.display = 'none';
            } else {
                // Start recording
                const started = await window.voiceManager.startRecording();
                if (started) {
                    voiceButton.classList.add('recording');
                    if (recordingPulse) recordingPulse.style.display = 'block';
                }
            }
        });

        // Also listen for voice manager's recording state changes
        const checkRecordingState = setInterval(() => {
            if (window.voiceManager && !window.voiceManager.isRecording) {
                voiceButton.classList.remove('recording');
                if (recordingPulse) recordingPulse.style.display = 'none';
            }
        }, 500);
    }

    // Language selector buttons
    if (langEnglish) {
        langEnglish.addEventListener('click', () => {
            updateChatKitLanguage('en');
        });
    }

    if (langSwahili) {
        langSwahili.addEventListener('click', () => {
            updateChatKitLanguage('sw');
        });
    }
});
