/**
 * ChatKit Integration for FarmerChat
 * Using OpenAI ChatKit Web Component
 */

// Language Configurations
const LANGUAGE_CONFIGS = {
    en: {
        starterPrompts: [
            {
                label: '☀️ Weather Forecast',
                prompt: 'What is the weather forecast?'
            },
            {
                label: '🌱 Planting Advice',
                prompt: 'Should I plant maize?'
            },
            {
                label: '💧 Irrigation Schedule',
                prompt: 'Do I need to irrigate this week?'
            },
            {
                label: '🌾 Farming Advisory',
                prompt: 'Give me farming recommendations for the next 2 weeks.'
            }
        ],
        greeting: 'Welcome to FarmerChat! Ask me about weather, planting advice, or irrigation.',
        placeholder: 'Ask about weather, planting, irrigation...'
    },
    sw: {
        starterPrompts: [
            {
                label: '🌤️ Hali ya Hewa',
                prompt: 'Hali ya hewa wiki hii ni vipi?'
            },
            {
                label: '🌱 Kupanda',
                prompt: 'Je, nipande mahindi sasa?'
            },
            {
                label: '💧 Umwagiliaji',
                prompt: 'Je, nimwagilie wiki hii?'
            },
            {
                label: '🌾 Ushauri wa Kilimo',
                prompt: 'Nipe ushauri wa kilimo kwa wiki 2 zijazo.'
            }
        ],
        greeting: 'Karibu FarmerChat! Uliza kuhusu hali ya hewa, kupanda, au umwagiliaji.',
        placeholder: 'Uliza kuhusu hali ya hewa, kupanda, umwagiliaji...'
    }
};

// Configuration
const CHATKIT_CONFIG = {
    workflowId: 'wf_68e9243fb2d8819096f40007348b673a071b12eea47ebea9',
    sessionEndpoint: '/api/chatkit/session',
    currentLanguage: 'en', // Default language
    ...LANGUAGE_CONFIGS.en
};

// Make config globally accessible for language switching
window.CHATKIT_CONFIG = CHATKIT_CONFIG;
window.LANGUAGE_CONFIGS = LANGUAGE_CONFIGS;

/**
 * Get or create device ID for session management
 */
function getDeviceId() {
    let deviceId = localStorage.getItem('farmerchat-device-id');
    if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('farmerchat-device-id', deviceId);
    }
    return deviceId;
}

/**
 * Create ChatKit session and get client secret
 */
