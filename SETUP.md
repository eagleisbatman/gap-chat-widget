# 🌾 FarmerChat Widget Setup Guide

Complete setup guide for testing the FarmerChat ChatKit widget locally.

---

## 📋 Prerequisites

- ✅ Node.js >= 18.0.0
- ✅ OpenAI API Key
- ✅ Workflow ID: `wf_68df4b13b3588190a09d19288d4610ec0df388c3983f58d1`

---

## 🚀 Quick Start (3 Minutes)

### Step 1: Add Your OpenAI API Key

Edit the `.env` file and add your OpenAI API key:

```bash
# .env
OPENAI_API_KEY=sk-proj-your_actual_openai_api_key_here
PORT=3002
```

### Step 2: Start the Server

```bash
npm start
```

You should see:

```
🚀 =========================================
   ChatKit Session Server
=========================================
✅ Server running on http://localhost:3002
📍 Health check: http://localhost:3002/health
🔐 Session endpoint: http://localhost:3002/api/chatkit/session
🌾 Workflow ID: wf_68df4b13b3588190a09d19288d4610ec0df388c3983f58d1
🔑 OpenAI API Key: ✅ Configured
=========================================
📂 Serving static files from: ...
🌐 Open: http://localhost:3002/index.html
=========================================
```

### Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:3002/index.html
```

### Step 4: Click the Chat Button

Click the floating chat button (bottom right) or the "Start Chat" button.

The ChatKit widget will load with your FarmerChat agent!

---

## 🧪 Testing

### Test Queries

Try these queries to test the integration:

1. **Weather Forecast** (uses header coordinates 1.2921, 36.8219):
   ```
   What's the weather forecast?
   ```

2. **Planting Advice**:
   ```
   Should I plant maize?
   ```

3. **Irrigation Advisory**:
   ```
   Do I need to irrigate this week?
   ```

4. **Comprehensive Advisory**:
   ```
   Give me farming recommendations for the next 2 weeks for maize.
   ```

---

## 🔧 Configuration

### Workflow ID

Already configured in `chatkit.js`:
```javascript
workflowId: 'wf_68df4b13b3588190a09d19288d4610ec0df388c3983f58d1'
```

### Default Farm Coordinates

The MCP server is configured with default coordinates (Nairobi region):
- Latitude: 1.2921
- Longitude: 36.8219

Users don't need to provide coordinates - they're read from the MCP server's custom headers.

### Starter Prompts

Pre-configured quick actions in `chatkit.js`:
- ☀️ Weather Forecast
- 🌱 Planting Advice
- 💧 Irrigation Schedule
- 🌾 Farming Advisory

---

## 📁 File Structure

```
gap-chat-widget/
├── server.js              # Backend session server
├── chatkit.js             # ChatKit integration
├── index.html             # Main page with widget
├── styles.css             # Styling
├── script.js              # Chat UI controls
├── package.json           # Dependencies
├── .env                   # Your OpenAI API key (not committed)
├── .env.example           # Template
└── SETUP.md               # This file
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Problem**: `OPENAI_API_KEY is not set`

**Solution**: Add your API key to `.env` file:
```bash
OPENAI_API_KEY=sk-proj-your_key_here
```

### ChatKit Widget Won't Load

**Problem**: "Loading FarmerChat..." stays forever

**Solutions**:
1. Check browser console for errors (F12)
2. Verify server is running on port 3002
3. Check that CDN script loaded:
   ```
   https://cdn.platform.openai.com/deployments/chatkit/chatkit.js
   ```

### Session Creation Fails

**Problem**: "Failed to create ChatKit session"

**Solutions**:
1. Verify OpenAI API key is valid
2. Check server logs for detailed error
3. Test health endpoint:
   ```bash
   curl http://localhost:3002/health
   ```

### No Response from Agent

**Problem**: Agent doesn't respond or gives errors

**Solutions**:
1. Verify workflow ID is correct in Agent Builder
2. Check MCP server is running at: `https://gap-agriculture-mcp-production.up.railway.app`
3. Test MCP server health:
   ```bash
   curl https://gap-agriculture-mcp-production.up.railway.app/health
   ```

---

## 🎨 Customization

### Change Colors

Edit `chatkit.js`:
```javascript
theme: {
    primaryColor: '#4a7c2e',  // Green for agriculture
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}
```

### Change Greeting Message

Edit `chatkit.js`:
```javascript
greeting: 'Your custom greeting here...'
```

### Change Starter Prompts

Edit `chatkit.js`:
```javascript
starterPrompts: [
    {
        label: '☀️ Your Label',
        prompt: 'Your prompt here'
    }
]
```

---

## 🌐 Production Deployment

### Option 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Deploy to Railway

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variable: `OPENAI_API_KEY`
4. Railway auto-deploys

### Option 3: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 📞 Need Help?

- Check server logs for detailed errors
- Test health endpoint: http://localhost:3002/health
- Verify MCP server: https://gap-agriculture-mcp-production.up.railway.app/health
- Check browser console (F12) for JavaScript errors

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Can access http://localhost:3002/index.html
- [ ] Chat widget loads successfully
- [ ] Can send messages
- [ ] Agent responds with weather data
- [ ] Starter prompts work
- [ ] Weather forecast returns real data for Kenya

---

**Built with ❤️ for farmers in Kenya and East Africa**
