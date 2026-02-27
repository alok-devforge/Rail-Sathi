import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { CheckCircle, AlertTriangle, Zap, ArrowRight, RefreshCw } from 'lucide-react-native';
import { findSmartSeats } from '../utils/seatAlgorithm';
import { SplitJourney } from '../types';
import { MOCK_TRAINS } from '../data/mockData';

interface Scenario {
  id: number;
  label: string;
  description: string;
  trainId: string;
  fromCode: string;
  toCode: string;
  expectedType: 'DIRECT' | 'SPLIT' | 'NONE';
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    label: 'Scenario 1 — Direct Seat',
    description: 'Passenger needs to travel from Howrah to New Delhi on the Howrah Rajdhani. A full-journey confirmed seat is available.',
    trainId: '12301',
    fromCode: 'HWH',
    toCode: 'NDLS',
    expectedType: 'DIRECT',
  },
  {
    id: 2,
    label: 'Scenario 2 — Smart Split',
    description: 'No direct seat from Howrah to Prayagraj (ALD). Rail Sathi finds a split: first seat upto Gaya, second seat from Gaya onwards — both confirmed.',
    trainId: '12301',
    fromCode: 'HWH',
    toCode: 'ALD',
    expectedType: 'SPLIT',
  },
  {
    id: 3,
    label: 'Scenario 3 — No Seat Found',
    description: 'Passenger searches Kanpur → Secunderabad on Tamil Nadu Express. Train is fully booked for this segment — no direct or split option exists.',
    trainId: '12621',
    fromCode: 'CNB',
    toCode: 'SC',
    expectedType: 'NONE',
  },
];

function getStationName(trainId: string, code: string): string {
  const train = MOCK_TRAINS.find((t) => t.id === trainId);
  return train?.route.find((s) => s.code === code)?.name ?? code;
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [result, setResult] = useState<SplitJourney | null | undefined>(undefined);
  const [running, setRunning] = useState(false);

  const train = MOCK_TRAINS.find((t) => t.id === scenario.trainId);

  const run = () => {
    setResult(undefined);
    setRunning(true);
    setTimeout(() => {
      const found = findSmartSeats(scenario.trainId, scenario.fromCode, scenario.toCode);
      setResult(found ?? null);
      setRunning(false);
    }, 900);
  };

  useEffect(() => { run(); }, []);

  const fromName = getStationName(scenario.trainId, scenario.fromCode);
  const toName   = getStationName(scenario.trainId, scenario.toCode);

  return (
    <View
      className="bg-white rounded-2xl mb-5 overflow-hidden"
      style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 }}
    >
      {/* Header */}
      <View className="bg-[#2196F3] px-4 py-3 flex-row justify-between items-center">
        <View>
          <Text className="text-white font-bold text-sm">{scenario.label}</Text>
          <Text className="text-blue-200 text-xs mt-0.5">
            {train?.number} · {train?.name}
          </Text>
        </View>
        <TouchableOpacity onPress={run} disabled={running} className="opacity-80">
          <RefreshCw size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="p-4">
        {/* Route */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <Text className="text-blue-700 font-semibold text-sm">{fromName}</Text>
            <Text className="text-blue-400 text-xs">{scenario.fromCode}</Text>
          </View>
          <ArrowRight size={16} color="#9CA3AF" />
          <View className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <Text className="text-blue-700 font-semibold text-sm">{toName}</Text>
            <Text className="text-blue-400 text-xs">{scenario.toCode}</Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-gray-500 text-xs mb-4 leading-5">{scenario.description}</Text>

        {/* Result */}
        {running || result === undefined ? (
          <View className="bg-gray-50 rounded-xl p-4 items-center">
            <ActivityIndicator color="#2196F3" />
            <Text className="text-gray-400 text-xs mt-2">Running algorithm…</Text>
          </View>
        ) : result === null ? (
          <View className="bg-red-50 rounded-xl p-4 flex-row items-center gap-3">
            <AlertTriangle size={22} color="#F44336" />
            <View className="flex-1">
              <Text className="text-red-700 font-bold text-sm">No Seats Available</Text>
              <Text className="text-red-500 text-xs mt-1">
                No direct or split option found. Passenger would be waitlisted.
              </Text>
            </View>
          </View>
        ) : result.type === 'DIRECT' ? (
          <View className="bg-green-50 rounded-xl p-4 border border-green-200">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle size={20} color="#4CAF50" />
              <Text className="text-green-700 font-bold text-sm">Direct Confirmed Seat</Text>
            </View>
            {result.legs.map((leg, i) => (
              <View key={i} className="bg-white rounded-lg p-3 mb-2">
                <Text className="text-gray-800 font-bold text-xl">{leg.seatNumber}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {leg.fromStation} → {leg.toStation} · Full journey
                </Text>
              </View>
            ))}
            <Text className="text-green-600 text-xs font-semibold mt-1">
              Est. Fare: ₹{result.totalFare}
            </Text>
          </View>
        ) : (
          <View className="bg-green-50 rounded-xl p-4 border border-green-200">
            <View className="flex-row items-center gap-2 mb-1">
              <Zap size={20} color="#4CAF50" />
              <Text className="text-green-700 font-bold text-sm">Smart Split Found!</Text>
            </View>
            <Text className="text-green-600 text-xs mb-3">
              Both legs are confirmed — passenger switches seats mid-journey
            </Text>
            {result.legs.map((leg, i) => (
              <View key={i}>
                <View className="bg-white rounded-lg p-3">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="text-gray-400 text-xs">Leg {i + 1}</Text>
                      <Text className="text-gray-800 font-bold text-xl mt-0.5">{leg.seatNumber}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {leg.fromStation} → {leg.toStation}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded-full mt-1">
                      <Text className="text-green-700 text-xs font-bold">CONFIRMED</Text>
                    </View>
                  </View>
                </View>
                {i < result.legs.length - 1 && (
                  <View className="items-center py-2">
                    <View className="flex-row items-center gap-2">
                      <View className="h-px flex-1 bg-green-300" />
                      <View className="bg-orange-100 px-3 py-1 rounded-full">
                        <Text className="text-orange-700 text-xs font-semibold">
                          ↕ Switch seat at {leg.toStation}
                        </Text>
                      </View>
                      <View className="h-px flex-1 bg-green-300" />
                    </View>
                  </View>
                )}
              </View>
            ))}
            <Text className="text-green-600 text-xs font-semibold mt-2">
              Est. Fare: ₹{result.totalFare}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DemoScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: 'Smart Seat Finder — Demo' });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Intro Banner */}
        <View className="bg-[#2196F3] rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Zap size={20} color="#fff" />
            <Text className="text-white font-bold text-base">Smart Seat Finder</Text>
          </View>
          <Text className="text-blue-100 text-xs leading-5">
            Rail Sathi goes beyond regular seat availability. When no direct confirmed seat exists,
            our algorithm finds two partial seats that together cover your full journey — so you
            always travel confirmed.
          </Text>
        </View>

        {SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
