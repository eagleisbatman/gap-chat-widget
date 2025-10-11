# 🌾 FarmerChat Widget

**OpenAI ChatKit-powered chat widget for agricultural intelligence.**

Complete chat interface with session server that connects farmers to real-time weather forecasts, planting recommendations, and irrigation advice through conversational AI.

## ✨ Features

- 💬 Floating chat widget with clean agricultural theme
- 🌤️ Real-time weather forecasts via OpenAI Agent Builder + MCP
- 🎤 **Voice input/output** - Speak your questions, hear responses (English & Swahili)
- 🌍 **Bilingual support** - Full English and Swahili language support
- 📸 **Plant disease diagnosis** - Upload photos for AI-powered health analysis
- 📍 **Location-aware** - Auto-detect location or use default coordinates
- 🌱 User-friendly responses (no technical jargon)
- 📱 Fully responsive (desktop, tablet, mobile)
- ⚡ Session server with configurable default coordinates
- 🔄 Auto-session management with ChatKit

## 🏗️ Architecture

```
Frontend (index.html + chatkit.js)
    ↓
Session Server (server.js)
    - Creates ChatKit sessions
    - Injects default farm coordinates via headers
    ↓
OpenAI ChatKit API
    ↓
OpenAI Agent Builder Workflow
    - Configured with SYSTEM_PROMPT.md
    ↓
MCP Server (gap-agriculture-mcp)
    - Receives coordinates from headers
    - Provides 4 agricultural tools
```

## 🌍 Geographic Coverage

