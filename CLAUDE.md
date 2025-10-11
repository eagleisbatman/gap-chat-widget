# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: FarmerChat Widget

**Node.js session server + HTML chat widget that embeds OpenAI ChatKit for farmer-friendly agricultural conversations.**

## Architecture

Two main components:

### 1. Session Server (server.js)
- Express.js server that creates OpenAI ChatKit sessions
- Passes default farm coordinates via custom HTTP headers
- Serves static frontend files
- Handles session creation and refresh

### 2. Frontend Widget (index.html + chatkit.js)
- Landing page with embedded OpenAI ChatKit widget
- Floating chat button (bottom-right)
- Connects to session server for authentication
- No direct calls to MCP server (goes through OpenAI Agent Builder)

## Key Files

### server.js
**Session management server**
- Creates ChatKit sessions with OpenAI API
- Injects X-Farm-Latitude and X-Farm-Longitude headers
- Serves static HTML/CSS/JS files
- Port: 3002 (configurable)

### index.html
**Landing page with embedded chat widget**
- Agricultural-themed landing page
- Floating chat button
- ChatKit widget container
- Loads chatkit.js configuration

### chatkit.js
**ChatKit configuration and initialization**
- Workflow ID configuration
- Session creation logic
- Starter prompts (weather, planting, irrigation queries)
- Custom styling

### SYSTEM_PROMPT.md
**Complete Agent Builder system prompt**
- Critical resource: Copy this to OpenAI Agent Builder
- Defines LLM behavior, tool usage, response style
- Emphasizes hiding technical details
- Lists all 22 supported crops
- Restricts web search to agricultural resources

## Development Commands

```bash
# Install dependencies
npm install

# Start session server
npm start
# or
npm run dev

# Server runs on http://localhost:3002

# Test in browser
open http://localhost:3002/index.html

# Test health endpoint
curl http://localhost:3002/health

# Test session creation
curl -X POST http://localhost:3002/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device"}'
```

## Environment Variables

Required:
```bash
OPENAI_API_KEY=<key>      # OpenAI API key
WORKFLOW_ID=<wf_id>       # Agent Builder workflow ID (starts with wf_)
```

Optional:
```bash
PORT=3002                 # Server port (default: 3002)
FARM_LATITUDE=-1.2864     # Default farm latitude (Nairobi)
FARM_LONGITUDE=36.8172    # Default farm longitude (Nairobi)
```

## Session Server Flow

```
User opens index.html
    ↓
ChatKit widget initializes
    ↓
Calls POST /api/chatkit/session
    ↓
server.js creates session with OpenAI
    ↓ [includes X-Farm-Latitude, X-Farm-Longitude headers]
OpenAI creates ChatKit session
    ↓
Returns client_secret to frontend
    ↓
ChatKit connects using client_secret
    ↓
User sends messages
    ↓
OpenAI Agent Builder calls MCP tools
    ↓ [MCP server receives coordinates from headers]
Responses shown in chat widget
```

## Key API Endpoints

### POST /api/chatkit/session
**Creates new ChatKit session**

Request:
```json
{
  "deviceId": "optional-device-id"
}
```

Response:
```json
{
  "client_secret": "cs_...",
  "session_id": "sess_...",
  "created_at": "2025-10-11T..."
}
```

Important: Injects custom headers:
```javascript
headers: {
  'X-Farm-Latitude': FARM_LATITUDE,
  'X-Farm-Longitude': FARM_LONGITUDE
}
```

These headers are passed to MCP server as default coordinates.

### POST /api/chatkit/refresh
**Refreshes expired session**

Request:
```json
{
  "currentClientSecret": "cs_...",
  "deviceId": "optional-device-id"
}
```

### GET /health
**Health check endpoint**

Response:
```json
{
  "status": "healthy",
  "service": "chatkit-session-server",
  "workflowId": "wf_...",
  "timestamp": "2025-10-11T..."
}
```

## ChatKit Configuration

In `chatkit.js`:

```javascript
const CHATKIT_CONFIG = {
    workflowId: process.env.WORKFLOW_ID,  // Set in .env
    sessionEndpoint: '/api/chatkit/session',
    starterPrompts: [
        { icon: '🌤️', label: 'Weather', prompt: 'What\'s the weather?' },
        { icon: '🌱', label: 'Planting', prompt: 'Should I plant maize?' },
        // ... more prompts
    ],
    greeting: 'Hello! I\'m FarmerChat...'
};
```

## System Prompt (SYSTEM_PROMPT.md)

**CRITICAL: This must be manually copied to OpenAI Agent Builder.**

The file contains:
1. Data source restrictions (use MCP tools only, never training data)
2. Coordinate handling (defaults pre-configured, hide from users)
3. **Instructions to hide technical details** (MCP, coordinates, tool names)
4. Tool descriptions and data architecture explanation
5. 22 supported crops
6. Web search restrictions (agricultural resources only)
7. **Response style: SHORT and SIMPLE** (2-4 sentences for basic queries)
8. Error handling (farmer-friendly messages)
9. Data attribution (TomorrowNow GAP Platform)
10. Example interactions

### Key Prompt Sections

**Section 3: Hiding Technical Information**
- Never mention "MCP", coordinates, API details
- Say "Based on weather data from TomorrowNow GAP Platform"
- Focus on agricultural insights, not data mechanics

**Section 4: Data Architecture**
- Explains: GAP → MCP → Agent → User
- GAP provides weather ONLY
- MCP analyzes weather for agriculture
- Agent presents advice simply

