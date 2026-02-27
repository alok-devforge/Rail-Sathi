# Rail Sathi — Feature Documentation

## Overview
Rail Sathi is a React Native (Expo) app for Indian Railways passengers. It helps users find available seats, track live train crowds, and report coach occupancy in real time — even offline.

---

## 1. Train Search with Smart Autocomplete
- Search trains by entering source and destination stations
- Autocomplete dropdown triggers from the **first character** typed
- Matches on both **station name** (e.g. "Howrah") and **station code** (e.g. "HWH")
- Each suggestion shows the station name + a blue code badge (e.g. `NDLS`)
- Swap button to instantly flip From ↔ To
- Recent searches saved and shown below the search card

## 2. Train Results Screen
- Smart route matching — a train appears in results if the searched stations fall **anywhere on its route**, not just at the endpoints
- Fallback: if no route match found, shows all trains
- Each result card shows train number, name, type badge, departure/arrival times and duration

## 3. Train Type Badges
Colour-coded labels on every train card:
| Badge | Colour | Trains |
|---|---|---|
| RAJ | Blue | Rajdhani Express |
| SHT | Purple | Shatabdi Express |
| DUR | Orange | Duronto Express |
| EXP | Gray | All other Express |

## 4. Train Detail Screen
- Full **station timeline** with animated dots (past / current / upcoming)
- Current station highlighted in blue with a "← Here" indicator
- Arrival and departure times at each stop
- Live **Coach Crowd Diagram** — horizontal scrollable strip colour-coded by occupancy

## 5. Coach Crowd Diagram
- Scrollable horizontal strip showing all coaches (GEN, Sleeper, AC)
- Colour coding: 🟢 Low · 🟡 Moderate · 🔴 Crowded · ⚪ Unknown
- Tap any coach to open the crowd report modal

## 6. Crowd Reporting with Real-Time Vote Sync
- Passengers report occupancy per coach: **Low / Moderate / Crowded**
- Votes are sent to a central Node.js + Socket.IO server
- Server broadcasts the updated tally to **all connected phones instantly**
- **Vote quorum threshold**: coach status only updates on screen once **≥ 3 votes agree** (majority wins) — prevents spam and single-person manipulation
- A progress bar in the modal shows current vote count (e.g. "2 of 3 votes needed")
- After threshold is reached: "🎉 Coach status updated for all passengers!"

## 7. Offline-First Crowd Reporting
- If the phone has no internet, votes are saved to **AsyncStorage**
- When connectivity returns, the queue is automatically flushed to the server
- Online/offline status indicator shown in the train detail screen

## 8. Smart Seat Finder
The core algorithmic feature of Rail Sathi.

**How it works:**
1. **Direct search** — checks if any seat is available for the full source → destination segment
2. **Split search** — if no direct seat exists, iterates every intermediate station and looks for two partial seats (Seat A: src → mid, Seat B: mid → dest) that together cover the journey
3. Returns the seat number(s), station codes, and estimated fare

**Result types:**
- ✅ **Direct Confirmed** — one seat, full journey
- ⚡ **Split Confirmed** — two seats, switch at an intermediate station (still confirmed!)
- ❌ **No Seat Found** — waitlisted, no option available

## 9. Smart Seat Finder — Demo Screen
Accessible from the home screen banner. Shows 3 live scenarios:

| # | Train | Route | Result |
|---|---|---|---|
| 1 | 12301 Howrah Rajdhani | HWH → NDLS | Direct seat (A1-4, 1AC) |
| 2 | 12301 Howrah Rajdhani | HWH → ALD | Split: B1-30 (HWH→Gaya) + A2-7 (Gaya→ALD) |
| 3 | 12621 Tamil Nadu Exp | CNB → SC | No seat found |

Each scenario auto-runs the algorithm on load with a spinner, and has a refresh button to re-run live.

## 10. Real Train Data
10 real Indian Railways trains with accurate timetable data:

| No. | Train | Route |
|---|---|---|
| 12301 | Howrah Rajdhani Express | HWH → NDLS |
| 12951 | Mumbai Rajdhani Express | BCT → NDLS |
| 12621 | Tamil Nadu Express | NDLS → MAS |
| 12627 | Karnataka Express | SBC → NDLS |
| 12345 | Saraighat Express | HWH → GHY |
| 12002 | Bhopal Shatabdi Express | NDLS → HBJ |
| 12723 | Telangana Express | NDLS → SC |
| 12502 | Poorvottar Sampark Kranti | NDLS → GHY |
| 12953 | August Kranti Rajdhani | BCT → NZM |
| 12313 | Sealdah Rajdhani Express | SDAH → NDLS |

50+ station codes with full name lookup.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| State | Zustand |
| Offline storage | AsyncStorage |
| Real-time sync | Socket.IO (client + Node.js server) |
| Network detection | @react-native-community/netinfo |
| Icons | lucide-react-native |
| Language | TypeScript (strict) |
