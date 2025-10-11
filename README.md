# 🌾 FarmerChat Widget

**OpenAI ChatKit-powered chat widget for agricultural intelligence in Kenya and East Africa.**

Complete chat interface with session server that connects farmers to real-time weather forecasts, planting recommendations, and irrigation advice through conversational AI.

## ✨ Features

- 💬 Floating chat widget with clean agricultural theme
- 🌤️ Real-time weather forecasts via OpenAI Agent Builder + MCP
- 🌱 Farmer-friendly responses (no technical jargon, coordinates, or MCP terminology)
- 📱 Fully responsive (desktop, tablet, mobile)
- ⚡ Session server with default farm coordinates
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

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- OpenAI API key
- Agent Builder workflow ID
- MCP server deployed (see [gap-agriculture-mcp](https://github.com/eagleisbatman/gap-agriculture-mcp))

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
FARM_LATITUDE=-1.2864      # Default: Nairobi, Kenya
FARM_LONGITUDE=36.8172
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
| `FARM_LATITUDE` | Optional | Default farm latitude (default: -1.2864) |
| `FARM_LONGITUDE` | Optional | Default farm longitude (default: 36.8172) |
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
- Lists all 22 supported crops
- Restricts web search to agricultural resources only

## 📁 Project Structure

```
gap-chat-widget/
├── server.js              # Session server (creates ChatKit sessions)
├── index.html             # Landing page + chat container
├── chatkit.js             # ChatKit configuration
├── script.js              # Widget UI logic
├── styles.css             # Custom styling
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── package.json           # Dependencies
├── SYSTEM_PROMPT.md       # Agent Builder system prompt (CRITICAL!)
├── CLAUDE.md              # Development guidance
└── README.md              # This file
```

## 🚂 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
#   OPENAI_API_KEY
#   WORKFLOW_ID
#   FARM_LATITUDE (optional)
#   FARM_LONGITUDE (optional)
```

### Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/health

# Test session creation
curl -X POST https://your-app.vercel.app/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test"}'
```

## 🎨 Customization

### Update Default Location

Edit `.env`:
```bash
FARM_LATITUDE=-0.0917     # Example: Kisumu
FARM_LONGITUDE=34.7681
```

### Change Colors

Edit `styles.css`:
```css
:root {
    --primary-color: #2d7a3e;      /* Main green */
    --secondary-color: #4a9d5f;    /* Light green */
    --accent-color: #f4a261;       /* Orange */
}
```

### Modify Starter Prompts

Edit `chatkit.js`:
```javascript
starterPrompts: [
    {
        icon: '🌤️',
        label: 'Your Label',
        prompt: 'Your custom prompt'
    }
]
```

### Update Content

Edit `index.html`:
- Header title
- Feature cards
- Footer text

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

The session server (`server.js`) automatically injects farm coordinates as custom HTTP headers when creating ChatKit sessions:

```javascript
headers: {
  'X-Farm-Latitude': FARM_LATITUDE,    // From .env
  'X-Farm-Longitude': FARM_LONGITUDE   // From .env
}
```

The MCP server reads these headers and uses them as default coordinates when users don't specify a location.

**User experience:** Farmers can simply ask "What's the weather?" without providing coordinates every time.

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

### Responses Show Coordinates/Technical Details

1. **Update MCP server** to latest version (should hide coordinates)
2. **Update system prompt** in Agent Builder with latest `SYSTEM_PROMPT.md`
3. **Test MCP server directly:** Check responses from `/mcp` endpoint

### Widget Styling Issues

1. Clear browser cache
2. Hard reload: Cmd/Ctrl + Shift + R
3. Check CSS is loading in Network tab

## 📚 Resources

- **GitHub:** https://github.com/eagleisbatman/gap-chat-widget
- **MCP Server:** https://github.com/eagleisbatman/gap-agriculture-mcp
- **OpenAI ChatKit:** https://platform.openai.com/docs/guides/chatkit
- **Agent Builder:** https://platform.openai.com/playground/agents

## 🔑 Environment Setup Checklist

- [ ] MCP server deployed to Railway
- [ ] Agent Builder workflow created
- [ ] MCP server connected to Agent Builder
- [ ] Workflow ID obtained
- [ ] `SYSTEM_PROMPT.md` copied to Agent Builder
- [ ] `.env` file created with all variables
- [ ] Test locally: `npm start`
- [ ] Deploy to Vercel
- [ ] Test production deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Built for farmers in Kenya and East Africa 🌾**

[⭐ Star this repo](https://github.com/eagleisbatman/gap-chat-widget)
