// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Station {
  code: string;
  name: string;
  dist: number;
  arr: string;
  dep: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  route: Station[];
}

// ─── Seat / Split-Journey Types ───────────────────────────────────────────────

export interface SeatLeg {
  fromStation: string;
  toStation: string;
  seatNumber: string; // e.g. "S5-42"
  status: 'AVAILABLE';
}

export interface SplitJourney {
  type: 'DIRECT' | 'SPLIT';
  isConfirmed: boolean;
  legs: SeatLeg[];
  totalFare: number;
}

// ─── Crowd Report Types ───────────────────────────────────────────────────────

export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CrowdReport {
  trainNo: string;
  coachId: string; // "GEN", "S1", "D2"
  densityLevel: DensityLevel;
  timestamp: number;
  isSynced: boolean;
}

export interface CoachStatus {
  coachId: string;
  label: string;
  type: 'ENGINE' | 'GEN' | 'SLEEPER' | 'AC';
  density: DensityLevel | null;
}

// ─── Search Types ─────────────────────────────────────────────────────────────

export interface RecentSearch {
  id: string;
  from: string;
  to: string;
  timestamp: number;
}
