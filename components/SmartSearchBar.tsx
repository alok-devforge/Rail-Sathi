import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SERVER_URL } from '../utils/serverConfig';

export interface AISearchResult {
  sourceStationCode: string;
  destStationCode: string;
  sourceName: string;
  destName: string;
  date: string;
}

interface Props {
  onSearchSuccess: (result: AISearchResult) => void;
}

/** Gemini 4-pointed star — vertical & horizontal arms longer than diagonals */
function GeminiStar({ size = 22 }: { size?: number }) {
  const long = size * 0.88;
  const short = size * 0.62;
  const thick = size * 0.145;
  const thin = size * 0.09;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* long vertical arm */}
      <View style={{ position: 'absolute', width: thick, height: long, borderRadius: thick, backgroundColor: '#fff' }} />
      {/* long horizontal arm */}
      <View style={{ position: 'absolute', width: long, height: thick, borderRadius: thick, backgroundColor: '#fff' }} />
      {/* short diagonal \ */}
      <View style={{ position: 'absolute', width: thin, height: short, borderRadius: thin, backgroundColor: 'rgba(255,255,255,0.6)', transform: [{ rotate: '45deg' }] }} />
      {/* short diagonal / */}
      <View style={{ position: 'absolute', width: thin, height: short, borderRadius: thin, backgroundColor: 'rgba(255,255,255,0.6)', transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

export default function SmartSearchBar({ onSearchSuccess }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(
          'Could not understand',
          data.error ?? 'Try being more specific, e.g. "Train from Kolkata to Delhi tomorrow"',
        );
        return;
      }

      onSearchSuccess(data as AISearchResult);
    } catch {
      Alert.alert('Connection error', 'Make sure the server is running and you are on the same Wi‑Fi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Gemini gradient header ── */}
      <LinearGradient
        colors={['#4E7CFF', '#8E6BFF', '#FF8F6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <GeminiStar size={20} />
        <Text style={styles.headerText}>Powered by Gemini</Text>
      </LinearGradient>

      {/* ── Input area ── */}
      <View style={styles.inputArea}>
        {/* Gradient border wrapper */}
        <LinearGradient
          colors={['#4E7CFF', '#8E6BFF', '#FF8F6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputBorderGradient}
        >
          <TextInput
            style={styles.input}
            placeholder="Ask Rail Sathi…"
            placeholderTextColor="#9AA0B4"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
            editable={!loading}
          />
        </LinearGradient>

        {/* Circular gradient send button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !query.trim()}
          activeOpacity={0.8}
          style={[styles.btnWrapper, (!query.trim() || loading) && { opacity: 0.45 }]}
        >
          <LinearGradient
            colors={['#4E7CFF', '#8E6BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            {loading ? (
              <ActivityIndicator size={16} color="#fff" />
            ) : (
              // Paper-plane arrow icon built from Views
              <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 14, height: 2, backgroundColor: '#fff', borderRadius: 1, transform: [{ rotate: '-40deg' }, { translateX: 1 }] }} />
                <View style={{ width: 10, height: 2, backgroundColor: '#fff', borderRadius: 1, marginTop: 3, transform: [{ rotate: '20deg' }, { translateX: -1 }] }} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#8E6BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputBorderGradient: {
    flex: 1,
    borderRadius: 26,
    padding: 1.5,
  },
  input: {
    backgroundColor: '#F0F4F9',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 14,
    color: '#202124',
  },
  btnWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