**IMPORTANT:** This chat widget depends on the [gap-agriculture-mcp](https://github.com/eagleisbatman/gap-agriculture-mcp) server, which uses TomorrowNow's Global Access Platform (GAP) for weather data.

**GAP coverage is limited to specific regions.** Before deploying, verify that GAP supports your target region at [tomorrownow.org](https://tomorrownow.org).

Current GAP coverage includes parts of East Africa (Kenya, Tanzania, Uganda, Ethiopia, Somalia) and potentially other regions.

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- OpenAI API key
- Agent Builder workflow ID
- MCP server deployed (see [gap-agriculture-mcp](https://github.com/eagleisbatman/gap-agriculture-mcp))
- **Verify GAP covers your target region**

### Local Development

```bash
# Clone and install
git clone https://github.com/eagleisbatman/gap-chat-widget.git
cd gap-chat-widget
npm install

# Configure environment
cp .env.example .env
```

**Edit `.env`:**
```bash
OPENAI_API_KEY=your_openai_api_key
WORKFLOW_ID=wf_your_workflow_id
FARM_LATITUDE=XX.XXXX      # Your default latitude
FARM_LONGITUDE=YY.YYYY     # Your default longitude
PORT=3002
```

**Start server:**
```bash
npm start
```

**Open browser:**
```
http://localhost:3002/index.html
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `WORKFLOW_ID` | ✅ | Agent Builder workflow ID (starts with `wf_`) |
| `FARM_LATITUDE` | Optional | Default farm latitude for your region |
| `FARM_LONGITUDE` | Optional | Default farm longitude for your region |
| `PORT` | Optional | Server port (default: 3002) |

### Get Workflow ID

1. Go to [platform.openai.com](https://platform.openai.com/playground/agents)
2. Create Agent Builder workflow
3. Add MCP server connection
4. Copy workflow ID from URL: `wf_...`

### System Prompt Configuration

**⚠️ CRITICAL:** The Agent Builder workflow must be configured with the system prompt from `SYSTEM_PROMPT.md`.

**To update Agent Builder prompt:**

1. Edit `SYSTEM_PROMPT.md` in this repo
2. Commit changes (for version control)
3. **Manually copy entire content** to OpenAI Agent Builder:
   - Go to platform.openai.com
   - Open your workflow
   - Paste into System Instructions
   - Save

**What the prompt does:**
- Instructs LLM to use MCP tools (never training data for weather)
- Hides technical details (coordinates, MCP terminology, tool names)
- Keeps responses SHORT (2-4 sentences for simple queries)
- Lists all supported crops
- Restricts web search to agricultural resources only

**Customization:** Modify `SYSTEM_PROMPT.md` to match your region, crops, and language preferences.

## 📁 Project Structure

```
gap-chat-widget/
├── server.js                  # Session server (creates ChatKit sessions + voice API proxy)
├── index.html                 # Landing page + chat container
├── chatkit.js                 # ChatKit configuration
├── script.js                  # Widget UI logic
├── styles.css                 # Custom styling
├── voice-manager.js           # Voice input/output manager (STT/TTS)
├── markdown-stripper.js       # Markdown to speech conversion
├── location-manager.js        # Geolocation handling
├── image-upload-manager.js    # Plant photo upload & diagnosis
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── package.json               # Dependencies
├── SYSTEM_PROMPT.md           # Agent Builder system prompt (CRITICAL!)
├── CLAUDE.md                  # Development guidance
└── README.md                  # This file
```

## 🚀 Deployment

This application can be deployed to any Node.js hosting platform:

- **PaaS:** Vercel, Netlify, Railway, Heroku, Render
- **Cloud:** AWS, Google Cloud, Azure
- **VPS:** DigitalOcean, Linode, your own server

### Generic Deployment Steps

1. **Push code to version control** (GitHub, GitLab, etc.)
2. **Choose hosting platform** based on your needs
3. **Configure environment variables:**
   - Set `OPENAI_API_KEY`
   - Set `WORKFLOW_ID`
   - Set `FARM_LATITUDE` and `FARM_LONGITUDE` for your region
4. **Deploy** using platform-specific method
5. **Test:** Open deployment URL in browser

### Test Deployment

```bash
# Health check
curl https://your-deployment-url/health

# Test session creation
curl -X POST https://your-deployment-url/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test"}'
```

## 🎨 Customization

### Update Default Location

Edit `.env` with coordinates for your region:
```bash
FARM_LATITUDE=XX.XXXX     # Your latitude
FARM_LONGITUDE=YY.YYYY    # Your longitude
```

### Change Colors

Edit `styles.css`:
```css
:root {
    --primary-color: #2d7a3e;      /* Main color */
    --secondary-color: #4a9d5f;    /* Secondary color */
    --accent-color: #f4a261;       /* Accent color */
}
```

### Modify Starter Prompts

Edit `chatkit.js` with region-specific prompts:
```javascript
starterPrompts: [
    {
        icon: '🌤️',
        label: 'Weather',
        prompt: 'What\'s the weather forecast?'
    },
    {
        icon: '🌱',
        label: 'Planting',
        prompt: 'Should I plant [your crop]?'
    }
]
```

### Update Content

Edit `index.html`:
- Change header title and description
- Update feature cards for your region
- Modify footer with your organization info

## 🎤 Voice Features

FarmerChat supports full voice interaction in both English and Swahili.

### Voice Input (Speech-to-Text)

- **Technology**: OpenAI Whisper API (whisper-1 model)
- **Languages**: Auto-detects English and Swahili
- **Accent support**: Optimized for Kenyan English and Swahili accents
- **Recording**: Up to 60 seconds per message
- **UI**: Orange microphone button with recording pulse animation

**Usage:**
1. Click the microphone button (🎤)
2. Grant microphone permission (first time)
3. Speak your question in English or Swahili
4. Click again to stop (or wait for auto-stop after 60s)
5. Transcription automatically sent to chat

### Voice Output (Text-to-Speech)

- **Technology**: OpenAI TTS API (tts-1-hd model)
- **Voice**: Nova (warm, friendly female voice)
- **Languages**: Supports both English and Swahili
- **Auto-play**: Responses automatically speak
- **Optimization**: Markdown stripped for natural speech

**Features:**
- Conversational markers added ("Okay", "Well", "Hmm")
- Farmer-friendly voice instructions for natural tone
- Handles Kenyan Swahili pronunciation well

### Voice API Endpoints

**Server provides two proxy endpoints:**

**POST /api/voice/transcribe** - Whisper STT proxy
```bash
curl -X POST http://localhost:3002/api/voice/transcribe \
  -F "audio=@recording.webm" \
  -F "model=whisper-1"
```

**POST /api/voice/speak** - TTS proxy
```bash
curl -X POST http://localhost:3002/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello farmer","voice":"nova","model":"tts-1-hd"}'
```

## 🌍 Swahili Language Support

FarmerChat is **fully bilingual** - English and Swahili.

### Language Features

- **Auto-detection**: Responds in the same language the user uses
- **Seamless switching**: Users can switch languages mid-conversation
- **Natural Swahili**: Uses conversational Kenyan Swahili dialect
- **Agricultural terms**: Familiar farming vocabulary (mahindi, kumwagilia, shamba)
- **Same brevity**: Short, concise responses in both languages

### Swahili Examples

**Weather query:**
```
User: "Hali ya hewa leo ni vipi?"
Bot: "Leo tutapata joto la 24°C na mvua kidogo (5mm) mchana..."
```

**Planting advice:**
```
User: "Je, nipande mahindi sasa?"
Bot: "✅ NDIO - Ni wakati mzuri kupanda mahindi! Joto ni 22°C..."
```

**Irrigation:**
```
User: "Nimwagilie leo?"
Bot: "Hapana leo - mvua ya 15mm inakuja mchana. Angalia udongo kesho."
```

### Configuring Swahili Support

Swahili support is **pre-configured** in `SYSTEM_PROMPT.md`. To customize:

1. Edit language guidelines in `SYSTEM_PROMPT.md`
2. Add region-specific Swahili agricultural terms
3. Update examples for your context
4. Copy updated prompt to Agent Builder
5. Test with Swahili queries

## 🔧 How It Works

### Session Flow

```
1. User opens index.html
   ↓
2. Frontend calls POST /api/chatkit/session
   ↓
3. server.js creates session with OpenAI:
   - Includes X-Farm-Latitude, X-Farm-Longitude headers
   - Returns client_secret to frontend
   ↓
4. ChatKit widget connects using client_secret
   ↓
5. User sends messages → Agent calls MCP tools
   ↓
6. MCP server receives coordinates from headers
   ↓
7. Responses shown in chat
```

### Default Coordinates

The session server (`server.js`) automatically injects farm coordinates as custom HTTP headers:

```javascript
headers: {
  'X-Farm-Latitude': FARM_LATITUDE,    // From .env
  'X-Farm-Longitude': FARM_LONGITUDE   // From .env
}
```

The MCP server reads these headers and uses them as defaults when users don't specify a location.

**User experience:** Users can ask "What's the weather?" without providing coordinates every time.

**Regional setup:** Configure default coordinates for your target region (city, district, or farm).

**Important:** Ensure your coordinates fall within TomorrowNow GAP Platform's coverage area, or users will receive errors when requesting weather data.

## 🐛 Troubleshooting

### Chat Won't Load

**Check:**
1. Browser console (F12 → Console)
2. `OPENAI_API_KEY` is set correctly
3. `WORKFLOW_ID` is correct (starts with `wf_`)
4. Session endpoint responding: `curl http://localhost:3002/health`

### Session Creation Fails

**Error:** `OPENAI_API_KEY environment variable is not set`

```bash
# Check .env file exists
ls -la .env

# Verify variables
grep OPENAI_API_KEY .env
grep WORKFLOW_ID .env
```

### Responses Show Technical Details

1. **Update MCP server** to latest version
2. **Update system prompt** in Agent Builder with latest `SYSTEM_PROMPT.md`
3. **Verify prompt emphasizes** hiding coordinates and technical terms

### Widget Styling Issues

1. Clear browser cache
2. Hard reload: Cmd/Ctrl + Shift + R
3. Check CSS is loading in Network tab

## 📚 Resources

- **GitHub:** https://github.com/eagleisbatman/gap-chat-widget
- **MCP Server:** https://github.com/eagleisbatman/gap-agriculture-mcp
- **OpenAI ChatKit:** https://platform.openai.com/docs/guides/chatkit
- **Agent Builder:** https://platform.openai.com/playground/agents

## 🔑 Setup Checklist

- [ ] MCP server deployed
- [ ] Agent Builder workflow created
- [ ] MCP server connected to Agent Builder
- [ ] Workflow ID obtained
- [ ] `SYSTEM_PROMPT.md` copied to Agent Builder
- [ ] `.env` file created with all variables
- [ ] Default coordinates configured for your region
- [ ] Test locally: `npm start`
- [ ] Deploy to production
- [ ] Test production deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Open source agricultural intelligence for farmers worldwide 🌾**

[⭐ Star this repo](https://github.com/eagleisbatman/gap-chat-widget)
