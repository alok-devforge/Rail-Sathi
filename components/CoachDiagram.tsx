import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { DensityLevel, CoachStatus } from '../types';

interface CoachDiagramProps {
  trainNo: string;
  coaches: CoachStatus[];
  onCoachPress?: (coach: CoachStatus) => void;
  selectedCoachId?: string;
}

function densityConfig(density: DensityLevel | null) {
  if (density === 'LOW')    return { bg: '#DCFCE7', border: '#22C55E', dot: '#22C55E', label: 'Low'  };
  if (density === 'MEDIUM') return { bg: '#FEF9C3', border: '#EAB308', dot: '#EAB308', label: 'Mod'  };
  if (density === 'HIGH')   return { bg: '#FEE2E2', border: '#EF4444', dot: '#EF4444', label: 'Full' };
  return                           { bg: '#F1F5F9', border: '#CBD5E1', dot: '#CBD5E1', label: '?'    };
}

/** Three small rectangular windows inside the coach body */
function CoachWindows({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 5 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 11,
            height: 9,
            backgroundColor: color + '30',
            borderRadius: 2,
            borderWidth: 1,
            borderColor: color + '60',
          }}
        />
      ))}
    </View>
  );
}

/** Two circular wheels peeking below the coach body */
function CoachWheels() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: -4 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: '#1E293B',
            borderWidth: 2,
            borderColor: '#475569',
          }}
        />
      ))}
    </View>
  );
}

export default function CoachDiagram({ coaches, onCoachPress, selectedCoachId }: CoachDiagramProps) {
  return (
    <View style={{ paddingBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 6 }}
      >
        {coaches.map((coach) => {
          const isEngine   = coach.type === 'ENGINE';
          const isSelected = selectedCoachId === coach.coachId;
          const cfg        = densityConfig(coach.density);

          if (isEngine) {
            return (
              <View key={coach.coachId} style={{ alignItems: 'center', width: 58 }}>
                {/* Engine body — pointed front (right side) */}
                <View
                  style={{
                    width: 58,
                    height: 44,
                    backgroundColor: '#0F172A',
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 6,
                    borderWidth: 2,
                    borderColor: '#1E293B',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 8,
                    overflow: 'hidden',
                  }}
                >
                  {/* Cab window */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 10,
                      width: 14,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: '#1E3A5F',
                      borderWidth: 1,
                      borderColor: '#2563EB50',
                    }}
                  />
                  {/* Headlight */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 9,
                      right: 7,
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: '#FBBF24',
                    }}
                  />
                  <Text style={{ color: '#64748B', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}>
                    ENG
                  </Text>
                </View>
                {/* Engine wheels (3 — slightly bigger) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 44, marginTop: -4 }}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 6,
                        backgroundColor: '#1E293B',
                        borderWidth: 2,
                        borderColor: '#334155',
                      }}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 9, color: '#475569', marginTop: 5, fontWeight: '600' }}>{' '}</Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={coach.coachId}
              onPress={() => onCoachPress?.(coach)}
              activeOpacity={0.75}
              style={{ alignItems: 'center', width: 64 }}
            >
              {/* Coach carriage body */}
              <View
                style={{
                  width: 62,
                  height: 44,
                  backgroundColor: cfg.bg,
                  borderRadius: 8,
                  borderWidth: isSelected ? 2.5 : 1.5,
                  borderColor: isSelected ? cfg.border : cfg.border + '55',
                  paddingBottom: 4,
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* Selected accent stripe at top */}
                <View
                  style={{
                    height: isSelected ? 4 : 0,
                    backgroundColor: cfg.border,
                  }}
                />
                <View style={{ paddingTop: isSelected ? 3 : 7 }}>
                  <CoachWindows color={cfg.dot} />
                </View>
                {/* Floor separation line */}
                <View
                  style={{
                    height: 1.5,
                    marginHorizontal: 4,
                    backgroundColor: cfg.border + '35',
                  }}
                />
              </View>

              <CoachWheels />

              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? cfg.border : '#64748B',
                  marginTop: 5,
                }}
              >
                {coach.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 14, marginTop: 4 }}>
        {[
          { dot: '#22C55E', label: 'Empty' },
          { dot: '#EAB308', label: 'Moderate' },
          { dot: '#EF4444', label: 'Crowded' },
          { dot: '#CBD5E1', label: 'Unknown' },
        ].map((item) => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.dot }} />
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}


interface CoachDiagramProps {
  trainNo: string;
  coaches: CoachStatus[];
  onCoachPress?: (coach: CoachStatus) => void;
  selectedCoachId?: string;
}

function densityColor(density: DensityLevel | null): string {
  if (density === 'LOW') return '#4CAF50';
  if (density === 'MEDIUM') return '#FFC107';
  if (density === 'HIGH') return '#F44336';
  return '#E5E7EB'; // unknown
}

function densityLabel(density: DensityLevel | null): string {
  if (density === 'LOW') return 'Low';
  if (density === 'MEDIUM') return 'Mod';
  if (density === 'HIGH') return 'Full';
  return '?';
}
