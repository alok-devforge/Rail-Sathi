require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const OpenAI = require('openai').default;

const app = express();

// In production (DigitalOcean) allow all origins — the app connects from
// Expo Go / installed APK, not a browser, so origin may be null or the device IP.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : null; // null = allow all

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('CORS: origin not allowed'));
      }
    : '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ─── Groq AI Search (groq.com — OpenAI-compatible) ────────────────────────────
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

app.post('/api/ai-search', async (req, res) => {
  const { userQuery } = req.body;
  if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
    return res.status(400).json({ error: 'userQuery is required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const prompt = `You are a helpful Indian Railways travel assistant. Today's date is ${today}.

Extract travel details from the user's query and return ONLY a raw JSON object (no markdown, no backticks, no explanation).

The JSON must have exactly these fields:
- "sourceStationCode": 2-4 letter Indian Railways station code (e.g. "HWH", "NDLS", "BCT", "MAS", "SBC", "SC")
- "destStationCode": same format
- "date": ISO date string "YYYY-MM-DD" (convert relative terms like "tomorrow", "next Friday", "this weekend" based on today ${today})
- "sourceName": human-readable city name
- "destName": human-readable city name

Common mappings:
Howrah/Calcutta/Kolkata → HWH
Delhi/New Delhi → NDLS
Mumbai/Bombay → BCT
Chennai/Madras → MAS
Bangalore/Bengaluru → SBC
Hyderabad/Secunderabad → SC
Guwahati → GHY
Patna → PNBE
Lucknow → LKO
Bhopal → BPL
Nagpur → NGP
Visakhapatnam/Vizag → VSKP
Kharagpur → KGP

If you cannot recognise the source or destination city, set that code to null.
If no date is mentioned, use today's date (${today}).

User query: "${userQuery.trim()}"

Respond with ONLY the JSON object, nothing else.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const text = (completion.choices[0].message.content ?? '').trim();
    const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('[ai-search] Bad JSON from Groq:', clean);
      return res.status(400).json({ error: 'AI returned unrecognisable response', raw: clean });
    }

    if (!parsed.sourceStationCode || !parsed.destStationCode) {
      return res.status(400).json({ error: 'Could not recognise one or both stations', parsed });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[ai-search] Groq error:', err.message);
    return res.status(500).json({ error: 'AI service error', detail: err.message });
  }
});

// ─── Station Guide (Groq-powered local tips) ──────────────────────────────────
app.post('/api/station-guide', async (req, res) => {
  const { stationCode, stationName, delayMinutes, question } = req.body;
  if (!stationName || typeof stationName !== 'string') {
    return res.status(400).json({ error: 'stationName is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const delayHours = Math.round((Number(delayMinutes) || 0) / 60);
  const delayText = delayMinutes ? `${delayHours} hour${delayHours !== 1 ? 's' : ''}` : 'some time';
  const userQ = question?.trim() || `My train is delayed ${delayText}. What can I do nearby?`;

  const prompt = `You are an expert Indian Railways station guide with detailed knowledge of major Indian railway stations, their on-platform facilities, nearby eateries, rest areas, and traveller tips.

Station: ${stationName}${stationCode ? ` (${stationCode})` : ''}
Delay situation: Passenger's train is delayed by approximately ${delayText}.
Passenger asks: "${userQ}"

Respond with ONLY a raw JSON object (no markdown, no backticks, no extra text) in exactly this structure:
{
  "summary": "1-2 sentence overview of what makes this station convenient for a long wait",
  "suggestions": [
    {
      "category": "Food & Drinks",
      "emoji": "🍽️",
      "items": ["specific item or place", "specific item or place", "specific item or place"]
    },
    {
      "category": "Rest & Waiting",
      "emoji": "🛋️",
      "items": ["specific item or place", "specific item or place"]
    },
    {
      "category": "Quick Shopping",
      "emoji": "🛍️",
      "items": ["specific item or place", "specific item or place"]
    },
    {
      "category": "Practical Tips",
      "emoji": "💡",
      "items": ["actionable tip", "actionable tip", "actionable tip"]
    }
  ]
}

Make every item specific to ${stationName} — mention real or well-known platform facilities, famous local foods available at the station, any retiring rooms or AC lounges, nearby landmarks if walkable in under 10 minutes. Keep each item under 70 characters. Be warm and helpful.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const text = (completion.choices[0].message.content ?? '').trim();
    const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('[station-guide] Bad JSON from Groq:', clean);
      return res.status(400).json({ error: 'AI returned unrecognisable response', raw: clean });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('[station-guide] Groq error:', err.message);
    return res.status(500).json({ error: 'AI service error', detail: err.message });
  }
});

// ─── ElevenLabs TTS — Voice-Guided Navigation ─────────────────────────────────
// POST /api/tts  { text: string, voiceId?: string }
// Returns { audio: "<base64 mp3>" }
const ELEVENLABS_DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — calm, clear

app.post('/api/tts', async (req, res) => {
  const { text, voiceId } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured on server' });
  }

  const voice = voiceId || ELEVENLABS_DEFAULT_VOICE;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.80,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[tts] ElevenLabs error:', response.status, errText);
      return res.status(response.status).json({ error: 'ElevenLabs API error', detail: errText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.json({ audio: base64 });
  } catch (err) {
    console.error('[tts] Fetch error:', err.message);
    return res.status(500).json({ error: 'TTS service error', detail: err.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const MIN_VOTES_THRESHOLD = 3;

/**
 * In-memory vote store.
 * key = "trainNo:coachId"
 * value = { votes: string[], committed: boolean, winningDensity: string | null }
 */
const voteTallies = new Map();

function getKey(trainNo, coachId) {
  return `${trainNo}:${coachId}`;
}

function calcMajority(votes) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  votes.forEach((v) => { if (counts[v.density] !== undefined) counts[v.density] += v.weight; });
  return Object.entries(counts).reduce((a, b) => (b[1] >= a[1] ? b : a))[0];
}

app.get('/health', (_req, res) => res.json({
  ok: true,
  tallies: voteTallies.size,
  env: process.env.NODE_ENV || 'development',
  uptime: Math.floor(process.uptime()),
}));

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Send current full tally snapshot to newly connected client
  const snapshot = [];
  voteTallies.forEach((tally, key) => {
    const [trainNo, coachId] = key.split(':');
    snapshot.push({
      trainNo,
      coachId,
      voteCount: tally.votes.length,
      needed: MIN_VOTES_THRESHOLD,
      committed: tally.committed,
      winningDensity: tally.winningDensity,
    });
  });
  socket.emit('tally_snapshot', snapshot);

  // Handle incoming vote
  socket.on('cast_vote', ({ trainNo, coachId, density, weight }) => {
    if (!trainNo || !coachId || !['LOW', 'MEDIUM', 'HIGH'].includes(density)) return;

    // Clamp weight: verified=2, anonymous=0.5; default to anonymous if not provided
    const voteWeight = weight === 2 ? 2 : 0.5;

    const key = getKey(trainNo, coachId);
    const existing = voteTallies.get(key) ?? { votes: [], committed: false, winningDensity: null };

    const votes = [...existing.votes, { density, weight: voteWeight }];
    const winningDensity = calcMajority(votes);

    // Weighted count toward threshold (2× for verified, 0.5× for anon)
    const weightedCount = votes.reduce((sum, v) => sum + v.weight, 0);
    const committed = weightedCount >= MIN_VOTES_THRESHOLD;

    voteTallies.set(key, { votes, committed, winningDensity });

    const payload = {
      trainNo,
      coachId,
      voteCount: votes.length,
      weightedCount,
      needed: MIN_VOTES_THRESHOLD,
      committed,
      winningDensity,
    };

    console.log(`[vote] ${key} → ${density} w=${voteWeight} weighted=${weightedCount.toFixed(1)}/${MIN_VOTES_THRESHOLD} winner=${winningDensity}`);

    // Broadcast updated tally to ALL connected clients (including sender)
    io.emit('vote_update', payload);
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Rail Sathi vote server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
