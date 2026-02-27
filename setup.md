# Rail Sathi — Setup & Run Guide

## Prerequisites

- Node.js v18+ installed
- Expo Go app installed on phones (Android / iOS)
- All phones on the **same Wi-Fi network** as your laptop

---

## 1. Install dependencies

```bash
cd RailSathi
npm install --legacy-peer-deps
```

---

## 2. Set your laptop's LAN IP

Find your Wi-Fi IP address:

```powershell
ipconfig
# Look for "IPv4 Address" under Wi-Fi adapter, e.g. 10.93.59.53
```

Edit `utils/serverConfig.ts` and replace the IP:

```ts
export const SERVER_URL = 'http://<YOUR_IP>:3001';
// Example: 'http://10.93.59.53:3001'
```

---

## 3. Start the vote-sync server

Open a terminal and run:

```bash
cd RailSathi/server
npm install        # only needed once
node index.js
```

You should see:
```
Rail Sathi vote server running on http://0.0.0.0:3001
```

Verify it's working: open `http://<YOUR_IP>:3001/health` in any browser.

> **Keep this terminal open** while using the app.

---

## 4. Start the Expo app

Open a **second** terminal:

```bash
cd RailSathi
npx expo start
```

Scan the QR code with **Expo Go** on both phones.

---

## Restarting after a crash

### If port 3001 is already in use:

```powershell
# Windows — find the PID on port 3001
netstat -ano | findstr :3001

# Kill it (replace 12345 with the actual PID)
taskkill /PID 12345 /F

# Then restart the server
cd RailSathi/server
node index.js
```

---

## How voting works

- Crowd reports are submitted via the **Report Crowd** button on any coach
- Votes are sent to the server and synced to **all connected phones in real time**
- A coach's crowd status only updates on screen once **3 or more votes** agree (majority wins)
- Votes cast while offline are queued and automatically sent when connectivity returns



---

## Smart Connection Finder — Test Searches

The Smart Connection panel appears automatically on the Results screen **only when ALL displayed trains are Waitlisted (WL)**. It finds a 2-train path via a shared junction station.

### Train Routes in Mock Data

| Train | Route (key stops) |
|-------|-------------------|
| **12301** Howrah Rajdhani | HWH → ASN → DHN → GAYA → DDU → ALD → CNB → **NDLS** |
| **12951** Mumbai Rajdhani | BCT → BRC → RTM → KOTA → MTJ → **NDLS** |
| **12621** Tamil Nadu Exp | NDLS → CNB → ALD → DDU → NGP → BPQ → SC → RU → **MAS** |
| **12627** Karnataka Exp | SBC → DMM → UBL → GTL → WADI → SC → NGP → BPL → JHS → AGC → **NDLS** |
| **12345** Saraighat Exp | HWH → BDC → BWN → JSME → JMP → BGP → KIU → NJP → NBQ → **GHY** |
| **12002** Bhopal Shatabdi | NDLS → AGC → GWL → JHS → BIN → BPL → **HBJ** |
| **12723** Telangana Exp | NDLS → AGC → GWL → JHS → BPL → NGP → WADI → **SC** |
| **12502** Poorvottar SK | NDLS → LKO → GKP → CPR → PNBE → BGP → NJP → NBQ → **GHY** |
| **12953** Aug Kranti Raj | BCT → STD → BRC → RTM → KOTA → AGC → **NZM** |
| **12313** Sealdah Rajdhani | SDAH → BWN → DHN → GAYA → DDU → CNB → **NDLS** |
| **12841** Coromandel Exp | HWH → KGP → BLS → BBS → VSKP → **MAS** |
| **18645** East Coast Exp | HWH → KGP → BLS → BBS → **VSKP** |

---

### Searches that trigger Smart Connection

#### Works — connection found

| Search From | Search To | Junction | Leg 1 | Leg 2 |
|-------------|-----------|----------|-------|-------|
| Howrah | Guwahati | NJP (New Jalpaiguri) | 12345 HWH→NJP | 12502 NJP→GHY |
| Howrah | Visakhapatnam | KGP (Kharagpur) | 12841 HWH→KGP | 18645 KGP→VSKP |
| Howrah | Chennai Central | KGP (Kharagpur) | 18645 HWH→KGP | 12841 KGP→MAS |
| Mumbai Central | Chennai Central | NDLS (New Delhi) | 12951 BCT→NDLS | 12621 NDLS→MAS |
| Mumbai Central | Secunderabad | NDLS or KOTA | 12951 BCT→NDLS | 12723 NDLS→SC |
| Bangalore | New Delhi | NGP or SC | 12627 SBC→NGP | 12723/12621 NGP→NDLS |
| New Delhi | Guwahati | NJP or BGP | 12502 NDLS→NJP | 12345 NJP→GHY |
| Sealdah | New Delhi | BWN or CNB | 12313 SDAH→CNB | 12301 CNB→NDLS |

#### No connection — fallback card shown

| Search From | Search To | Reason |
|-------------|-----------|--------|
| Howrah | Kharagpur | Too short — KGP is a stop, no onward train from KGP as junction |
| Mumbai Central | Guwahati | No shared junction between western and northeast routes |
| Bangalore | Chennai Central | No train links SBC side to MAS via a shared stop |

---

### Station Code Reference

| Code | Station | Code | Station |
|------|---------|------|---------|
| HWH | Howrah Jn | NDLS | New Delhi |
| SDAH | Sealdah | NZM | Hazrat Nizamuddin |
| KGP | Kharagpur Jn | BCT | Mumbai Central |
| BLS | Balasore | SC | Secunderabad Jn |
| BBS | Bhubaneswar | SBC | Bangalore City Jn |
| VSKP | Visakhapatnam | GHY | Guwahati |
| MAS | Chennai Central | NJP | New Jalpaiguri |
| NGP | Nagpur | BPL | Bhopal Jn |
| CNB | Kanpur Central | DDU | Pt. D.D. Upadhyaya Jn |
| GAYA | Gaya Jn | PNBE | Patna Jn |
