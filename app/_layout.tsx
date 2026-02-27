import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0A1628' },
          headerTintColor: '#E2E8F0',
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F0F4FF' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Search Results', headerBackTitle: '' }} />
        <Stack.Screen name="demo" options={{ title: 'Smart Seat Demo', headerBackTitle: '' }} />
        <Stack.Screen name="train/[id]" options={{ title: 'Train Details', headerBackTitle: '' }} />
        <Stack.Screen name="seats/[trainId]" options={{ title: 'Smart Seats', headerBackTitle: '' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile', headerBackTitle: '' }} />
        <Stack.Screen name="callback" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
