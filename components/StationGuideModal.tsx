import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { MapPin, X, Send } from 'lucide-react-native';
import { SERVER_URL } from '../utils/serverConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Suggestion {
  category: string;
  emoji: string;
  items: string[];
}

interface StationGuideResult {
  summary: string;
  suggestions: Suggestion[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  stationName: string;
  stationCode: string;
  delayMinutes: number;
}

export default function StationGuideModal({
  visible,
  onClose,
  stationName,
  stationCode,
  delayMinutes,
}: Props) {
  const insets = useSafeAreaInsets();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StationGuideResult | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/station-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationName, stationCode, delayMinutes, question: q }),
      });
      const data = await res.json();
      if (!res.ok || !data.suggestions) {
        Alert.alert('Station Guide', data.error ?? 'Could not fetch guide. Try again.');
        return;
      }
      setResult(data);
    } catch {
      Alert.alert('Station Guide', 'Could not reach server. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setQuestion('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* Backdrop sits behind the sheet; tapping it closes the modal */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
      </Pressable>

      {/* Sheet — sibling of backdrop so it never interferes with ScrollView */}
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        {/* White fill behind rounded corners so no gap shows at the bottom */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 + insets.bottom, backgroundColor: '#fff' }} />
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            height: '65%',
            paddingBottom: insets.bottom,
          }}
        >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E2E8F0',
                alignSelf: 'center',
                marginTop: 12,
                marginBottom: 4,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <MapPin size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '800' }}>
                  Station Guide
                </Text>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                  {stationName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 50 : 32 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Question input */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    minHeight: 48,
                  }}
                >
                  <TextInput
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Ask anything about the station…"
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{
                      fontSize: 14,
                      color: '#0F172A',
                      lineHeight: 20,
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAsk}
                  disabled={loading || !question.trim()}
                  activeOpacity={0.8}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: loading || !question.trim() ? '#CBD5E1' : '#059669',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Loading state */}
              {loading && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={{ color: '#64748B', fontSize: 14, marginTop: 12 }}>
                    Finding tips for {stationName}…
                  </Text>
                </View>
              )}

              {/* Results */}
              {result && !loading && (
                <View>
                  {/* Summary banner */}
                  <View
                    style={{
                      backgroundColor: '#ECFDF5',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                    }}
                  >
                    <Text style={{ color: '#065F46', fontSize: 13, lineHeight: 20 }}>
                      {result.summary}
                    </Text>
                  </View>

                  {/* Category cards */}
                  {result.suggestions.map((section) => (
                    <View
                      key={section.category}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{section.emoji}</Text>
                        <Text
                          style={{ color: '#0F172A', fontSize: 14, fontWeight: '800' }}
                        >
                          {section.category}
                        </Text>
                      </View>
                      {section.items.map((item, i) => (
                        <View
                          key={i}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: 8,
                            marginBottom: i < section.items.length - 1 ? 8 : 0,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#059669',
                              marginTop: 6,
                              flexShrink: 0,
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color: '#334155',
                              lineHeight: 20,
                            }}
                          >
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}

                  {/* Powered by tag */}
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#94A3B8',
                      marginTop: 4,
                    }}
                  >
                    Powered by Groq · llama-3.3-70b-versatile
                  </Text>
                </View>
              )}

              {/* Empty state hint */}
              {!result && !loading && (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>🗺️</Text>
                  <Text
                    style={{
                      color: '#94A3B8',
                      fontSize: 13,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Ask about food, lounges, shopping,{'\n'}or anything else at {stationName}.
                  </Text>
                </View>
              )}
            </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
