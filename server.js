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
import multer from 'multer';
import FormData from 'form-data';

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.WORKFLOW_ID;
const FARM_LATITUDE = process.env.FARM_LATITUDE || '-1.2864';
const FARM_LONGITUDE = process.env.FARM_LONGITUDE || '36.8172';

// Multer for handling audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max (OpenAI Whisper limit)
  }
});

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
        user: deviceId
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
        user: deviceId
      })
    });

    const data = await response.json();
    res.json({ client_secret: data.client_secret });

  } catch (error) {
    console.error('[ChatKit] Error refreshing session:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

// Voice transcription endpoint (Whisper API)
app.post('/api/voice/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('[Voice] Transcription request received');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioBuffer = req.file.buffer;
    const model = req.body.model || 'whisper-1';
    const language = req.body.language || null; // Auto-detect if not specified
    const temperature = parseFloat(req.body.temperature || '0.2');

    console.log(`[Voice] Transcribing audio (${(audioBuffer.length / 1024).toFixed(2)}KB) with model: ${model}`);

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: req.file.mimetype || 'audio/webm'
    });
    formData.append('model', model);
    if (language) {
      formData.append('language', language);
    }
    formData.append('temperature', temperature.toString());

    // Call Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice] Whisper API error:', response.status, errorText);
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Voice] Transcription successful:', data.text.substring(0, 100));

    res.json({
      text: data.text,
      language: data.language || 'unknown'
    });

  } catch (error) {
    console.error('[Voice] Transcription error:', error.message);
    res.status(500).json({
      error: 'Transcription failed',
      message: error.message
    });
  }
});

// Text-to-speech endpoint (TTS API)
app.post('/api/voice/speak', async (req, res) => {
  try {
    console.log('[Voice] TTS request received');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { text, model = 'tts-1-hd', voice = 'nova', speed = 1.0, instructions } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log(`[Voice] Generating speech with ${voice} voice: "${text.substring(0, 100)}..."`);

    // Prepare input text with instructions if provided
    let inputText = text;
    if (instructions) {
      // For models that support instructions, prepend them
      // Note: Standard TTS doesn't use instructions, but we log them
      console.log(`[Voice] Voice instructions: ${instructions.substring(0, 100)}`);
    }

    // Call TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: inputText,
        voice: voice,
        speed: speed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voice] TTS API error:', response.status, errorText);
      throw new Error(`TTS API error: ${response.status}`);
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    console.log(`[Voice] TTS successful, audio size: ${(audioBuffer.byteLength / 1024).toFixed(2)}KB`);

    // Send audio back to client
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('[Voice] TTS error:', error.message);
    res.status(500).json({
      error: 'TTS failed',
      message: error.message
    });
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
  console.log(`🎤 Voice transcribe: http://localhost:${PORT}/api/voice/transcribe`);
  console.log(`🔊 Voice TTS: http://localhost:${PORT}/api/voice/speak`);
  console.log(`🌾 Workflow ID: ${WORKFLOW_ID}`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY ? '✅ Configured' : '⚠️  NOT CONFIGURED'}`);
  console.log('=========================================');
  console.log(`📂 Serving static files from: ${process.cwd()}`);
  console.log(`🌐 Open: http://localhost:${PORT}/index.html`);
  console.log('=========================================');
  console.log('');
});
