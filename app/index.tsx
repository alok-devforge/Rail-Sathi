import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpDown, Search, Clock, Train, MapPin, User } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { MOCK_TRAINS, STATION_NAMES } from '../data/mockData';
import SmartSearchBar, { AISearchResult } from '../components/SmartSearchBar';
import { useAuth } from '../hooks/useAuth';

// Build a list of { code, name } pairs for rich autocomplete
interface StationOption { code: string; name: string; }
const ALL_STATION_OPTIONS: StationOption[] = Object.entries(STATION_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Pure function outside component — not recreated on every render
function getSuggestions(query: string): StationOption[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();
  return ALL_STATION_OPTIONS.filter(
    (s) =>
      s.code.toLowerCase().startsWith(q) ||
      s.name.toLowerCase().includes(q)
  ).slice(0, 7);
}

export default function HomeScreen() {
  const router = useRouter();
  const { recentSearches, addRecentSearch } = useAppStore();
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);

  // Only recompute when the relevant query or active field changes
  const fromSuggestions = useMemo(
    () => activeField === 'from' ? getSuggestions(from) : [],
    [from, activeField]
  );
  const toSuggestions = useMemo(
    () => activeField === 'to' ? getSuggestions(to) : [],
    [to, activeField]
  );

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = () => {
    const trimFrom = from.trim();
    const trimTo = to.trim();
    if (!trimFrom || !trimTo) return;
    setActiveField(null);
    addRecentSearch(trimFrom, trimTo);
    router.push({ pathname: '/results', params: { from: trimFrom, to: trimTo } });
  };

  const handleRecentTap = (fromStation: string, toStation: string) => {
    setFrom(fromStation);
    setTo(toStation);
    addRecentSearch(fromStation, toStation);
    router.push({ pathname: '/results', params: { from: fromStation, to: toStation } });
  };

  const handleAISearch = (result: AISearchResult) => {
    setFrom(result.sourceName);
    setTo(result.destName);
    addRecentSearch(result.sourceName, result.destName);
    router.push({
      pathname: '/results',
      params: { from: result.sourceStationCode, to: result.destStationCode },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4FF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: '#0A1628',
            paddingTop: 56,
            paddingBottom: 80,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 8,
                padding: 6,
                marginRight: 10,
              }}
            >
              <Train size={18} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 }}>
              Rail Sathi
            </Text>
            {/* ── Profile avatar ── */}
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={{ marginLeft: 'auto', padding: 2 }}
            >
              {user?.picture ? (
                <Image
                  source={{ uri: user.picture }}
                  style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#7C3AED' }}
                />
              ) : (
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: user ? '#7C3AED' : '#1E3A5F',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: user ? '#7C3AED' : '#2563EB',
                }}>
                  <User size={18} color={user ? '#fff' : '#64748B'} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
            Smart travel · Live crowd · Seat finder
          </Text>
        </View>

        {/* ── Search Card (floating over hero) ──────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: -56,
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 20,
            elevation: 12,
            shadowColor: '#0A1628',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
          }}
        >
          {/* Route Card — FROM + TO connected */}
          <View style={{ marginBottom: 8 }}>
            {/* Outer route container */}
            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 16,
                overflow: 'visible',
              }}
            >
              {/* FROM row */}
              <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 }}>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  From
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#22C55E', marginRight: 10, borderWidth: 2, borderColor: '#BBF7D0' }} />
                  <TextInput
                    style={{ flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '500' }}
                    placeholder="Departure station or code"
                    placeholderTextColor="#94A3B8"
                    value={from}
                    onChangeText={setFrom}
                    onFocus={() => setActiveField('from')}
                    onBlur={() => setTimeout(() => setActiveField(null), 150)}
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Divider with swap button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14 }}>
                {/* Vertical route line on the left */}
                <View style={{ width: 1.5, height: 10, backgroundColor: '#CBD5E1', marginLeft: 3.75, marginRight: 10 }} />
                {/* Full-width hairline */}
                <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                {/* Swap button sits on the divider, right edge */}
                <TouchableOpacity
                  onPress={handleSwap}
                  activeOpacity={0.8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    marginLeft: 8,
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <ArrowUpDown size={15} color="#2563EB" />
                </TouchableOpacity>
              </View>

              {/* TO row */}
              <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 }}>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  To
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#EF4444', marginRight: 10, borderWidth: 2, borderColor: '#FECACA' }} />
                  <TextInput
                    style={{ flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '500' }}
                    placeholder="Destination station or code"
                    placeholderTextColor="#94A3B8"
                    value={to}
                    onChangeText={setTo}
                    onFocus={() => setActiveField('to')}
                    onBlur={() => setTimeout(() => setActiveField(null), 150)}
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* From Suggestions */}
          {fromSuggestions.length > 0 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                marginTop: 4,
                marginBottom: 8,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                elevation: 8,
                shadowColor: '#000',
                shadowOpacity: 0.10,
                shadowRadius: 8,
              }}
            >
              {fromSuggestions.map((s, i) => (
                <TouchableOpacity
                  key={s.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: i < fromSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                  }}
                  onPress={() => { setFrom(s.name); setActiveField(null); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MapPin size={13} color="#94A3B8" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#1E293B', fontSize: 14, flex: 1 }}>{s.name}</Text>
                  </View>
                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: '#2563EB', fontSize: 11, fontWeight: '700' }}>{s.code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* To Suggestions */}
          {toSuggestions.length > 0 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                marginTop: -12,
                marginBottom: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                elevation: 8,
                shadowColor: '#000',
                shadowOpacity: 0.10,
                shadowRadius: 8,
              }}
            >
              {toSuggestions.map((s, i) => (
                <TouchableOpacity
                  key={s.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: i < toSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                  }}
                  onPress={() => { setTo(s.name); setActiveField(null); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MapPin size={13} color="#94A3B8" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#1E293B', fontSize: 14, flex: 1 }}>{s.name}</Text>
                  </View>
                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: '#2563EB', fontSize: 11, fontWeight: '700' }}>{s.code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search CTA */}
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.88}
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 16,
              paddingVertical: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Search size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>
              FIND TRAINS
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Natural Language Search ──────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <SmartSearchBar onSearchSuccess={handleAISearch} />
        </View>

        {/* ── Recent Searches ────────────────────────────────────────────── */}
        {recentSearches.length > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 24 }}>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Recent
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {recentSearches.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleRecentTap(item.from, item.to)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    gap: 6,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Clock size={12} color="#94A3B8" />
                  <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                    {item.from} → {item.to}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Popular Trains ─────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Popular Trains
          </Text>
          {MOCK_TRAINS.slice(0, 2).map((train) => {
            const isRajdhani = train.name.toLowerCase().includes('rajdhani');
            const isShatabdi = train.name.toLowerCase().includes('shatabdi');
            const isDuronto = train.name.toLowerCase().includes('duronto');
            const accentColor = isRajdhani
              ? '#2563EB'
              : isShatabdi
              ? '#7C3AED'
              : isDuronto
              ? '#EA580C'
              : '#0891B2';
            const typeLabel = isRajdhani
              ? 'Rajdhani'
              : isShatabdi
              ? 'Shatabdi'
              : isDuronto
              ? 'Duronto'
              : 'Express';
            return (
              <TouchableOpacity
                key={train.id}
                onPress={() => router.push({ pathname: `/train/${train.id}` })}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  overflow: 'hidden',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                }}
              >
                {/* Left accent bar */}
                <View style={{ width: 4, backgroundColor: accentColor }} />
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '700' }}>
                        {train.number}
                      </Text>
                      <View
                        style={{
                          backgroundColor: accentColor + '18',
                          borderRadius: 4,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: accentColor, fontSize: 10, fontWeight: '700' }}>
                          {typeLabel}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: '#475569', fontSize: 13 }}>{train.name}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                      {train.from} → {train.to}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '700' }}>
                      {train.departure}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                      {train.duration}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
