import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Star, User, Mail, Shield } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isVerified, login, logout, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.back();
        },
      },
    ]);
  };

  // Not signed in
  if (!user) {
    return (
      <View style={styles.centered}>
        <View style={styles.avatarPlaceholder}>
          <User size={48} color="#94A3B8" />
        </View>
        <Text style={styles.guestTitle}>You're not signed in</Text>
        <Text style={styles.guestSub}>
          Sign in with your account to get the{'\n'}Verified Reporter badge and 2× vote weight.
        </Text>
        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.6 }]}
          onPress={login}
          disabled={loading}
        >
          <Text style={styles.signInBtnText}>
            {loading ? 'Loading…' : 'Sign In with Auth0'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Signed in
  const initials = user.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        {isVerified && (
          <View style={styles.badge}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.badgeText}>Verified Reporter · 2× vote weight</Text>
          </View>
        )}
      </View>

      {/* ── Info Cards ── */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Mail size={18} color="#64748B" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Shield size={18} color="#64748B" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardLabel}>Account Status</Text>
            <Text style={[styles.cardValue, { color: '#16A34A' }]}>
              {isVerified ? 'Verified Reporter' : 'Standard'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Star size={18} color="#64748B" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardLabel}>Vote Weight</Text>
            <Text style={styles.cardValue}>{isVerified ? '2× (Verified)' : '0.5× (Anonymous)'}</Text>
          </View>
        </View>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },

  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F4FF', padding: 32,
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#0A1628', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  signInBtn: {
    backgroundColor: '#7C3AED', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, width: '100%', alignItems: 'center',
  },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    backgroundColor: '#0A1628', alignItems: 'center',
    paddingTop: 40, paddingBottom: 32, paddingHorizontal: 24,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 14 },
  avatarFallback: {
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
  },
  initials: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { color: '#94A3B8', fontSize: 14, marginBottom: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F59E0B',
  },
  badgeText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },

  section: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  cardValue: { fontSize: 15, fontWeight: '600', color: '#0A1628' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, padding: 14, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
