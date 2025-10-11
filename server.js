/**
 * ChatKit Session Server
 *
 * This Express server creates ChatKit sessions and handles authentication
 * with your OpenAI workflow.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.WORKFLOW_ID;
const FARM_LATITUDE = process.env.FARM_LATITUDE || '-1.2864';
const FARM_LONGITUDE = process.env.FARM_LONGITUDE || '36.8172';

// Middleware
app.use(cors({
  origin: '*', // In production, restrict to your domain
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chatkit-session-server',
    workflowId: WORKFLOW_ID,
    timestamp: new Date().toISOString()
  });
});

// Create ChatKit session endpoint
app.post('/api/chatkit/session', async (req, res) => {
  try {
    console.log('[ChatKit] Creating new session...');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    if (!WORKFLOW_ID) {
      throw new Error('WORKFLOW_ID environment variable is not set');
    }

    // Get or generate device ID
    const deviceId = req.body.deviceId || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get coordinates from request body or use environment defaults
    const latitude = req.body.latitude || FARM_LATITUDE;
    const longitude = req.body.longitude || FARM_LONGITUDE;
    const locationSource = req.body.locationSource || 'default';

    console.log(`[ChatKit] Device ID: ${deviceId}`);
    console.log(`[ChatKit] Coordinates: ${latitude}, ${longitude} (source: ${locationSource})`);

    // Create session with OpenAI ChatKit API
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'X-Farm-Latitude': latitude.toString(),
        'X-Farm-Longitude': longitude.toString()
      },
      body: JSON.stringify({
        workflow: { id: WORKFLOW_ID },
        user: deviceId,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ChatKit] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[ChatKit] Session created successfully');

    res.json({
      client_secret: data.client_secret,
      session_id: data.id,
      created_at: data.created_at
    });

  } catch (error) {
    console.error('[ChatKit] Error creating session:', error.message);
    res.status(500).json({
      error: 'Failed to create ChatKit session',
      message: error.message,
      details: error.toString()
    });
  }
});

// Refresh session endpoint (optional, for session renewal)
app.post('/api/chatkit/refresh', async (req, res) => {
  try {
    const { currentClientSecret } = req.body;

    if (!currentClientSecret) {
      return res.status(400).json({ error: 'currentClientSecret is required' });
    }

    console.log('[ChatKit] Refreshing session...');

    // In a real implementation, you'd validate and refresh the session
    // For now, we'll create a new session
    const deviceId = req.body.deviceId || `device-${Date.now()}`;

    // Get coordinates from request body or use environment defaults
    const latitude = req.body.latitude || FARM_LATITUDE;
    const longitude = req.body.longitude || FARM_LONGITUDE;

    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'X-Farm-Latitude': latitude.toString(),
        'X-Farm-Longitude': longitude.toString()
      },
      body: JSON.stringify({
        workflow: { id: WORKFLOW_ID },
        user: deviceId,
      })
    });

    const data = await response.json();
    res.json({ client_secret: data.client_secret });

  } catch (error) {
    console.error('[ChatKit] Error refreshing session:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 =========================================');
  console.log('   ChatKit Session Server');
  console.log('=========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Session endpoint: http://localhost:${PORT}/api/chatkit/session`);
  console.log(`🌾 Workflow ID: ${WORKFLOW_ID}`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY ? '✅ Configured' : '⚠️  NOT CONFIGURED'}`);
  console.log('=========================================');
  console.log(`📂 Serving static files from: ${process.cwd()}`);
  console.log(`🌐 Open: http://localhost:${PORT}/index.html`);
  console.log('=========================================');
  console.log('');
});
