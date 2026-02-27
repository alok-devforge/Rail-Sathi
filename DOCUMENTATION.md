# Rail Sathi — Technical Documentation

> **Version:** 1.0.0 | **Platform:** Android (React Native / Expo) | **Date:** February 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Features](#4-features)
   - [4.1 Smart Seat Finder (Split-Seat Algorithm)](#41-smart-seat-finder-split-seat-algorithm)
   - [4.2 Real-Time Crowd Density (Socket.IO)](#42-real-time-crowd-density-socketio)
   - [4.3 AI Natural Language Search (Groq + LLaMA 3.3)](#43-ai-natural-language-search-groq--llama-33)
   - [4.4 Station Guide (AI-Powered)](#44-station-guide-ai-powered)
   - [4.5 Voice Navigation (ElevenLabs TTS)](#45-voice-navigation-elevenlabs-tts)
   - [4.6 Verified Reporter Badge (Auth0 + PKCE)](#46-verified-reporter-badge-auth0--pkce)
   - [4.7 Offline-First Crowd Reporting](#47-offline-first-crowd-reporting)
   - [4.8 Coach Diagram Visualizer](#48-coach-diagram-visualizer)
   - [4.9 Station Autocomplete](#49-station-autocomplete)
   - [4.10 Demo / Algorithm Showcase Screen](#410-demo--algorithm-showcase-screen)
5. [Backend API Reference](#5-backend-api-reference)
6. [Data Models](#6-data-models)
7. [Project Structure](#7-project-structure)
8. [Environment & Configuration](#8-environment--configuration)
9. [Cloud Deployment (DigitalOcean)](#9-cloud-deployment-digitalocean)
10. [Building the APK](#10-building-the-apk)

---

## 1. Overview

**Rail Sathi** is a mobile super-app for Indian Railway passengers that solves two real problems:

| Problem | Who It Affects | Rail Sathi's Solution |
|---|---|---|
| Waitlisted tickets with no confirmed seat | Reserved passengers | Smart Split-Seat Algorithm finds partial vacancies and stitches them together |
| No live crowd data in unreserved coaches | General/unreserved passengers | Crowdsourced, GPS-locked, offline-first density reporting via Socket.IO |

The app is designed to work in **low-network conditions** (tunnels, rural routes) using an optimistic UI with background sync, modelled after the "Where Is My Train" UX philosophy — minimalist, functional, and text-heavy.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Expo App (Client)               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Screens  │  │Components│  │  Hooks/Store  │  │
│  │ (Router) │  │          │  │  (Zustand)    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │            │
│       └──────────────┴───────────────┘            │
│                      │                            │
│              utils/serverConfig.ts                │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Node.js Express Server │
          │   (server/index.js)      │
          │                          │
          │  REST API  │  Socket.IO  │
          │  ─────────────────────  │
          │  /api/ai-search          │
          │  /api/station-guide      │
          │  /api/tts                │
          │  /health                 │
          └────────────┬────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
     Groq AI      ElevenLabs     Auth0
  (LLaMA 3.3)    (TTS Voice)   (OAuth2)
```

**Client → Server communication:**
- REST HTTP for AI endpoints
- WebSocket (Socket.IO) for real-time crowd vote sync

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React Native | Expo SDK 52+ | Cross-platform mobile framework |
| Expo Router | v4 | File-based navigation |
| TypeScript | 5.x | Type safety |
| Zustand | Latest | Lightweight global state |
| Socket.IO Client | Latest | Real-time WebSocket crowd sync |
| expo-auth-session | 7.x | Auth0 PKCE OAuth flow |
| expo-web-browser | Latest | In-app browser for OAuth |
| expo-av | Latest | Audio playback for ElevenLabs TTS |
| expo-speech | Latest | Fallback TTS (on-device) |
| expo-location | Latest | GPS speed detection for vote locking |
| @react-native-async-storage | Latest | Offline vote queue + persistent login |
| @react-native-community/netinfo | Latest | Online/offline detection |
| react-native-svg | Latest | Coach diagram rendering |
| expo-linear-gradient | Latest | SmartSearchBar UI |
| lucide-react-native | Latest | Icon library |
| react-native-safe-area-context | Latest | Safe area insets |

### Backend
| Technology | Purpose |
|---|---|
| Node.js (≥20) | Runtime |
| Express.js | HTTP server + REST API |
| Socket.IO | Real-time crowd vote sync |
| OpenAI SDK (Groq-compatible) | AI search + station guide |
| dotenv | Environment variable loading |
| cors | Cross-Origin Resource Sharing |

### External Services
| Service | Usage |
|---|---|
| **Groq** (LLaMA 3.3 70B) | Natural language station search + Station Guide |
| **ElevenLabs** | Text-to-speech voice navigation |
| **Auth0** | OAuth2 PKCE authentication — Verified Reporter badge |
| **DigitalOcean App Platform** | Cloud backend hosting (BLR region) |

---

## 4. Features

### 4.1 Smart Seat Finder (Split-Seat Algorithm)

**Location:** `utils/seatAlgorithm.ts`, `app/seats/`, `app/demo.tsx`

**The Problem:** A passenger wants to travel from Station A → Station C, but the direct ticket is Waitlisted (WL). The train has a confirmed seat from A → B and a different confirmed seat from B → C, but no system shows this combination.

**The Algorithm:**

```
findSmartSeats(trainId, sourceCode, destCode)
  │
  ├─► Step 1: Check direct availability (A → C)
  │     └─► If confirmed seat exists → return DIRECT result ✅
  │
  └─► Step 2: Iterate intermediate stations (split point search)
        For each station B between A and C:
          ├─► Check Seat X: is it available from A → B?
          └─► Check Seat Y: is it available from B → C?
                └─► If both found → return SPLIT result
                      e.g. "Use S5-42 until Gaya, switch to S3-18 from Gaya"
```

**Output Types:**
```typescript
interface SplitJourney {
  type: 'DIRECT' | 'SPLIT' | 'NONE';
  isConfirmed: boolean;
  legs: {
    fromStation: string;
    toStation: string;
    seatNumber: string;   // e.g. "S5-42"
    status: 'AVAILABLE';
  }[];
  totalFare: number;
}
```

**Demo Scenarios (app/demo.tsx):**
| Scenario | Route | Result |
|---|---|---|
| 1 | HWH → NDLS (Howrah Rajdhani) | DIRECT — full-journey confirmed seat |
| 2 | HWH → ALD (Howrah Rajdhani) | SPLIT — switch at Gaya (GAYA) |
| 3 | CNB → SC (Tamil Nadu Express) | NONE — train fully booked |

---

### 4.2 Real-Time Crowd Density (Socket.IO)

**Location:** `server/index.js` (Socket.IO section), `app/train/[id].tsx`
       
**How it works:**

Passengers report the crowd density of their coach — LOW, MEDIUM, or HIGH. Reports are aggregated in real-time across all connected users.

**Voting Algorithm:**
- **Weighted Majority Vote** — Verified Reporters get **2× vote weight**, guests get **0.5× weight**
- **Commitment Threshold** — a result is "committed" (pinned) once weighted votes exceed `MIN_VOTES_THRESHOLD = 3`
- **In-memory store** — `Map<"trainNo:coachId", { votes, committed, winningDensity }>`

**Socket.IO Events:**

| Event | Direction | Payload | Description |
|---|---|---|---|
| `tally_snapshot` | Server → Client | `TallyUpdate[]` | Full snapshot on connect |
| `vote` | Client → Server | `{ trainNo, coachId, density, weight }` | Submit a vote |
| `tally_update` | Server → Client (broadcast) | `TallyUpdate` | Live tally update to all clients |

**TallyUpdate shape:**
```typescript
{
  trainNo: string;
  coachId: string;          // "GEN", "S1", "D2", etc.
  voteCount: number;
  needed: number;           // 3 — votes needed to commit
  committed: boolean;
  winningDensity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}
```

**Visual representation:** Coach boxes in the train detail screen change colour based on density:
- 🟢 **GREEN** — LOW crowd
- 🟡 **YELLOW** — MEDIUM crowd
- 🔴 **RED** — HIGH crowd

---

### 4.3 AI Natural Language Search (Groq + LLaMA 3.3)

**Location:** `components/SmartSearchBar.tsx`, `server/index.js` (`/api/ai-search`)

**What it does:** Lets passengers search in plain English instead of typing station codes.

**Examples:**
- *"Mumbai to Delhi tomorrow"* → resolves to BCT → NDLS, date: tomorrow's date
- *"Train from Calcutta to Hyderabad this Saturday"* → HWH → SC, date: next Saturday
- *"Bangalore to Chennai weekend"* → SBC → MAS

**How it works:**

1. User types a natural language query in the `SmartSearchBar` component
2. Query is sent `POST /api/ai-search` with `{ userQuery }`
3. Server sends the query to **Groq's LLaMA 3.3 70B** model with a strict JSON extraction prompt
4. LLaMA returns `{ sourceStationCode, destStationCode, sourceName, destName, date }`
5. App navigates directly to results screen with the resolved codes

**UI:** The `SmartSearchBar` uses a custom **Gemini-style 4-pointed star icon** rendered in pure React Native `View` components (no image assets).

**Supported station mappings:** 40+ major Indian cities including all metro stations (HWH, NDLS, BCT, MAS, SBC, SC, LKO, PNBE, NGP, VSKP, BPL, GHY, KGP, and more).

---

### 4.4 Station Guide (AI-Powered)

**Location:** `components/StationGuideModal.tsx`, `server/index.js` (`/api/station-guide`)

**What it does:** When a passenger's train is delayed, the Station Guide tells them exactly what to do at that station — food options, rest areas, shopping, and practical tips — all specific to that station.

**How it works:**

1. Triggered from the train detail screen when delay is detected
2. User can also ask a custom question (e.g. *"Is there an ATM near platform 3?"*)
3. `POST /api/station-guide` with `{ stationName, stationCode, delayMinutes, question }`
4. Groq/LLaMA generates a structured JSON response:

```json
{
  "summary": "CSMT is one of the best-equipped stations for long waits...",
  "suggestions": [
    { "category": "Food & Drinks", "emoji": "🍽️", "items": ["..."] },
    { "category": "Rest & Waiting", "emoji": "🛋️", "items": ["..."] },
    { "category": "Quick Shopping", "emoji": "🛍️", "items": ["..."] },
    { "category": "Practical Tips", "emoji": "💡", "items": ["..."] }
  ]
}
```

5. Results displayed in a full-screen modal with category cards

The guide is **station-specific** — it knows about retiring rooms, famous platform foods (like Howrah's jhalmuri or Mumbai's vada pav), AC lounges, and walkable landmarks.

---

### 4.5 Voice Navigation (ElevenLabs TTS)

**Location:** `server/index.js` (`/api/tts`), train detail screen Speak button

**What it does:** Reads out train schedule information (current station, next stop, arrival times) using a natural AI voice.

**Endpoint:** `POST /api/tts`
```json
Request:  { "text": "Your train arrives at New Delhi in 45 minutes.", "voiceId": "optional" }
Response: { "audio": "<base64 encoded mp3>" }
```

**Technical details:**
- Uses ElevenLabs `eleven_multilingual_v2` model
- Default voice: **Sarah** (EXAVITQu4vr4xnSDxMaL) — calm and clear
- Voice settings: stability 0.55, similarity 0.80, style 0.15
- Returns base64 MP3 → decoded and played via `expo-av` on device

**Fallback:** If `ELEVENLABS_API_KEY` is not configured or the API is unavailable (free tier limits), the app automatically falls back to `expo-speech` (on-device TTS) with no user-facing error.

---

### 4.6 Verified Reporter Badge (Auth0 + PKCE)

**Location:** `hooks/useAuth.ts`, `app/profile.tsx`, `app/callback.tsx`

**What it does:** Passengers can sign in with their account (via Auth0 / Google) to receive a **Verified Reporter** badge. Verified reporters get **2× vote weight** in the crowd density system, making crowd data more reliable.

**OAuth Flow (PKCE):**
```
App → Auth0 Authorization Endpoint
                     ↓
         [Browser opens Auth0 login UI]
                     ↓
         User signs in (Google / email)
                     ↓
Auth0 → redirects to exp://<ip>:8081/--/callback
                     ↓
  app/callback.tsx calls maybeCompleteAuthSession()
                     ↓
    exchangeCodeAsync() exchanges code + PKCE verifier
                     ↓
    Fetch /userinfo with access token → { name, email, picture }
                     ↓
        User persisted to AsyncStorage (@railsathi_user)
```

**Persistence:** Login survives app restarts via `@react-native-async-storage`. The user is restored from storage on mount with a `loading: true` guard to prevent UI flicker.

**Vote weight logic:**
```typescript
isVerified = !!user             // any logged-in user is "verified"
voteWeight = isVerified ? 2 : 0.5   // 2× for verified, 0.5× for guest
```

**Profile Screen (`app/profile.tsx`):**
- Shows profile photo (from Google/Auth0)
- Displays name, email
- Shows Verified Reporter badge with star icon
- Sign Out with confirmation dialog

**Avatar in Home Screen:** A small avatar button in the top-right of the header shows the user's photo (if available), a purple user icon (if logged in), or a grey icon (if not logged in).

**Auth0 Configuration:**
| Setting | Value |
|---|---|
| Domain | `dev-71wawdqybqgr07hn.us.auth0.com` |
| Client ID | `X3bDJ3tmrKSLBWqIuYBNS7Q8rRxD09M6` |
| App Scheme | `railsathi` |
| Scopes | `openid profile email` |

---

### 4.7 Offline-First Crowd Reporting

**Location:** `store/useAppStore.ts`, `app/train/[id].tsx`

**The Problem:** Passengers in tunnels or low-signal areas lose connectivity but still want to report crowd density.

**Solution — Optimistic UI + Background Sync:**

1. **GPS Speed Lock:** The Report button is only active if `GPS Speed > 25 km/h` — confirming the user is on a moving train (prevents stationary fake reports)
2. **Offline Save:** If `NetInfo.isConnected === false`, the vote is saved to `AsyncStorage` with `status: 'PENDING'`
3. **Auto-Sync:** A `NetInfo` change listener fires when the device comes back online and flushes all pending votes to the Socket.IO server
4. **Optimistic UI:** The UI updates immediately (even offline) — the pending indicator disappears once synced

```typescript
interface CrowdReport {
  trainNo: string;
  coachId: string;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  isSynced: boolean;   // false = queued, true = sent to server
}
```

---

### 4.8 Coach Diagram Visualizer

**Location:** `components/CoachDiagram.tsx`

**What it does:** Renders an SVG diagram of the train's coach layout, colour-coded by crowd density received from Socket.IO.

- Built with `react-native-svg` — no heavy map dependencies
- Each coach box (GEN, S1–S9, D1, D2, etc.) is coloured green/yellow/red
- Tapping a coach opens the vote submission flow
- Updates live as `tally_update` events arrive over Socket.IO

---

### 4.9 Station Autocomplete

**Location:** `app/index.tsx`

**What it does:** As the user types in the From/To fields, instant suggestions appear from a pre-loaded list of Indian Railways station codes and names.

**Implementation details:**
- Station list derived from `data/mockData.ts` → `STATION_NAMES` object
- `getSuggestions()` is a **pure function outside the component** (never re-created on render)
- Uses `useMemo` with dependency tracking — suggestions only recompute when the relevant input changes
- Shows up to 7 suggestions, filtered by both station code prefix and name substring
- Results include the 3-letter code (e.g. `HWH`) and full name (e.g. `Howrah Junction`)
- Swap button exchanges From and To values

---

### 4.10 Demo / Algorithm Showcase Screen

**Location:** `app/demo.tsx`

A dedicated screen that runs the Smart Seat Finder algorithm live against 3 pre-defined test scenarios and shows structured results. Designed to demonstrate the core algorithm to hackathon judges without needing a real backend.

Each scenario shows:
- Input route
- Expected result type (DIRECT / SPLIT / NONE)
- Computed result with full seat leg details
- Pass/Fail badge

---

## 5. Backend API Reference

Base URL (development): `http://<LOCAL_IP>:3001`  
Base URL (production): `https://rail-sathi-server-xxxxx.ondigitalocean.app`

---

### `GET /health`

Returns server status.

**Response:**
```json
{
  "ok": true,
  "tallies": 12,
  "env": "production",
  "uptime": 3847
}
```

---

### `POST /api/ai-search`

Parses a natural language query into station codes and date.

**Request:**
```json
{ "userQuery": "train from Mumbai to Delhi tomorrow" }
```

**Response (success):**
```json
{
  "sourceStationCode": "BCT",
  "destStationCode": "NDLS",
  "sourceName": "Mumbai",
  "destName": "Delhi",
  "date": "2026-02-28"
}
```

**Error responses:**
- `400` — could not recognise stations or bad AI output
- `500` — Groq API error or missing `GROQ_API_KEY`

---

### `POST /api/station-guide`

Returns AI-generated local tips for a station during a delay.

**Request:**
```json
{
  "stationName": "Howrah Junction",
  "stationCode": "HWH",
  "delayMinutes": 120,
  "question": "Where can I eat something light?"
}
```

**Response:**
```json
{
  "summary": "Howrah Junction has extensive platform facilities...",
  "suggestions": [
    { "category": "Food & Drinks", "emoji": "🍽️", "items": ["..."] },
    { "category": "Rest & Waiting", "emoji": "🛋️", "items": ["..."] },
    { "category": "Quick Shopping", "emoji": "🛍️", "items": ["..."] },
    { "category": "Practical Tips", "emoji": "💡", "items": ["..."] }
  ]
}
```

---

### `POST /api/tts`

Converts text to speech using ElevenLabs.

**Request:**
```json
{
  "text": "Your train arrives at New Delhi in 45 minutes.",
  "voiceId": "EXAVITQu4vr4xnSDxMaL"
}
```

**Response:**
```json
{ "audio": "<base64 MP3 string>" }
```

---

### Socket.IO Events

**Client → Server:**
```javascript
socket.emit('vote', {
  trainNo: '12301',
  coachId: 'S3',
  density: 'HIGH',    // 'LOW' | 'MEDIUM' | 'HIGH'
  weight: 2           // 2 for verified, 0.5 for guest
});
```

**Server → Client (on connect):**
```javascript
socket.on('tally_snapshot', (tallies: TallyUpdate[]) => { ... });
```

**Server → All Clients (on vote):**
```javascript
socket.on('tally_update', (update: TallyUpdate) => { ... });
```

---

## 6. Data Models

```typescript
// Navigation result
interface SplitJourney {
  type: 'DIRECT' | 'SPLIT' | 'NONE';
  isConfirmed: boolean;
  legs: {
    fromStation: string;
    toStation: string;
    seatNumber: string;
    status: 'AVAILABLE';
  }[];
  totalFare: number;
}

// Crowd report
interface CrowdReport {
  trainNo: string;
  coachId: string;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  isSynced: boolean;
}

// Train schedule station
interface Station {
  code: string;
  name: string;
  dist: number;
  arr: string;
  dep: string;
}

// Socket tally
interface TallyUpdate {
  trainNo: string;
  coachId: string;
  voteCount: number;
  needed: number;
  committed: boolean;
  winningDensity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

// Authenticated user
interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  sub: string;       // Auth0 subject ID
}

// AI search result
interface AISearchResult {
  sourceStationCode: string;
  destStationCode: string;
  sourceName: string;
  destName: string;
  date: string;       // ISO "YYYY-MM-DD"
}
```

---

## 7. Project Structure

```
RailSathi/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root stack layout, screen registration
│   ├── index.tsx               # Home screen (search + SmartSearchBar)
│   ├── results.tsx             # Train search results list
│   ├── demo.tsx                # Algorithm demo / showcase screen
│   ├── profile.tsx             # User profile + Verified badge
│   ├── callback.tsx            # Auth0 OAuth callback handler
│   ├── seats/                  # Seat finder screens
│   └── train/
│       └── [id].tsx            # Train detail + crowd density + Station Guide
│
├── components/
│   ├── SmartSearchBar.tsx      # AI natural language search bar
│   ├── CoachDiagram.tsx        # SVG coach layout with crowd colours
│   └── StationGuideModal.tsx   # AI station guide full-screen modal
│
├── hooks/
│   └── useAuth.ts              # Auth0 PKCE login, persistence, user state
│
├── store/
│   └── useAppStore.ts          # Zustand store (recent searches, offline queue)
│
├── utils/
│   ├── serverConfig.ts         # SERVER_URL with DO/local toggle
│   └── seatAlgorithm.ts        # Smart Split-Seat algorithm implementation
│
├── data/
│   └── mockData.ts             # MOCK_TRAINS, STATION_NAMES, seat chart data
│
├── types/
│   └── index.ts                # TypeScript interfaces (SplitJourney, etc.)
│
├── server/                     # Node.js backend
│   ├── index.js                # Express + Socket.IO + all API routes
│   ├── package.json            # Server dependencies (engines: node >=20)
│   ├── .env                    # Secret keys (not committed)
│   ├── .env.example            # Documented env var template
│   └── .do/
│       └── app.yaml            # DigitalOcean App Platform deploy spec
│
├── app.json                    # Expo config (scheme, package, icons)
├── eas.json                    # EAS Build profiles (preview=APK, prod=AAB)
├── package.json                # Client dependencies
└── DOCUMENTATION.md            # This file
```

---

## 8. Environment & Configuration

### Client (`utils/serverConfig.ts`)

```typescript
const USE_DO_BACKEND = false;   // flip to true for production/hackathon

const DO_SERVER_URL  = 'https://rail-sathi-server-xxxxx.ondigitalocean.app';
const LOCAL_IP       = '10.155.150.53';   // update to your machine's Wi-Fi IP
const LOCAL_PORT     = 3001;

export const SERVER_URL = USE_DO_BACKEND ? DO_SERVER_URL : `http://${LOCAL_IP}:${LOCAL_PORT}`;
```

### Server (`server/.env`)

```env
NODE_ENV=development
PORT=3001
GROQ_API_KEY=your_groq_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ALLOWED_ORIGINS=                 # leave empty to allow all (Expo Go compatible)
```

### CORS Behaviour

| Environment | `ALLOWED_ORIGINS` | Behaviour |
|---|---|---|
| Local dev / Expo Go | (empty) | Allow all origins (`*`) |
| Production (DO) | Set specific origins | Only listed origins allowed |

---

## 9. Cloud Deployment (DigitalOcean)

The backend is configured for one-click deployment on **DigitalOcean App Platform**.

**Spec file:** `server/.do/app.yaml`

```yaml
name: rail-sathi-server
region: blr                          # Bangalore — lowest latency for India

services:
  - name: api
    source_dir: /server
    run_command: node index.js
    environment_slug: node-js
    instance_size_slug: apps-s-1vcpu-0.5gb   # $4/month
    http_port: 8080
    health_check:
      http_path: /health
    envs:
      - key: NODE_ENV
        value: production
      - key: GROQ_API_KEY
        type: SECRET
      - key: ELEVENLABS_API_KEY
        type: SECRET
```

**Deployment steps:**
1. Push `RailSathi/` as the repo root to GitHub
2. DigitalOcean App Platform → Create App → connect GitHub repo
3. App Platform auto-detects `server/.do/app.yaml`
4. Set `GROQ_API_KEY` and `ELEVENLABS_API_KEY` in DO Dashboard → Environment Variables
5. After deploy, copy the `.ondigitalocean.app` URL to `DO_SERVER_URL` in `serverConfig.ts`
6. Set `USE_DO_BACKEND = true` and rebuild

**Scalability pitch:** DigitalOcean App Platform can horizontally scale Socket.IO instances. At $4/month for 512 MB, the server handles thousands of concurrent WebSocket connections. Upgrading to multi-instance requires only changing `instance_count` in `app.yaml`.

---

## 10. Building the APK

Rail Sathi uses **EAS Build** (Expo Application Services) to produce a shareable `.apk` file — no Play Store account needed.

### EAS Profile (`eas.json`)

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### Build Steps

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo account
eas login

# 3. Build APK (cloud build — ~10-15 min)
cd RailSathi
eas build -p android --profile preview
```

EAS provides a **direct download link + QR code**. Anyone can scan with their Android phone to download and install the APK instantly.

> **Before building:** Set `USE_DO_BACKEND = true` in `utils/serverConfig.ts` and update `DO_SERVER_URL` with your DigitalOcean URL. Otherwise the APK will try to reach your laptop's local IP and fail for other users.

### Android Package

| Field | Value |
|---|---|
| App Name | Rail Sathi |
| Package | `com.railsathi.app` |
| Scheme | `railsathi` |
| Version | 1.0.0 |

---

*Rail Sathi — Built for Indian Railways passengers, powered by AI, designed for the real world.*
