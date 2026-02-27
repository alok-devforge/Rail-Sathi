import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrowdReport, DensityLevel } from '../types';
import { useAppStore, MIN_VOTES_THRESHOLD } from '../store/useAppStore';
import { getSocket } from '../utils/socket';

const PENDING_KEY = 'RAIL_SATHI_PENDING_REPORTS';

interface VoteUpdatePayload {
  trainNo: string;
  coachId: string;
  voteCount: number;
  weightedCount: number;
  needed: number;
  committed: boolean;
  winningDensity: DensityLevel;
}

export function useCrowdReporter(trainNo: string, coachId: string, voteWeight: number = 0.5) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastVote, setLastVote] = useState<DensityLevel | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [weightedCount, setWeightedCount] = useState(0);
  const [justCommitted, setJustCommitted] = useState(false);

  const { addPendingReport, updateCrowdReport, syncVoteTally, getVoteTally } = useAppStore();

  // ── Seed local count from store on coach change ────────────────────────────
  useEffect(() => {
    const tally = getVoteTally(trainNo, coachId);
    setVoteCount(tally?.votes.length ?? 0);
    setJustCommitted(tally?.committed ?? false);
  }, [trainNo, coachId]);

  // ── Socket: listen for global tally updates ────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const onVoteUpdate = (payload: VoteUpdatePayload) => {
      // Apply to store so ALL coaches/screens stay in sync
      syncVoteTally(payload);

      // Update local UI state only if this update is for our current coach
      if (payload.trainNo === trainNo && payload.coachId === coachId) {
        setVoteCount(payload.voteCount);
        setWeightedCount(payload.weightedCount ?? payload.voteCount);
        if (payload.committed) setJustCommitted(true);
      }
    };

    const onSnapshot = (snapshot: VoteUpdatePayload[]) => {
      snapshot.forEach((payload) => {
        syncVoteTally(payload);
        if (payload.trainNo === trainNo && payload.coachId === coachId) {
          setVoteCount(payload.voteCount);
          setWeightedCount(payload.weightedCount ?? payload.voteCount);
          if (payload.committed) setJustCommitted(true);
        }
      });
    };

    socket.on('vote_update', onVoteUpdate);
    socket.on('tally_snapshot', onSnapshot);

    return () => {
      socket.off('vote_update', onVoteUpdate);
      socket.off('tally_snapshot', onSnapshot);
    };
  }, [trainNo, coachId, syncVoteTally]);

  // ── Network Status Tracking + Offline Queue Sync ───────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true;
      setIsOnline(online);
      if (online) flushOfflineQueue();
    });
    return () => unsub();
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const pending: CrowdReport[] = JSON.parse(raw);
      if (pending.length === 0) return;
      const socket = getSocket();
      pending.forEach((r) =>
        socket.emit('cast_vote', {
          trainNo: r.trainNo,
          coachId: r.coachId,
          density: r.densityLevel,
        })
      );
      await AsyncStorage.removeItem(PENDING_KEY);
    } catch (_) {}
  }, []);

  // ── Submit Vote ─────────────────────────────────────────────────────────────
  const submitVote = useCallback(
    async (density: DensityLevel) => {
      setIsSubmitting(true);
      setLastVote(density);

      try {
        if (isOnline) {
          // Emit to server — server broadcasts back to ALL clients via vote_update
          getSocket().emit('cast_vote', { trainNo, coachId, density, weight: voteWeight });
        } else {
          // Queue for when connectivity returns
          const raw = await AsyncStorage.getItem(PENDING_KEY);
          const queue: CrowdReport[] = raw ? JSON.parse(raw) : [];
          queue.push({
            trainNo,
            coachId,
            densityLevel: density,
            timestamp: Date.now(),
            isSynced: false,
          });
          await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(queue));
          addPendingReport({
            trainNo,
            coachId,
            densityLevel: density,
            timestamp: Date.now(),
            isSynced: false,
          });
          // Optimistic local-only increment while offline
          setVoteCount((c) => c + 1);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [trainNo, coachId, isOnline, updateCrowdReport, addPendingReport]
  );

  return {
    canVote: true,
    isOnline,
    isSubmitting,
    lastVote,
    voteCount,
    weightedCount,
    votesNeeded: MIN_VOTES_THRESHOLD,
    justCommitted,
    submitVote,
  };
}
