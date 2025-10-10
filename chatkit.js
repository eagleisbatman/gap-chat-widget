/**
 * ChatKit Integration for FarmerChat
 * Using OpenAI ChatKit Web Component
 */

// Configuration
const CHATKIT_CONFIG = {
    workflowId: 'wf_68e9243fb2d8819096f40007348b673a071b12eea47ebea9',
    sessionEndpoint: '/api/chatkit/session',

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
            prompt: 'Give me farming recommendations for the next 2 weeks for maize.'
        }
    ],

    greeting: 'Welcome to FarmerChat! Ask me about weather, planting advice, or irrigation schedules for your farm in Kenya.',
    placeholder: 'Ask about weather, planting, or irrigation...'
};

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

        const response = await fetch(CHATKIT_CONFIG.sessionEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deviceId })
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
            startScreen: {
                greeting: CHATKIT_CONFIG.greeting,
                prompts: CHATKIT_CONFIG.starterPrompts
            },
            composer: {
                placeholder: CHATKIT_CONFIG.placeholder
            },
            theme: theme
        });

        // Set size
        chatkit.style.height = '100%';
        chatkit.style.width = '100%';

        // Append to container
        container.appendChild(chatkit);

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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatKit);
} else {
    initChatKit();
}
