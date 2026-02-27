import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Users, Wifi, WifiOff, Clock, MapPin, Train, BookOpen, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { SERVER_URL } from '../../utils/serverConfig';
import CoachDiagram from '../../components/CoachDiagram';
import StationGuideModal from '../../components/StationGuideModal';
import { MOCK_TRAINS, MOCK_CROWD_DATA } from '../../data/mockData';
import { CoachStatus, DensityLevel } from '../../types';
import { useCrowdReporter } from '../../hooks/useCrowdReporter';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';

// Demo: simulate a 4-hour delay at the current station
const DEMO_DELAY_MINUTES = 240;

const COACHES: CoachStatus[] = [
  { coachId: 'ENGINE', label: '', type: 'ENGINE', density: null },
  { coachId: 'GEN-1', label: 'GEN-1', type: 'GEN', density: 'HIGH' },
  { coachId: 'GEN-2', label: 'GEN-2', type: 'GEN', density: 'HIGH' },
  { coachId: 'S1', label: 'S1', type: 'SLEEPER', density: 'MEDIUM' },
  { coachId: 'S2', label: 'S2', type: 'SLEEPER', density: 'LOW' },
  { coachId: 'S3', label: 'S3', type: 'SLEEPER', density: 'LOW' },
  { coachId: 'S4', label: 'S4', type: 'SLEEPER', density: 'MEDIUM' },
  { coachId: 'S5', label: 'S5', type: 'SLEEPER', density: 'LOW' },
  { coachId: 'S6', label: 'S6', type: 'SLEEPER', density: 'LOW' },
  { coachId: 'A1', label: 'A1', type: 'AC', density: 'LOW' },
  { coachId: 'B1', label: 'B1', type: 'AC', density: null },
  { coachId: 'B2', label: 'B2', type: 'AC', density: null },
];

const CURRENT_STATION_IDX = 3;

