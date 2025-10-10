# FarmerChat Widget

AI-powered agriculture assistant chat widget integrated with OpenAI ChatKit and GAP MCP server.

## Features

- 🌾 Clean agriculture-focused landing page
- 💬 Floating chat widget powered by OpenAI ChatKit
- 🌤️ Real-time weather forecasts for Kenya
- 🌱 Planting recommendations
- 💧 Irrigation advisory
- 📱 Fully responsive design
- ⚡ Fast and lightweight

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- OpenAI Agent Builder workflow ID
- GAP MCP server deployed (optional, configured in Agent Builder)

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gap-chat-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3002
   ```

4. **Update workflow ID** in `chatkit.js`:
   ```javascript
   const CHATKIT_CONFIG = {
       workflowId: 'wf_your_workflow_id_here',
       // ...
   };
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3002/index.html
   ```

## Deploy to Railway

1. **Install Railway CLI** (if not already installed)
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize and deploy**
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables** in Railway dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3002 (or Railway will auto-assign)

5. **Get your deployment URL** from Railway dashboard

## ChatKit Integration

To connect with OpenAI ChatKit:

### Step 1: Complete Prerequisites

1. ✅ MCP server deployed to Railway
2. ✅ OpenAI Agent Builder workflow created
3. ✅ Workflow ID obtained

### Step 2: Create Session Endpoint

You need a backend endpoint to create ChatKit sessions. Two options:

#### Option A: Use Next.js (Recommended)

```bash
# Clone ChatKit starter
git clone https://github.com/openai/openai-chatkit-starter-app

# Install and configure
cd openai-chatkit-starter-app
npm install

# Add to .env.local
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_CHATKIT_WORKFLOW_ID=your_workflow_id

# Deploy
vercel
```

Then update `chatkit.js`:
```javascript
createSessionEndpoint: 'https://your-chatkit-api.vercel.app/api/create-session'
```

#### Option B: Simple Express Server

Create `server/session.js`:
```javascript
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/create-session', async (req, res) => {
  const response = await fetch('https://api.openai.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow_id: process.env.WORKFLOW_ID
    })
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3001);
```

### Step 3: Update Configuration

Edit `chatkit.js`:

```javascript
const CHATKIT_CONFIG = {
    workflowId: 'your_actual_workflow_id',
    createSessionEndpoint: 'https://your-api.vercel.app/api/create-session',
    // ... rest of config
};
```

### Step 4: Load ChatKit Library

Add to `index.html` before `</body>`:

```html
<script type="module">
  import { ChatKit } from 'https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js';

  // Initialize ChatKit
  const chatkit = new ChatKit({
    workflowId: 'YOUR_WORKFLOW_ID',
    container: document.getElementById('chatkitWidget'),
    // ... configuration
  });

  await chatkit.render();
</script>
```

## File Structure

```
gap-chat-widget/
├── index.html          # Main page
├── styles.css          # Styling
├── script.js           # Chat widget logic
├── chatkit.js          # ChatKit configuration
└── README.md           # This file
```

## Customization

### Colors

Edit `styles.css`:

```css
:root {
    --primary-color: #2d7a3e;      /* Main green */
    --secondary-color: #4a9d5f;    /* Light green */
    --accent-color: #f4a261;       /* Orange accent */
}
```

### Starter Prompts

Edit `chatkit.js`:

```javascript
starterPrompts: [
    {
        icon: '☀️',
        label: 'Your Label',
        prompt: 'Your prompt text with coordinates'
    },
    // Add more...
]
```

### Content

Edit `index.html`:
- Update header title
- Modify feature cards
- Change footer text

## Integration with MCP Server

The chat widget connects to your MCP server through OpenAI Agent Builder:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Chat Widget │────▶│   ChatKit    │────▶│OpenAI Agent  │────▶│  MCP Server  │
│  (Browser)   │     │   (OpenAI)   │     │   Builder    │     │  (Railway)   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

## Default Location

The widget uses Kenya coordinates by default:
- Latitude: -1.404244
- Longitude: 35.008688

To enable auto-location detection, uncomment in `chatkit.js`:

```javascript
const location = await getUserLocation();
// Use location.lat and location.lon in prompts
```

## Responsive Design

- Desktop: 400x600px floating widget
- Tablet: Adaptive sizing
- Mobile: Full-screen chat when opened

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Deployment Checklist

- [ ] MCP server running on Railway
- [ ] OpenAI Agent Builder workflow configured
- [ ] Workflow ID obtained
- [ ] Session endpoint created
- [ ] `chatkit.js` updated with credentials
- [ ] ChatKit library loaded
- [ ] Test locally
- [ ] Deploy to Vercel/Netlify
- [ ] Test live deployment

## Troubleshooting

### Chat won't load
- Check browser console for errors
- Verify workflow ID is correct
- Ensure session endpoint is accessible
- Check CORS settings

### ChatKit not initializing
- Verify OpenAI API key is valid
- Check session endpoint returns proper response
- Ensure ChatKit library is loaded

### Styling issues
- Clear browser cache
- Check CSS is loading
- Verify no conflicting styles

## Next Steps

1. **Test locally**: Open `index.html` and verify layout
2. **Deploy MCP server**: Follow `gap-mcp-server/README.md`
3. **Configure Agent Builder**: See main project README
4. **Update credentials**: Edit `chatkit.js`
5. **Deploy**: Use Vercel or Netlify
6. **Test end-to-end**: Verify complete flow works

## Examples

### Example Queries

Once integrated, users can ask:

- "What's the weather forecast for -1.404244, 35.008688?"
- "Should I plant maize at coordinates -0.05, 37.65?"
- "Do I need irrigation this week? My location is -1.404244, 35.008688"
- "Give me farming advice for wheat, location -1.404244, 35.008688"

### Custom Prompts

Add region-specific prompts:

```javascript
{
    icon: '🌍',
    label: 'Nairobi Weather',
    prompt: 'Weather forecast for Nairobi, Kenya (-1.286389, 36.817223)'
}
```

## Support

For issues:
- Check main project README
- Review OpenAI ChatKit docs
- Check Railway deployment logs

## License

MIT
