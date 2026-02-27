import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Zap, MapPin, CheckCircle, RefreshCw, ChevronRight, Wifi } from 'lucide-react-native';
import { MOCK_TRAINS, MOCK_SEAT_CHART, TRAIN_AVAILABILITY } from '../data/mockData';
import type { Train, Station } from '../types';

// ─── Local Types ──────────────────────────────────────────────────────────────
interface Avail { status: 'AVAILABLE' | 'RAC' | 'WL'; count: number; cls: string }
interface ConnLeg { train: Train; fromStn: Station; toStn: Station; seat: string }
interface ConnResult { leg1: ConnLeg; changeAt: Station; leg2: ConnLeg }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveCode(query: string): string | null {
  const q = query.toLowerCase().trim();
  for (const t of MOCK_TRAINS) {
    for (const s of t.route) {
      if (s.code.toLowerCase() === q || s.name.toLowerCase().includes(q)) return s.code;
    }
  }
  return null;
}

function findAvailSeat(trainId: string, fromCode: string, toCode: string): string {
  const key = `${fromCode}-${toCode}`;
  for (const e of MOCK_SEAT_CHART) {
    if (e.trainId === trainId && e.availability[key] === 'AVAILABLE') return e.seatNumber;
  }
  return 'Confirmed';
}

function findConnection(fromSearch: string, toSearch: string): ConnResult | null {
  const fromCode = resolveCode(fromSearch);
  const toCode   = resolveCode(toSearch);
  if (!fromCode || !toCode) return null;

  for (const t1 of MOCK_TRAINS) {
    const fi = t1.route.findIndex(s => s.code === fromCode);
    if (fi === -1) continue;
    for (let mi = fi + 1; mi < t1.route.length - 1; mi++) {
      const mid = t1.route[mi];
      if (mid.code === toCode) continue; // skip if mid IS the destination
      for (const t2 of MOCK_TRAINS) {
        if (t2.id === t1.id) continue;
        const mi2 = t2.route.findIndex(s => s.code === mid.code);
        const ti2 = t2.route.findIndex(s => s.code === toCode);
        if (mi2 === -1 || ti2 === -1 || ti2 <= mi2) continue;
        return {
          leg1:     { train: t1, fromStn: t1.route[fi],  toStn: mid,           seat: findAvailSeat(t1.id, fromCode,   mid.code) },
          changeAt: mid,
          leg2:     { train: t2, fromStn: t2.route[mi2], toStn: t2.route[ti2], seat: findAvailSeat(t2.id, mid.code,   toCode)   },
        };
      }
    }
  }
  return null;
}

