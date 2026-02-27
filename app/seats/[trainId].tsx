import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { CheckCircle, AlertTriangle, Zap, ArrowRight } from 'lucide-react-native';
import { MOCK_TRAINS } from '../../data/mockData';
import { findSmartSeats } from '../../utils/seatAlgorithm';
import { SplitJourney } from '../../types';
import { useEffect } from 'react';

// Station code lookup from train route
function getCode(routeStation: string): string {
  return routeStation.toUpperCase().slice(0, 3);
}

export default function SeatsScreen() {
  const { trainId, from, to } = useLocalSearchParams<{
    trainId: string;
    from: string;
    to: string;
  }>();
  const navigation = useNavigation();

  const [result, setResult] = useState<SplitJourney | null | undefined>(undefined);
  const [searching, setSearching] = useState(false);

  const train = MOCK_TRAINS.find((t) => t.id === trainId);

  useEffect(() => {
    if (train) navigation.setOptions({ title: `Smart Seats · ${train.number}` });
  }, [train]);

  const handleFind = () => {
    if (!train) return;
    setSearching(true);

    // Find source / dest codes from train route
    const srcCode =
      train.route.find((s) => s.name.toLowerCase().includes((from ?? '').toLowerCase()))?.code ??
      train.route[0].code;
    const dstCode =
      train.route.find((s) => s.name.toLowerCase().includes((to ?? '').toLowerCase()))?.code ??
      train.route[train.route.length - 1].code;

    // Slight delay for UX feedback
    setTimeout(() => {
      const found = findSmartSeats(train.id, srcCode, dstCode);
      setResult(found);
      setSearching(false);
    }, 800);
  };

  if (!train) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-gray-500">Train not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ── Header Card ──────────────────────────────────────────────── */}
        <View
          className="bg-white rounded-xl mb-4 overflow-hidden"
          style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 }}
        >
          <View className="bg-[#2196F3] px-4 py-2">
            <Text className="text-white font-bold text-sm">{train.number} · {train.name}</Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-3">
            <View>
              <Text className="text-gray-800 font-semibold">{from ?? train.from}</Text>
              <Text className="text-gray-400 text-xs">Source</Text>
            </View>
            <ArrowRight size={18} color="#9CA3AF" />
            <View className="items-end">
              <Text className="text-gray-800 font-semibold">{to ?? train.to}</Text>
              <Text className="text-gray-400 text-xs">Destination</Text>
            </View>
          </View>
        </View>

        {/* ── Explanation Card ─────────────────────────────────────────── */}
        <View className="bg-blue-50 rounded-xl p-4 mb-4 flex-row gap-3">
          <Zap size={20} color="#2196F3" />
          <View className="flex-1">
            <Text className="text-blue-800 font-semibold text-sm">Smart Seat Finder</Text>
            <Text className="text-blue-600 text-xs mt-1">
              Can't find a confirmed seat? Rail Sathi checks for "split" options — two partial seats
              that together cover your full journey.
            </Text>
          </View>
        </View>

        {/* ── Search Button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          className="bg-[#2196F3] rounded-xl py-4 items-center mb-6"
          onPress={handleFind}
          disabled={searching}
          activeOpacity={0.85}
        >
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              {result === undefined ? 'CHECK AVAILABLE SEATS' : 'SEARCH AGAIN'}
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result === null && (
          <View className="bg-red-50 rounded-xl p-5 items-center">
            <AlertTriangle size={32} color="#F44336" />
            <Text className="text-red-700 font-bold mt-3 text-base">No Seats Available</Text>
            <Text className="text-red-500 text-sm mt-1 text-center">
              No direct or split seat option found for this route on this train.
            </Text>
          </View>
        )}

        {result && result.type === 'DIRECT' && (
          <View
            className="bg-green-50 rounded-xl p-5 border border-green-200"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle size={22} color="#4CAF50" />
              <Text className="text-green-700 font-bold text-base">Confirmed – Direct Seat</Text>
            </View>
            {result.legs.map((leg, i) => (
              <View key={i} className="bg-white rounded-lg p-3 mb-2">
                <Text className="text-gray-500 text-xs">Seat</Text>
                <Text className="text-gray-800 font-bold text-lg">{leg.seatNumber}</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {leg.fromStation} → {leg.toStation}
                </Text>
              </View>
            ))}
            <Text className="text-green-600 text-sm font-semibold mt-1">
              Estimated Fare: ₹{result.totalFare}
            </Text>
          </View>
        )}

        {result && result.type === 'SPLIT' && (
          <View
            className="bg-green-50 rounded-xl p-5 border border-green-200"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center gap-2 mb-1">
              <Zap size={22} color="#4CAF50" />
              <Text className="text-green-700 font-bold text-base">
                Split Seat Option Found!
              </Text>
            </View>
            <Text className="text-green-600 text-xs mb-4">
              You'll switch seats mid-journey — still confirmed!
            </Text>

            {result.legs.map((leg, i) => (
              <View key={i}>
                <View className="bg-white rounded-lg p-3">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-500 text-xs">
                        Leg {i + 1}: {leg.fromStation} → {leg.toStation}
                      </Text>
                      <Text className="text-gray-800 font-bold text-lg mt-0.5">
                        {leg.seatNumber}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-700 text-xs font-semibold">CONFIRMED</Text>
                    </View>
                  </View>
                </View>
                {i < result.legs.length - 1 && (
                  <View className="items-center py-2">
                    <View className="flex-row items-center gap-2">
                      <View className="h-px w-12 bg-green-300" />
                      <Text className="text-green-600 text-xs font-medium">
                        Switch seat at {leg.toStation}
                      </Text>
                      <View className="h-px w-12 bg-green-300" />
                    </View>
                  </View>
                )}
              </View>
            ))}

            <Text className="text-green-600 text-sm font-semibold mt-3">
              Estimated Fare: ₹{result.totalFare}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