async function getClientSecret() {
    try {
        const deviceId = getDeviceId();
        console.log('[ChatKit] Creating session for device:', deviceId);

        // Get current coordinates from location manager
        const coordinates = window.locationManager ?
            window.locationManager.getCurrentCoordinates() :
            { latitude: -1.2864, longitude: 36.8172, source: 'default' };

        console.log('[ChatKit] Using coordinates:', coordinates);

        const response = await fetch(CHATKIT_CONFIG.sessionEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceId,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                locationSource: coordinates.source
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Session creation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[ChatKit] Session created successfully');
        return data.client_secret;

    } catch (error) {
        console.error('[ChatKit] Error creating session:', error);
        throw error;
    }
}

/**
 * Initialize ChatKit web component
 */
async function initChatKit() {
    try {
        console.log('[ChatKit] Initializing web component...');

        const container = document.getElementById('chatkitWidget');
        if (!container) {
            throw new Error('ChatKit container element not found');
        }

        // Show loading state
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" stroke="#4a7c2e">
                        <g fill="none" fill-rule="evenodd">
                            <g transform="translate(2 2)" stroke-width="3">
                                <circle stroke-opacity=".3" cx="18" cy="18" r="18"/>
                                <path d="M36 18c0-9.94-8.06-18-18-18">
                                    <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
                                </path>
                            </g>
                        </g>
                    </svg>
                </div>
                <p style="color: #666; font-size: 14px; margin: 0;">Loading FarmerChat...</p>
                <p style="color: #999; font-size: 12px; margin-top: 8px;">Connecting to agriculture assistant</p>
            </div>
        `;

        // Wait for web component to be defined
        await customElements.whenDefined('openai-chatkit');
        console.log('[ChatKit] Web component loaded');

        // Clear loading state
        container.innerHTML = '';

        // Create the ChatKit web component
        const chatkit = document.createElement('openai-chatkit');

        // Detect user's preferred color scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';

        // Configure the web component
        chatkit.setOptions({
            api: {
                getClientSecret: getClientSecret
            },
            theme: theme,
            startScreen: {
                greeting: CHATKIT_CONFIG.greeting,
                prompts: CHATKIT_CONFIG.starterPrompts
            },
            composer: {
                placeholder: CHATKIT_CONFIG.placeholder,
                attachments: {
                    enabled: true,
                    maxCount: 5,
                    maxSize: 10 * 1024 * 1024 // 10MB
                    // Omitting accept parameter - let ChatKit use defaults
                }
            }
        });

        // Set size
        chatkit.style.height = '100%';
        chatkit.style.width = '100%';

        // Append to container
        container.appendChild(chatkit);

        // Store instance globally for voice manager to access
        window.chatkitInstance = chatkit;

        // Add language switching function
        window.switchChatKitLanguage = function(lang) {
            if (!LANGUAGE_CONFIGS[lang]) {
                console.error(`[ChatKit] Unknown language: ${lang}`);
                return;
            }

            if (CHATKIT_CONFIG.currentLanguage === lang) {
                console.log(`[ChatKit] Already using language: ${lang}`);
                return;
            }

            console.log(`[ChatKit] Switching language to: ${lang}`);
            CHATKIT_CONFIG.currentLanguage = lang;

            // Update config with new language
            Object.assign(CHATKIT_CONFIG, LANGUAGE_CONFIGS[lang]);

            // Remove old ChatKit instance
            const container = document.getElementById('chatkitWidget');

            // Detect current theme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const currentTheme = prefersDark ? 'dark' : 'light';
            const bgColor = currentTheme === 'dark' ? '#1a1a1a' : '#ffffff';
            const textColor = currentTheme === 'dark' ? '#e5e5e5' : '#666666';

            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: ${bgColor}; color: ${textColor};">
                    <div style="text-align: center;">
                        <div style="margin-bottom: 8px; font-size: 24px;">🌍</div>
                        <p style="margin: 0; font-weight: 500;">Switching language...</p>
                    </div>
                </div>
            `;

            // Reinitialize ChatKit with new language
            setTimeout(() => {
                const newChatkit = document.createElement('openai-chatkit');

                // Configure with new language
                newChatkit.setOptions({
                    api: {
                        getClientSecret: getClientSecret
                    },
                    theme: currentTheme,
                    startScreen: {
                        greeting: CHATKIT_CONFIG.greeting,
                        prompts: CHATKIT_CONFIG.starterPrompts
                    },
                    composer: {
                        placeholder: CHATKIT_CONFIG.placeholder,
                        attachments: {
                            enabled: true,
                            maxCount: 5,
                            maxSize: 10 * 1024 * 1024 // 10MB
                            // Omitting accept parameter - let ChatKit use defaults
                        }
                    }
                });

                newChatkit.style.height = '100%';
                newChatkit.style.width = '100%';

                container.innerHTML = '';
                container.appendChild(newChatkit);

                // Store new instance globally
                window.chatkitInstance = newChatkit;

                // Re-attach voice output listener
                if (window.voiceManager) {
                    newChatkit.addEventListener('message', async (event) => {
                        const message = event.detail;
                        if (message.role === 'assistant' && message.content) {
                            await window.voiceManager.textToSpeech(message.content, {
                                language: 'auto',
                                autoPlay: true,
                                stripMarkdown: true
                            });
                        }
                    });
                }

                console.log(`[ChatKit] Language switched to ${lang === 'en' ? 'English' : 'Swahili'}`);
            }, 100);

            // Update active button state
            const langButtons = document.querySelectorAll('.lang-btn');
            langButtons.forEach(btn => {
                const btnLang = btn.getAttribute('data-lang');
                if (btnLang === lang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        // Set up voice output for ChatKit responses
        if (window.voiceManager) {
            console.log('[ChatKit] Setting up voice output for responses...');

            // Listen for ChatKit message events
            chatkit.addEventListener('message', async (event) => {
                const message = event.detail;

                // Only process assistant messages
                if (message.role === 'assistant' && message.content) {
                    console.log('[Voice] Assistant response received, generating speech...');

                    // Convert response to speech using Nova voice
                    await window.voiceManager.textToSpeech(message.content, {
                        language: 'auto', // Auto-detect language (English or Swahili)
                        autoPlay: true,
                        stripMarkdown: true
                    });
                }
            });
        }

        console.log('[ChatKit] Widget initialized successfully');

    } catch (error) {
        console.error('[ChatKit] Initialization failed:', error);

        const container = document.getElementById('chatkitWidget');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #d32f2f;">
                    <h3 style="margin: 0 0 10px 0;">⚠️ Failed to Load Chat</h3>
                    <p style="font-size: 14px; color: #666;">${error.message}</p>
                    <p style="font-size: 12px; color: #999; margin-top: 8px;">Please check console for details</p>
                    <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #4a7c2e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
async function initializeApp() {
    // Initialize location manager first
    if (window.locationManager) {
        console.log('[App] Initializing location manager...');
        await window.locationManager.initialize({ askPermission: true, showUI: true });
    }

    // Then initialize ChatKit
    await initChatKit();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