function availStyle(avail?: Avail) {
  if (!avail) return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
  if (avail.status === 'AVAILABLE') return { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' };
  if (avail.status === 'RAC')       return { bg: '#FEF9C3', text: '#92400E', dot: '#EAB308' };
  return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
}

function availText(avail?: Avail) {
  if (!avail) return 'Check IRCTC';
  if (avail.status === 'AVAILABLE') return `${avail.count} Seats Available · ${avail.cls}`;
  if (avail.status === 'RAC')       return `RAC ${avail.count} · ${avail.cls}`;
  return `WL ${avail.count} · ${avail.cls}`;
}

function trainAccent(name: string) {
  if (name.toLowerCase().includes('rajdhani')) return { color: '#2563EB', label: 'Rajdhani' };
  if (name.toLowerCase().includes('shatabdi')) return { color: '#7C3AED', label: 'Shatabdi' };
  if (name.toLowerCase().includes('duronto'))  return { color: '#EA580C', label: 'Duronto'  };
  return { color: '#0891B2', label: 'Express' };
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ResultsScreen() {
  const { from, to } = useLocalSearchParams<{ from: string; to: string }>();
  const router = useRouter();

  const results = useMemo(() => {
    const f = (from ?? '').toLowerCase();
    const d = (to   ?? '').toLowerCase();
    return MOCK_TRAINS.filter(t => {
      const codes = t.route.map(s => s.code.toLowerCase());
      const names = t.route.map(s => s.name.toLowerCase());
      return (
        (t.from.toLowerCase().includes(f) || codes.some(c => c.includes(f)) || names.some(n => n.includes(f))) &&
        (t.to.toLowerCase().includes(d)   || codes.some(c => c.includes(d)) || names.some(n => n.includes(d)))
      );
    });
  }, [from, to]);

  const display   = results.length > 0 ? results : MOCK_TRAINS.slice(0, 3);
  const allWL     = display.length > 0 && display.every(t => TRAIN_AVAILABILITY[t.id]?.status === 'WL');
  const connection = useMemo(() => allWL ? findConnection(from ?? '', to ?? '') : null, [allWL, from, to]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4FF' }}>

      {/* ── Route strip ─────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#0A1628', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MapPin size={13} color="#64748B" />
        <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '500', flex: 1 }}>
          <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{from}</Text>
          {'  →  '}
          <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{to}</Text>
        </Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Change</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Count */}
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          {display.length} Train{display.length !== 1 ? 's' : ''} Found
          {results.length === 0 && from && to ? ' · Sample results' : ''}
        </Text>

        {/* ── Train cards ─────────────────────────────────────────────── */}
        {display.map(train => {
          const avail  = TRAIN_AVAILABILITY[train.id] as Avail | undefined;
          const { color: accent, label: typeLabel } = trainAccent(train.name);
          const { bg, text: textC, dot } = availStyle(avail);

          return (
            <View
              key={train.id}
              style={{ backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, overflow: 'hidden', elevation: 3, shadowColor: '#0A1628', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, flexDirection: 'row' }}
            >
              {/* Left accent bar */}
              <View style={{ width: 4, backgroundColor: accent }} />

              <View style={{ flex: 1 }}>
                {/* Train name row */}
                <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '800' }}>{train.number}</Text>
                  <View style={{ backgroundColor: accent + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: accent, fontSize: 10, fontWeight: '700' }}>{typeLabel}</Text>
                  </View>
                  <Text style={{ color: '#64748B', fontSize: 13, flex: 1 }} numberOfLines={1}>{train.name}</Text>
                </View>

                {/* Departure → Arrival */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12 }}>
                  <View style={{ minWidth: 64 }}>
                    <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800', lineHeight: 26 }}>{train.departure}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{train.from}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>{train.duration}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      <View style={{ flex: 1, height: 1.5, backgroundColor: '#E2E8F0' }} />
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1', marginHorizontal: 4 }} />
                      <View style={{ flex: 1, height: 1.5, backgroundColor: '#E2E8F0' }} />
                      <ArrowRight size={13} color="#94A3B8" />
                    </View>
                  </View>
                  <View style={{ minWidth: 64, alignItems: 'flex-end' }}>
                    <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800', lineHeight: 26 }}>{train.arrival}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{train.to}</Text>
                  </View>
                </View>

                {/* ── Seat availability badge ─────────────────────────── */}
                <View style={{ marginHorizontal: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start', gap: 7 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
                  <Text style={{ color: textC, fontSize: 13, fontWeight: '700' }}>{availText(avail)}</Text>
                </View>

                {/* Action row */}
                <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 10 }}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: `/train/${train.id}` })}
                    activeOpacity={0.8}
                    style={{ paddingVertical: 9, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Live Status</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── Smart Connection section (only when ALL trains are WL) ───── */}
        {allWL && (
          <View style={{ marginTop: 8 }}>
            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#CBD5E1' }} />
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', paddingHorizontal: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                All Trains Waitlisted
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#CBD5E1' }} />
            </View>

            {connection ? (
              /* ── Connection card ────────────────────────────────────── */
              <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#0A1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }}>
                <View style={{ height: 4, backgroundColor: '#2563EB' }} />

                {/* Card header */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8 }}>
                    <Zap size={16} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '800' }}>Smart Connection Found!</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>2 trains · all confirmed seats</Text>
                  </View>
                  <View style={{ backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#15803D', fontSize: 11, fontWeight: '700' }}>CONFIRMED</Text>
                  </View>
                </View>

                {/* Leg 1 */}
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    Board · Train 1 of 2
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '800' }}>{connection.leg1.train.number}</Text>
                    <Text style={{ color: '#475569', fontSize: 13, flex: 1 }} numberOfLines={1}>{connection.leg1.train.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center', width: 10 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' }} />
                      <View style={{ width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
                      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#2563EB', backgroundColor: '#fff' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                        <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>{connection.leg1.fromStn.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>{connection.leg1.fromStn.dep}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>{connection.leg1.toStn.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>{connection.leg1.toStn.arr}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                    <CheckCircle size={14} color="#22C55E" />
                    <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600' }}>Seat {connection.leg1.seat} · Confirmed</Text>
                  </View>
                </View>

                {/* Transfer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FEF3C7' }}>
                  <RefreshCw size={15} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '700' }}>Transfer at {connection.changeAt.name}</Text>
                    <Text style={{ color: '#B45309', fontSize: 12, marginTop: 2 }}>Wait on the platform · check display board for Train 2</Text>
                  </View>
                </View>

                {/* Leg 2 */}
                <View style={{ padding: 16 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    Board · Train 2 of 2
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '800' }}>{connection.leg2.train.number}</Text>
                    <Text style={{ color: '#475569', fontSize: 13, flex: 1 }} numberOfLines={1}>{connection.leg2.train.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center', width: 10 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#2563EB', backgroundColor: '#fff' }} />
                      <View style={{ width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                        <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>{connection.leg2.fromStn.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>{connection.leg2.fromStn.dep}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>{connection.leg2.toStn.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>{connection.leg2.toStn.arr}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                    <CheckCircle size={14} color="#22C55E" />
                    <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600' }}>Seat {connection.leg2.seat} · Confirmed</Text>
                  </View>

                  {/* Book CTA */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{ marginTop: 16, backgroundColor: '#0A1628', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Book This Connection</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

            ) : (
              /* ── No connection fallback ──────────────────────────────── */
              <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', elevation: 2 }}>
                <View style={{ backgroundColor: '#F1F5F9', borderRadius: 40, padding: 14, marginBottom: 14 }}>
                  <Wifi size={28} color="#94A3B8" />
                </View>
                <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
                  No Smart Connection Available
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  All trains are waitlisted and no valid connecting route was found. Try a different date or a longer route.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
