<div align="center">

# 🚆 Rail Sathi — Intelligent Railway Companion

**Find confirmed seats. See live coach crowds. Get rewarded for honest reporting.**

![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Algorand](https://img.shields.io/badge/Algorand-Testnet-00BCD4?style=for-the-badge&logo=algorand&logoColor=white)
![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3-F55036?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)

</div>

---

## About

**Rail Sathi** is a mobile super-app for Indian Railways passengers. Its **Smart Seat Finder** turns waitlisted journeys into confirmed ones by stitching together partial seat vacancies, while **real-time, offline-first crowd reporting** shows how full each coach is, even in tunnels and low-signal areas. Passengers who report honestly earn **ALGO rewards on Algorand Testnet**, and AI features add natural-language search, station guides for delays, and voice navigation.

---


## Highlights

| | |
|---|---|
| 💺 **Smart Split-Seat Finder** | Turns waitlisted trips into confirmed journeys by combining two partial seats |
| 👥 **Live Coach Crowd Map** | Real-time, colour-coded occupancy for every coach, synced to all passengers |
| 📴 **Offline-First Reporting** | Votes queue locally and sync automatically when the signal returns |
| 🛡️ **Spam-Resistant Voting** | Quorum threshold, verified-reporter weighting and a GPS moving-train check |
| ⛓️ **ALGO Rewards** | Every vote earns Testnet ALGO via a non-custodial, on-device wallet |
| 🤖 **AI Search & Station Guide** | Plain-English search and station-specific tips during delays |
| 🔊 **Voice Navigation** | Spoken schedule updates with natural AI voice and on-device fallback |

---

## Table of Contents

- [Highlights](#highlights)
- [Overview](#overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [How the Smart Seat Finder Works](#how-the-smart-seat-finder-works)
- [Crowd Density Voting](#crowd-density-voting)
- [Algorand Rewards](#algorand-rewards)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Building the APK](#building-the-apk)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Rail Sathi tackles two everyday problems faced by Indian Railways passengers:

| Problem | Who it affects | Rail Sathi's solution |
|---|---|---|
| Waitlisted tickets, even when seats are free on parts of the route | Reserved-class passengers | **Smart Seat Finder** stitches partial vacancies into a confirmed split journey |
| No live crowd information for unreserved / general coaches | General-class passengers | **Crowdsourced, offline-first density reporting** synced in real time via Socket.IO |

The app is built for **low-connectivity conditions** (tunnels, rural stretches) with an optimistic UI and background sync, following a minimalist, functional design philosophy.

---

## Screenshots

> _Add your screenshots here._

| Home | Train Results | Train Detail | Seat Finder Demo |
|:---:|:---:|:---:|:---:|
| `docs/screens/home.png` | `docs/screens/results.png` | `docs/screens/detail.png` | `docs/screens/demo.png` |

---

## Key Features

### 🔎 Search
- **Station autocomplete** from the first character, matching on both station name and code (e.g. `Howrah` / `HWH`), with a swap button and recent searches.
- **AI natural-language search** powered by Groq (LLaMA 3.3 70B). Type *"Mumbai to Delhi tomorrow"* and get resolved station codes and a date.
- **Smart route matching**: a train appears if your stations fall *anywhere* on its route, not just at the endpoints.
- **Colour-coded train type badges**: `RAJ` (Rajdhani), `SHT` (Shatabdi), `DUR` (Duronto), `EXP` (Express).

### 💺 Smart Seat Finder
- Finds a **direct confirmed seat**, or a **split journey** across two seats that together cover your trip.
- Returns seat numbers, switch station and estimated fare.
- Built-in **demo screen** that runs the algorithm live on three scenarios.

### 👥 Live Crowd Density
- Horizontal **coach diagram** (GEN, Sleeper, AC) colour-coded by occupancy: 🟢 Low · 🟡 Moderate · 🔴 Crowded · ⚪ Unknown.
- **Real-time vote sync** to every connected phone via Socket.IO.
- **Quorum + weighted voting** to resist spam and single-person manipulation.
- **GPS speed lock**: reporting is enabled only while the device is moving faster than 25 km/h, confirming the user is on a moving train.
- **Offline-first**: votes are queued in AsyncStorage and flushed automatically when connectivity returns.

### 🛡️ Verified Reporters
- Sign in with **Auth0 (OAuth2 + PKCE)** to earn a *Verified Reporter* badge.
- Verified users' votes count **2×**; guest votes count **0.5×**.

### 🧭 Station Guide (AI)
- When a train is delayed, get station-specific tips on food, rest areas, shopping and practical advice, or ask a custom question (*"Is there an ATM near platform 3?"*).

### 🔊 Voice Navigation
- Spoken schedule updates via **ElevenLabs** TTS, with automatic fallback to on-device `expo-speech`.

### ⛓️ Algorand Rewards
- Every vote earns real **ALGO on Testnet** through a non-custodial, on-device wallet.

---

## How the Smart Seat Finder Works

**The problem:** you want A → C, but the direct ticket is waitlisted. The train may still have a free seat for A → B and another for B → C. No standard booking flow shows you that.

```
findSmartSeats(trainId, sourceCode, destCode)
  │
  ├─ Step 1: Direct search (A → C)
  │    └─ Confirmed seat exists → return DIRECT ✅
  │
  └─ Step 2: Split search
       For each intermediate station B between A and C:
         ├─ Is any seat available A → B ?
         └─ Is any seat available B → C ?
              └─ Both found → return SPLIT ⚡
                 e.g. "Use B1-30 until Gaya, then switch to A2-7"
```

**Result types**

| Type | Meaning |
|---|---|
| ✅ `DIRECT` | One seat for the full journey |
| ⚡ `SPLIT` | Two seats, switching at an intermediate station (still confirmed) |
| ❌ `NONE` | No seat available, waitlisted |

```ts
interface SplitJourney {
  type: 'DIRECT' | 'SPLIT' | 'NONE';
  isConfirmed: boolean;
  legs: {
    fromStation: string;
    toStation: string;
    seatNumber: string;     // e.g. "B1-30"
    status: 'AVAILABLE';
  }[];
  totalFare: number;
}
```

**Demo scenarios** (`app/demo.tsx`)

| # | Train | Route | Expected result |
|---|---|---|---|
| 1 | 12301 Howrah Rajdhani | HWH → NDLS | Direct seat (A1-4, 1AC) |
| 2 | 12301 Howrah Rajdhani | HWH → ALD | Split: B1-30 (HWH → Gaya) + A2-7 (Gaya → ALD) |
| 3 | 12621 Tamil Nadu Express | CNB → SC | No seat found |

---

## Crowd Density Voting

Passengers report **Low / Medium / High** per coach. Reports are aggregated server-side and broadcast to everyone.

- **Weighted majority vote**: Verified Reporter = **2×**, Guest = **0.5×**.
- **Commit threshold**: a coach's status is pinned on screen only after weighted votes reach `MIN_VOTES_THRESHOLD = 3`.
- **Progress feedback**: the report modal shows progress toward the quorum.
- **In-memory store**: `Map<"trainNo:coachId", { votes, committed, winningDensity }>`.

**Socket.IO events**

| Event | Direction | Payload |
|---|---|---|
| `tally_snapshot` | Server → Client (on connect) | `TallyUpdate[]` |
| `vote` | Client → Server | `{ trainNo, coachId, density, weight, address? }` |
| `tally_update` | Server → All clients | `TallyUpdate` |
| `reward_granted` | Server → Voter | Reward confirmation |

```ts
interface TallyUpdate {
  trainNo: string;
  coachId: string;          // "GEN", "S1", "D2", ...
  voteCount: number;
  needed: number;           // votes required to commit
  committed: boolean;
  winningDensity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}
```

### Offline-first flow

1. GPS speed must exceed **25 km/h** to enable the report button.
2. If `NetInfo.isConnected === false`, the vote is stored in AsyncStorage as `PENDING`.
3. A NetInfo listener flushes the queue to the server when connectivity returns.
4. The UI updates optimistically, and the pending indicator clears once synced.

---

## Algorand Rewards

Rail Sathi rewards honest reporting with ALGO on **Algorand Testnet**. Fast finality and near-zero fees (0.001 ALGO minimum) make micro-rewards practical.

### Hybrid ledger design

| Layer | Role |
|---|---|
| **Local ledger (instant)** | The server credits the reward in an in-memory map the moment a vote arrives, so the user sees their reward with no blockchain wait. |
| **On-chain Testnet (async)** | A real Algorand transaction is queued and submitted in the background, throttled to one every 3 seconds to respect `algonode.cloud` rate limits. |

When a balance is requested, the server returns the local value immediately and reconciles with the chain in the background, keeping the higher of the two.

### Non-custodial wallets

1. On first use, the app calls the wallet-creation endpoint.
2. The server generates a keypair with `algosdk` and returns the **address** and **25-word mnemonic**.
3. Both are stored in `AsyncStorage` **on the user's device**.
4. **The server never stores the mnemonic.** Only the public address is sent when voting.

New accounts must hold at least 0.1 ALGO to exist on-chain, so the first reward to a new address is boosted to **0.2 ALGO**.

### Reward flow

```
User submits vote (with wallet address)
   → Server records vote and broadcasts tally_update
   → Server credits local ledger instantly
   → Server emits reward_granted to the voter
   → App shows toast: "+0.100 ALGO earned! 🏅"
   → Server queues on-chain transaction (background)
   → Submitted to Testnet via algonode.cloud, confirmation logged with Tx ID
```

> **Note:** Rewards are on Algorand **Testnet** and have no monetary value. Get free Testnet ALGO for development at [lora.algokit.io/testnet/fund](https://lora.algokit.io/testnet/fund).

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Expo App (Client)                │
│  Screens (Router) · Components · Zustand store   │
│                utils/serverConfig.ts             │
└───────────────────────┬──────────────────────────┘
                        │  REST + WebSocket
           ┌────────────▼─────────────┐
           │  Node.js + Express server │
           │      (server/index.js)    │
           │  REST API  │  Socket.IO   │
           └───┬────────┬─────────┬────┘
               │        │         │
        ┌──────▼──┐ ┌───▼─────┐ ┌─▼────────┐ ┌───────────┐
        │  Groq   │ │Eleven-  │ │  Auth0   │ │ Algorand  │
        │LLaMA 3.3│ │  Labs   │ │ (OAuth2) │ │  Testnet  │
        └─────────┘ └─────────┘ └──────────┘ └───────────┘
```

- **REST** for AI search, station guide, TTS and wallet endpoints.
- **Socket.IO** for real-time crowd vote sync and reward events.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 52+) |
| Navigation | Expo Router (file-based) |
| Language | TypeScript (strict) |
| State | Zustand |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| Offline storage | `@react-native-async-storage/async-storage` |
| Network detection | `@react-native-community/netinfo` |
| Real-time | Socket.IO (client + server) |
| Auth | `expo-auth-session` (Auth0, PKCE), `expo-web-browser` |
| Audio / speech | `expo-av`, `expo-speech` |
| Location | `expo-location` |
| Graphics / icons | `react-native-svg`, `expo-linear-gradient`, `lucide-react-native` |
| Backend | Node.js ≥ 20, Express, `cors`, `dotenv` |
| AI | Groq (LLaMA 3.3 70B) via OpenAI-compatible SDK |
| Voice | ElevenLabs `eleven_multilingual_v2` |
| Blockchain | Algorand Testnet, `algosdk`, algonode.cloud |
| Hosting | DigitalOcean App Platform (BLR region) |

---

## Getting Started

### Prerequisites

- Node.js **≥ 20** and npm
- [Expo Go](https://expo.dev/go) on an Android device (or an Android emulator)
- API keys for Groq and (optionally) ElevenLabs
- An Auth0 application (for the Verified Reporter feature)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/RailSathi.git
cd RailSathi

# client
npm install

# server
cd server && npm install && cd ..
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# then edit .env with your keys (see Configuration)
```

### 3. Start the backend

```bash
cd server
node index.js
# → listening on http://localhost:3001
```

### 4. Point the app at your server

Edit `utils/serverConfig.ts`:

```ts
const USE_DO_BACKEND = false;            // true for production
const LOCAL_IP       = '<your-lan-ip>';  // your machine's Wi-Fi IP
const LOCAL_PORT     = 3001;
```

> Your phone and computer must be on the same network when using the local backend.

### 5. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go.

---

## Configuration

### Server (`server/.env`)

```env
NODE_ENV=development
PORT=3001
GROQ_API_KEY=your_groq_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here   # optional, falls back to on-device TTS
ALLOWED_ORIGINS=                              # empty = allow all (Expo Go friendly)
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Powers AI search and Station Guide |
| `ELEVENLABS_API_KEY` | No | Enables natural-voice TTS; otherwise the app uses `expo-speech` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allow-list for production |
| `PORT` | No | Defaults to `3001` locally (`8080` on DigitalOcean) |

### CORS behaviour

| Environment | `ALLOWED_ORIGINS` | Result |
|---|---|---|
| Local dev / Expo Go | empty | All origins allowed |
| Production | set | Only listed origins allowed |

### Auth0

Create a **Native** application in Auth0 and configure:

| Setting | Value |
|---|---|
| App scheme | `railsathi` |
| Scopes | `openid profile email` |
| Allowed Callback URLs | your Expo dev URL (`exp://<ip>:8081/--/callback`) and `railsathi://callback` |

Update the Auth0 domain and client ID in `hooks/useAuth.ts`.

---

## API Reference

**Base URL:** `http://<LOCAL_IP>:3001` (dev) · `https://<your-app>.ondigitalocean.app` (prod)

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, tally count, uptime |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai-search` | Natural-language query → station codes + date |
| `POST` | `/api/station-guide` | AI tips for a station during a delay |
| `POST` | `/api/tts` | Text → base64 MP3 via ElevenLabs |

<details>
<summary><b>POST /api/ai-search</b></summary>

```jsonc
// Request
{ "userQuery": "train from Mumbai to Delhi tomorrow" }

// Response
{
  "sourceStationCode": "BCT",
  "destStationCode": "NDLS",
  "sourceName": "Mumbai",
  "destName": "Delhi",
  "date": "2026-02-28"
}
```
Errors: `400` unrecognised stations / bad AI output · `500` Groq error or missing key.
</details>

<details>
<summary><b>POST /api/station-guide</b></summary>

```jsonc
// Request
{
  "stationName": "Howrah Junction",
  "stationCode": "HWH",
  "delayMinutes": 120,
  "question": "Where can I eat something light?"
}

// Response
{
  "summary": "Howrah Junction has extensive platform facilities...",
  "suggestions": [
    { "category": "Food & Drinks",   "emoji": "🍽️", "items": ["..."] },
    { "category": "Rest & Waiting",  "emoji": "🛋️", "items": ["..."] },
    { "category": "Quick Shopping",  "emoji": "🛍️", "items": ["..."] },
    { "category": "Practical Tips",  "emoji": "💡", "items": ["..."] }
  ]
}
```
</details>

<details>
<summary><b>POST /api/tts</b></summary>

```jsonc
// Request
{ "text": "Your train arrives at New Delhi in 45 minutes.", "voiceId": "optional" }

// Response
{ "audio": "<base64 MP3>" }
```
Default voice: Sarah (`EXAVITQu4vr4xnSDxMaL`). Settings: stability 0.55, similarity 0.80, style 0.15.
</details>

### Algorand

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/algo/create-wallet` | Generate a keypair; returns address + mnemonic (not retained) |
| `GET` | `/api/algo/balance/:address` | Balance in microALGO and ALGO (local ledger + background chain sync) |
| `GET` | `/api/algo/transactions/:address` | Up to 10 recent reward transactions from the Algorand Indexer |
| `GET` | `/api/algo/reward-amount` | Configured per-vote reward in microALGO and ALGO |

---

## Project Structure

```
RailSathi/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root stack layout
│   ├── index.tsx               # Home: search + SmartSearchBar
│   ├── results.tsx             # Train search results
│   ├── demo.tsx                # Seat Finder demo screen
│   ├── profile.tsx             # Profile + Verified badge
│   ├── callback.tsx            # Auth0 OAuth callback
│   ├── seats/                  # Seat finder screens
│   └── train/[id].tsx          # Train detail, crowd density, Station Guide
├── components/
│   ├── SmartSearchBar.tsx      # AI natural-language search bar
│   ├── CoachDiagram.tsx        # SVG coach layout with crowd colours
│   └── StationGuideModal.tsx   # AI station guide modal
├── hooks/
│   └── useAuth.ts              # Auth0 PKCE login + persistence
├── store/
│   └── useAppStore.ts          # Zustand: recent searches, offline queue
├── utils/
│   ├── serverConfig.ts         # SERVER_URL (local / DigitalOcean toggle)
│   └── seatAlgorithm.ts        # Split-seat algorithm
├── data/
│   └── mockData.ts             # Trains, station names, seat charts
├── types/
│   └── index.ts                # Shared TypeScript interfaces
├── server/                     # Node.js backend
│   ├── index.js                # Express + Socket.IO + all routes
│   ├── package.json
│   ├── .env.example
│   └── .do/app.yaml            # DigitalOcean App Platform spec
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
└── package.json
```

---

## Deployment

The backend deploys to **DigitalOcean App Platform** using `server/.do/app.yaml`.

```yaml
name: rail-sathi-server
region: blr                      # Bangalore, lowest latency for India
services:
  - name: api
    source_dir: /server
    run_command: node index.js
    environment_slug: node-js
    instance_size_slug: apps-s-1vcpu-0.5gb
    http_port: 8080
    health_check:
      http_path: /health
```

1. Push the repo to GitHub.
2. In DigitalOcean: **Create App** and connect the repo (the spec is auto-detected).
3. Add `GROQ_API_KEY` and `ELEVENLABS_API_KEY` as secrets.
4. Copy the generated `.ondigitalocean.app` URL into `DO_SERVER_URL` in `utils/serverConfig.ts`.
5. Set `USE_DO_BACKEND = true` and rebuild the app.

To scale Socket.IO horizontally, increase `instance_count` in `app.yaml`. Note that the tally store and local ledger are currently in-memory, so multi-instance setups need a shared store (e.g. Redis) first.

---

## Building the APK

Rail Sathi uses **EAS Build** to produce a shareable `.apk`, with no Play Store account required.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview    # cloud build, ~10–15 min
```

EAS returns a download link and QR code for direct install.

> ⚠️ **Before building**, set `USE_DO_BACKEND = true` in `utils/serverConfig.ts`. Otherwise the APK will try to reach your local machine and fail for other users.

| Field | Value |
|---|---|
| App name | Rail Sathi |
| Package | `com.railsathi.app` |
| Scheme | `railsathi` |
| Version | 1.0.0 |

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep TypeScript strict-mode clean and avoid committing secrets (`.env` is git-ignored).

---

## License

Distributed under the **MIT License**. Add a `LICENSE` file to the repository root.

---

<div align="center">

**Rail Sathi** — built for Indian Railways passengers, powered by AI, designed for the real world.

</div>