**Section 7: Response Style - BREVITY**
- Simple queries: 2-3 sentences
- Planting decision: 3-4 sentences + 1-2 actions
- Irrigation: 4-5 sentences max
- Avoid long explanations

## Updating System Prompt

When you modify `SYSTEM_PROMPT.md`:

1. **Commit to Git** (for version control)
```bash
git add SYSTEM_PROMPT.md
git commit -m "Update system prompt: [description]"
git push
```

2. **Manually update Agent Builder**
- Go to platform.openai.com
- Find your workflow (WORKFLOW_ID from .env)
- Navigate to System Instructions
- Copy entire SYSTEM_PROMPT.md content
- Paste into Agent Builder
- Save workflow

3. **Test changes**
- Use Agent Builder playground
- Test in chat widget
- Verify responses follow new instructions

## Deployment (Vercel/Netlify)

### Vercel
```bash
vercel

# Set environment variables in Vercel dashboard:
# OPENAI_API_KEY
# WORKFLOW_ID
# FARM_LATITUDE (optional)
# FARM_LONGITUDE (optional)
```

### Netlify
```bash
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

**Important:** The session server (server.js) must be deployed, not just static files. Both Vercel and Netlify support Node.js servers.

## Default Coordinates

Nairobi region, Kenya:
- Latitude: -1.2864 (1.2864°S)
- Longitude: 36.8172 (36.8172°E)

These are injected into ChatKit sessions via custom headers. The MCP server reads them from headers and uses as defaults when user doesn't provide coordinates.

**User experience:** Farmers don't need to provide coordinates for every query. The system uses Nairobi defaults, making the chat simpler.

## Testing Flow

### 1. Test Session Server
```bash
npm start

# In another terminal:
curl http://localhost:3002/health
# Expected: {"status":"healthy",...}

curl -X POST http://localhost:3002/api/chatkit/session \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test"}'
# Expected: {"client_secret":"cs_...","session_id":"sess_..."}
```

### 2. Test Frontend
```bash
# With server running:
open http://localhost:3002/index.html

# Should see:
# - Landing page loads
# - Floating chat button (bottom-right)
# - Click button → chat widget opens
# - Starter prompts visible
```

### 3. Test Complete Flow
```
1. Click chat widget
2. Send: "What's the weather?"
3. Verify:
   - Response uses real GAP data
   - No coordinates shown
   - Mentions "TomorrowNow GAP Platform"
   - Concise (2-4 sentences)
4. Send: "Should I plant maize?"
5. Verify:
   - YES/NO decision
   - Brief reasoning
   - Actionable advice
```

## Customization

### Change Default Location
Edit `.env`:
```bash
FARM_LATITUDE=-0.0917  # Different latitude
FARM_LONGITUDE=34.7681  # Different longitude
```

### Update Starter Prompts
Edit `chatkit.js`:
```javascript
starterPrompts: [
    {
        icon: '🌤️',
        label: 'Your Custom Label',
        prompt: 'Your custom prompt here'
    },
    // Add more...
]
```

### Change Branding
Edit `index.html` and `styles.css`:
- Colors (CSS variables in styles.css)
- Logo/images
- Text content
- Footer information

## Common Issues

**Widget not loading:**
- Check browser console (F12 → Console)
- Verify OPENAI_API_KEY is set
- Verify WORKFLOW_ID is correct (starts with `wf_`)
- Check session endpoint is responding

**Session creation fails:**
- Check OpenAI API key is valid
- Check workflow ID exists in OpenAI platform
- Check internet connection
- Review server logs

**MCP tools not working:**
- Verify MCP server is deployed (Railway)
- Check Agent Builder has MCP connection configured
- Test MCP server health endpoint
- Check Railway logs for errors

**Responses showing coordinates:**
- Update SYSTEM_PROMPT.md to emphasize hiding coordinates
- Re-copy prompt to Agent Builder
- Check MCP server responses (should not include coordinates)
- Verify MCP server is latest version

## File Structure

```
gap-chat-widget/
├── server.js              # Session server (Express.js)
├── index.html            # Landing page + widget container
├── chatkit.js            # ChatKit configuration
├── styles.css            # Custom styling
├── package.json          # Dependencies
├── .env                  # Environment variables (not committed)
├── SYSTEM_PROMPT.md      # Agent Builder prompt (commit this)
└── CLAUDE.md            # This file
```

## Related Resources

- **OpenAI ChatKit Docs:** https://platform.openai.com/docs/guides/chatkit
- **Agent Builder:** https://platform.openai.com/agent-builder
- **MCP Server Repo:** https://github.com/eagleisbatman/gap-agriculture-mcp
- **Widget Repo:** https://github.com/eagleisbatman/gap-chat-widget

## GitHub Repository

https://github.com/eagleisbatman/gap-chat-widget

Push to `main` triggers auto-deployment if connected to Vercel/Netlify.

## Integration with MCP Server

The widget does NOT call the MCP server directly. Flow:

```
User → ChatKit Widget → OpenAI Agent Builder → MCP Server → GAP API
                ↑                                   ↓
                └────────── Response ───────────────┘
```

- Widget creates session with workflow ID
- OpenAI Agent Builder has MCP connection configured
- Agent calls MCP tools based on user messages
- Responses formatted by Agent (using system prompt guidance)
- Widget displays responses to user

## Important Notes

1. **System prompt changes require manual update** in Agent Builder (not automatic)
2. **Custom headers are session-level**, set when creating session
3. **No direct MCP calls** from frontend (security/architecture)
4. **Coordinates hidden** through prompt engineering + MCP server response formatting
5. **Brevity emphasized** in system prompt (farmers prefer short answers)