export default function TrainDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { getCrowdForCoach } = useAppStore();
  const { user, isVerified, voteWeight, loading: authLoading, login, logout } = useAuth();

  const [selectedCoach, setSelectedCoach] = useState<CoachStatus | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [stationGuideVisible, setStationGuideVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Stop any previous audio when component unmounts
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const train = MOCK_TRAINS.find((t) => t.id === id);

  useEffect(() => {
    if (train) navigation.setOptions({ title: `${train.number} · ${train.name}` });
  }, [train]);

  const { canVote, isOnline, isSubmitting, lastVote, voteCount, weightedCount, votesNeeded, justCommitted, submitVote } =
    useCrowdReporter(train?.number ?? '', selectedCoach?.coachId ?? '', voteWeight);

  // Build and speak a calm status announcement — ElevenLabs first, device TTS fallback
  const speakStatus = async () => {
    if (speaking || !train) return;
    setSpeaking(true);
    try {
      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const delayHours = Math.round(DEMO_DELAY_MINUTES / 60);
      const delayText = DEMO_DELAY_MINUTES > 0
        ? `Your train is currently running ${delayHours} hour${delayHours !== 1 ? 's' : ''} late.`
        : 'Your train is running on time.';

      const nextLine = nextStation
        ? `The next stop is ${nextStation.name}.`
        : 'This is the final destination.';

      const announcement =
        `Namaskar! Welcome to Rail Saathi. ` +
        `Your train, ${train.name}, train number ${train.number}, ` +
        `is currently at ${currentStation.name}. ` +
        `${nextLine} ` +
        `${delayText} ` +
        `The train departs from ${train.from} at ${train.departure} and arrives at ${train.to} at ${train.arrival}. ` +
        `Have a safe and comfortable journey!`;

      // ── Try ElevenLabs (high-quality voice) ───────────────────────
      let usedElevenLabs = false;
      try {
        const res = await fetch(`${SERVER_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: announcement }),
        });

        if (res.ok) {
          const { audio } = await res.json();
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mpeg;base64,${audio}` },
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) setSpeaking(false);
          });
          await sound.playAsync();
          usedElevenLabs = true;
        }
      } catch {
        // ElevenLabs unavailable — fall through to device TTS
      }

      // ── Fallback: on-device TTS (free, offline, no API key) ───────
      if (!usedElevenLabs) {
        Speech.speak(announcement, {
          language: 'en-IN',
          pitch: 1.0,
          rate: 0.92,
          onDone: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (e: unknown) {
      setSpeaking(false);
      console.warn('[speakStatus]', e instanceof Error ? e.message : e);
    }
  };

  if (!train) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' }}>
        <Text style={{ color: '#94A3B8', fontSize: 15 }}>Train not found.</Text>
      </View>
    );
  }

  const liveCoaches: CoachStatus[] = COACHES.map((c) => ({
    ...c,
    density: getCrowdForCoach(train.number, c.coachId) ?? c.density,
  }));

  const handleCoachPress = (coach: CoachStatus) => {
    setSelectedCoach(coach);
    setReportModalVisible(true);
  };

  const currentStation = train.route[CURRENT_STATION_IDX];
  const nextStation = train.route[CURRENT_STATION_IDX + 1];

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4FF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero strip ──────────────────────────────────────────────── */}
        <View style={{ backgroundColor: '#0A1628', paddingHorizontal: 16, paddingVertical: 20 }}>
          {/* Live now pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>
              LIVE
            </Text>
            <View style={{ flex: 1 }} />

            {/* ── Speak button ── */}
            <TouchableOpacity
              onPress={speakStatus}
              disabled={speaking}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: speaking ? '#7C3AED33' : '#312E8133',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                marginRight: 8,
                borderWidth: 1,
                borderColor: speaking ? '#7C3AED66' : '#4F46E533',
              }}
            >
              {speaking
                ? <ActivityIndicator size={12} color="#A78BFA" />
                : <Volume2 size={13} color="#A78BFA" />}
              <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700' }}>
                {speaking ? 'Speaking…' : 'Speak'}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isOnline ? '#14532D33' : '#78350F33',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              {isOnline ? <Wifi size={12} color="#4ADE80" /> : <WifiOff size={12} color="#FCD34D" />}
              <Text style={{ color: isOnline ? '#4ADE80' : '#FCD34D', fontSize: 11, fontWeight: '600' }}>
                {isOnline ? 'Synced' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* From → To */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 30 }}>
                {train.departure}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 3 }}>{train.from}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 12 }}>
              <Text style={{ color: '#334155', fontSize: 11, marginBottom: 4 }}>{train.duration}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#1E3A5F' }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', marginHorizontal: 4 }} />
                <View style={{ flex: 1, height: 1, backgroundColor: '#1E3A5F' }} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 30 }}>
                {train.arrival}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 3 }}>{train.to}</Text>
            </View>
          </View>

          {/* Currently at */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: '#2563EB22',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <MapPin size={14} color="#60A5FA" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                CURRENTLY AT
              </Text>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 1 }}>
                {currentStation.name}
              </Text>
            </View>
            {nextStation && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600' }}>NEXT</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 1 }}>
                  {nextStation.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Station Guide Banner ────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setStationGuideVisible(true)}
          activeOpacity={0.85}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: '#ECFDF5',
            borderWidth: 1.5,
            borderColor: '#A7F3D0',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#D1FAE5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#065F46', fontSize: 14, fontWeight: '800' }}>
                Station Guide
              </Text>
              <Text style={{ color: '#047857', fontSize: 12, marginTop: 2 }}>
                Food, lounges & tips at {currentStation.name}
              </Text>
            </View>
            <Text style={{ color: '#059669', fontSize: 20 }}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Coach Crowd Diagram ─────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: '#fff',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 3,
            shadowColor: '#0A1628',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
            <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '800' }}>Coach Crowd</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
              Tap a coach to report crowd level
            </Text>
          </View>
          <CoachDiagram
            trainNo={train.number}
            coaches={liveCoaches}
            onCoachPress={handleCoachPress}
            selectedCoachId={selectedCoach?.coachId}
          />
        </View>

        {/* ── Route Timeline ──────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: '#fff',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 20,
            padding: 16,
            elevation: 3,
            shadowColor: '#0A1628',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Train size={16} color="#2563EB" />
            <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '800' }}>Route Timeline</Text>
          </View>

          {train.route.map((station, idx) => {
            const isCurrent = idx === CURRENT_STATION_IDX;
            const isPast = idx < CURRENT_STATION_IDX;
            const isFirst = idx === 0;
            const isLast = idx === train.route.length - 1;
            const dotColor = isCurrent ? '#2563EB' : isPast ? '#93C5FD' : '#CBD5E1';
            const lineColor = isPast ? '#2563EB' : '#E2E8F0';

            return (
              <View key={station.code} style={{ flexDirection: 'row' }}>
                {/* Timeline spine */}
                <View style={{ alignItems: 'center', marginRight: 16, width: 18 }}>
                  {!isFirst && (
                    <View style={{ width: 2, height: 14, backgroundColor: lineColor }} />
                  )}
                  <View
                    style={{
                      width: isCurrent ? 18 : 12,
                      height: isCurrent ? 18 : 12,
                      borderRadius: 99,
                      backgroundColor: dotColor,
                      borderWidth: isCurrent ? 3 : 0,
                      borderColor: '#EFF6FF',
                    }}
                  />
                  {!isLast && (
                    <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: lineColor }} />
                  )}
                </View>

                {/* Station info */}
                <View
                  style={{
                    flex: 1,
                    paddingBottom: 20,
                    ...(isCurrent && {
                      backgroundColor: '#EFF6FF',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 8,
                      marginLeft: -4,
                      paddingLeft: 10,
                    }),
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{
                            fontSize: isCurrent ? 15 : 14,
                            fontWeight: isCurrent ? '800' : '600',
                            color: isCurrent ? '#2563EB' : isPast ? '#475569' : '#0F172A',
                          }}
                        >
                          {station.name}
                        </Text>
                        {isCurrent && (
                          <View style={{ backgroundColor: '#2563EB', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>YOU ARE HERE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{station.code}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {station.arr !== '--' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} color="#94A3B8" />
                          <Text style={{ color: isPast ? '#94A3B8' : '#475569', fontSize: 12, fontWeight: '600' }}>
                            {station.arr}
                          </Text>
                        </View>
                      )}
                      {station.dep !== '--' && station.dep !== station.arr && (
                        <Text style={{ color: '#CBD5E1', fontSize: 11, marginTop: 2 }}>
                          dep {station.dep}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Station Guide Modal ──────────────────────────────────────── */}
      <StationGuideModal
        visible={stationGuideVisible}
        onClose={() => setStationGuideVisible(false)}
        stationName={currentStation.name}
        stationCode={currentStation.code}
        delayMinutes={DEMO_DELAY_MINUTES}
      />

      {/* ── Crowd Report Bottom Sheet ──────────────────────────────────── */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setReportModalVisible(false)}
        >
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
              }}
            >
              {/* Handle */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 }} />

              {/* Coach label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8 }}>
                  <Users size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '800' }}>
                    Report Crowd Level
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 13, marginTop: 1 }}>
                    Coach {selectedCoach?.label} · {train.number}
                  </Text>
                </View>
                {/* Verified Badge / Login prompt */}
                <TouchableOpacity
                  onPress={isVerified ? logout : login}
                  disabled={authLoading}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isVerified ? '#FEF9C3' : '#F1F5F9',
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: isVerified ? '#FDE047' : '#CBD5E1',
                  }}
                >
                  {authLoading
                    ? <ActivityIndicator size={11} color="#64748B" />
                    : <Text style={{ fontSize: 12 }}>{isVerified ? '\u2605' : '\uD83D\uDC64'}</Text>}
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isVerified ? '#854D0E' : '#475569',
                  }}>
                    {isVerified ? 'Verified (2×)' : 'Sign in'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 12,
                  marginBottom: 20,
                }}
              >
                <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#64748B', fontSize: 12 }}>
                  {justCommitted ? '\u2713 Community verdict reached!' : `${voteCount} vote${voteCount !== 1 ? 's' : ''} cast`}
                </Text>
                <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '700' }}>
                  {weightedCount.toFixed(1)}/{votesNeeded}
                </Text>
              </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      width: `${Math.min(100, (weightedCount / votesNeeded) * 100)}%`,
                      backgroundColor: justCommitted ? '#22C55E' : '#2563EB',
                    }}
                  />
                </View>
              </View>

              {/* Vote buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                {(['LOW', 'MEDIUM', 'HIGH'] as DensityLevel[]).map((level) => {
                  const opts = {
                    LOW:    { color: '#22C55E', bg: '#F0FDF4', activeBg: '#16A34A', bars: 1, label: 'Empty',    sub: 'Seats free'  },
                    MEDIUM: { color: '#EAB308', bg: '#FEFCE8', activeBg: '#CA8A04', bars: 2, label: 'Moderate', sub: 'Getting full' },
                    HIGH:   { color: '#EF4444', bg: '#FEF2F2', activeBg: '#DC2626', bars: 3, label: 'Crowded',  sub: 'Very packed'  },
                  };
                  const o = opts[level];
                  const isActive = lastVote === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={async () => {
                        await submitVote(level);
                        setTimeout(() => setReportModalVisible(false), 800);
                      }}
                      disabled={!canVote || isSubmitting}
                      activeOpacity={0.82}
                      style={{
                        flex: 1,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: isActive ? o.activeBg : o.bg,
                        opacity: !canVote || isSubmitting ? 0.45 : 1,
                        borderWidth: isActive ? 0 : 1.5,
                        borderColor: isActive ? 'transparent' : o.color + '45',
                        overflow: 'hidden',
                        paddingBottom: 14,
                      }}
                    >
                      {/* Colored top accent stripe */}
                      <View style={{ width: '100%', height: 4, backgroundColor: isActive ? 'rgba(255,255,255,0.35)' : o.color, marginBottom: 12 }} />

                      {/* Signal-bar density indicator */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22, marginBottom: 8 }}>
                        {[7, 13, 19].map((h, barIdx) => (
                          <View
                            key={barIdx}
                            style={{
                              width: 6,
                              height: h,
                              borderRadius: 2,
                              backgroundColor:
                                barIdx < o.bars
                                  ? isActive ? 'rgba(255,255,255,0.9)' : o.color
                                  : isActive ? 'rgba(255,255,255,0.2)' : o.color + '22',
                            }}
                          />
                        ))}
                      </View>

                      <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? '#fff' : o.color, letterSpacing: 0.2 }}>
                        {o.label}
                      </Text>
                      <Text style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.7)' : '#94A3B8', marginTop: 2 }}>
                        {o.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {lastVote && (
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    marginTop: 8,
                    color: justCommitted ? '#16A34A' : '#94A3B8',
                    fontWeight: justCommitted ? '700' : '400',
                  }}
                >
                  {justCommitted
                    ? '🎉 Coach status updated for everyone!'
                    : `✓ Vote recorded${isOnline ? '' : ' (queued)'}  ·  ${votesNeeded - voteCount} more vote${votesNeeded - voteCount === 1 ? '' : 's'} needed`}
                </Text>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

