import { create } from 'zustand';
import { CrowdReport, RecentSearch, DensityLevel } from '../types';
import { MOCK_CROWD_DATA } from '../data/mockData';

// Minimum votes required before the crowd status is updated on the display
export const MIN_VOTES_THRESHOLD = 3;

interface VoteTally {
  trainNo: string;
  coachId: string;
  votes: DensityLevel[]; // individual votes cast so far
  committed: boolean;    // true once threshold was reached and status was applied
}

interface AppState {
  // Search
  recentSearches: RecentSearch[];
  addRecentSearch: (from: string, to: string) => void;

  // Crowd reports (committed / official status)
  crowdReports: CrowdReport[];
  updateCrowdReport: (trainNo: string, coachId: string, density: DensityLevel) => void;
  getCrowdForCoach: (trainNo: string, coachId: string) => DensityLevel | null;

  // Vote tallies (in-progress, not yet committed)
  voteTallies: VoteTally[];
  castVote: (trainNo: string, coachId: string, density: DensityLevel) => {
    voteCount: number;
    needed: number;
    committed: boolean;
    winningDensity: DensityLevel;
  };
  getVoteTally: (trainNo: string, coachId: string) => VoteTally | undefined;
  /** Called by socket listener to apply a server-authoritative tally update */
  syncVoteTally: (payload: {
    trainNo: string;
    coachId: string;
    voteCount: number;
    needed: number;
    committed: boolean;
    winningDensity: DensityLevel;
  }) => void;

  // Pending offline queue
  pendingReports: CrowdReport[];
  addPendingReport: (report: CrowdReport) => void;
  flushPendingReports: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  recentSearches: [
    { id: '1', from: 'Howrah', to: 'Guwahati', timestamp: Date.now() - 86400000 },
    { id: '2', from: 'New Delhi', to: 'Patna', timestamp: Date.now() - 172800000 },
  ],

  addRecentSearch: (from, to) => {
    const existing = get().recentSearches;
    const isDuplicate = existing.some((s) => s.from === from && s.to === to);
    if (isDuplicate) return;
    set((state) => ({
      recentSearches: [
        { id: Date.now().toString(), from, to, timestamp: Date.now() },
        ...state.recentSearches.slice(0, 4),
      ],
    }));
  },

  crowdReports: MOCK_CROWD_DATA,

  updateCrowdReport: (trainNo, coachId, density) => {
    set((state) => {
      const reports = [...state.crowdReports];
      const idx = reports.findIndex((r) => r.trainNo === trainNo && r.coachId === coachId);
      const report: CrowdReport = {
        trainNo,
        coachId,
        densityLevel: density,
        timestamp: Date.now(),
        isSynced: true,
      };
      if (idx >= 0) {
        reports[idx] = report;
      } else {
        reports.push(report);
      }
      return { crowdReports: reports };
    });
  },

  getCrowdForCoach: (trainNo, coachId) => {
    const report = get().crowdReports.find(
      (r) => r.trainNo === trainNo && r.coachId === coachId
    );
    return report?.densityLevel ?? null;
  },

  // ── Vote Tally Logic ──────────────────────────────────────────────────────
  voteTallies: [],

  castVote: (trainNo, coachId, density) => {
    let result: ReturnType<AppState['castVote']> = {
      voteCount: 0,
      needed: MIN_VOTES_THRESHOLD,
      committed: false,
      winningDensity: density,
    };

    set((state) => {
      const tallies = [...state.voteTallies];
      const idx = tallies.findIndex(
        (t) => t.trainNo === trainNo && t.coachId === coachId
      );

      let tally: VoteTally;
      if (idx >= 0) {
        tally = { ...tallies[idx], votes: [...tallies[idx].votes, density] };
        tallies[idx] = tally;
      } else {
        tally = { trainNo, coachId, votes: [density], committed: false };
        tallies.push(tally);
      }

      const voteCount = tally.votes.length;
      const committed = voteCount >= MIN_VOTES_THRESHOLD;

      // Majority wins among the votes cast
      const counts: Record<DensityLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
      tally.votes.forEach((v) => counts[v]++);
      const winningDensity = (Object.keys(counts) as DensityLevel[]).reduce((a, b) =>
        counts[a] >= counts[b] ? a : b
      );

      result = { voteCount, needed: MIN_VOTES_THRESHOLD, committed, winningDensity };

      // Only commit status update once threshold is crossed
      if (committed && !tallies[tallies.indexOf(tally)]?.committed) {
        tallies[tallies.findIndex((t) => t.trainNo === trainNo && t.coachId === coachId)].committed = true;
      }

      return { voteTallies: tallies };
    });

    // If threshold reached, apply the winning density to crowd reports
    if (result.committed) {
      get().updateCrowdReport(trainNo, coachId, result.winningDensity);
    }

    return result;
  },

  getVoteTally: (trainNo, coachId) =>
    get().voteTallies.find((t) => t.trainNo === trainNo && t.coachId === coachId),

  syncVoteTally: ({ trainNo, coachId, voteCount, committed, winningDensity }) => {
    set((state) => {
      const tallies = [...state.voteTallies];
      const idx = tallies.findIndex((t) => t.trainNo === trainNo && t.coachId === coachId);
      // Build a synthetic votes array of the right length for progress display
      const syntheticVotes: DensityLevel[] = Array(voteCount).fill(winningDensity);
      const tally: VoteTally = { trainNo, coachId, votes: syntheticVotes, committed };
      if (idx >= 0) tallies[idx] = tally;
      else tallies.push(tally);
      return { voteTallies: tallies };
    });
    if (committed) {
      get().updateCrowdReport(trainNo, coachId, winningDensity);
    }
  },

  pendingReports: [],

  addPendingReport: (report) =>
    set((state) => ({ pendingReports: [...state.pendingReports, report] })),

  flushPendingReports: () => {
    const pending = get().pendingReports;
    if (pending.length === 0) return;
    pending.forEach((r) => get().updateCrowdReport(r.trainNo, r.coachId, r.densityLevel));
    set({ pendingReports: [] });
  },
}));
