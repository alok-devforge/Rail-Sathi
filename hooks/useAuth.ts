/**
 * useAuth — Real Auth0 PKCE via expo-auth-session
 * Persists the logged-in user to AsyncStorage so they stay signed in.
 *
 * In Auth0 Dashboard → Application URIs → Allowed Callback URLs, add:
 *   exp://10.155.150.53:8081/--/callback
 *   (The app logs the EXACT URI on startup — copy that value)
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import {
  makeRedirectUri,
  useAuthRequest,
  exchangeCodeAsync,
  TokenResponse,
} from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN    = 'dev-71wawdqybqgr07hn.us.auth0.com';
const AUTH0_CLIENT_ID = 'X3bDJ3tmrKSLBWqIuYBNS7Q8rRxD09M6';
const STORAGE_KEY     = '@railsathi_user';

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint:         `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint:    `https://${AUTH0_DOMAIN}/oauth/revoke`,
};

const redirectUri = makeRedirectUri({
  native: 'railsathi://callback',
  scheme: 'railsathi',
  path: 'callback',
});

console.log('[useAuth] ✅ Add this to Auth0 Allowed Callback URLs:', redirectUri);

export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  sub: string;
}

export function useAuth() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true until storage checked

  // Restore persisted user on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => { if (json) setUser(JSON.parse(json)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist user whenever it changes
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, [user]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      console.warn('[useAuth] Auth0 error:', response.error, response.params);
      return;
    }
    if (response.type !== 'success') return;

    const { code } = response.params;
    setLoading(true);

    exchangeCodeAsync(
      {
        clientId: AUTH0_CLIENT_ID,
        code,
        redirectUri,
        extraParams: { code_verifier: request!.codeVerifier! },
      },
      discovery,
    )
      .then((tokens: TokenResponse) =>
        fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }).then((r) => r.json()),
      )
      .then((profile) => {
        setUser({
          name: profile.name ?? profile.email ?? 'User',
          email: profile.email ?? '',
          picture: profile.picture,
          sub: profile.sub,
        });
      })
      .catch((e) => console.warn('[useAuth] token exchange failed:', e))
      .finally(() => setLoading(false));
  }, [response]);

  const isVerified = !!user;
  const voteWeight = user ? 2 : 0.5;
  const login  = useCallback(async () => { await promptAsync(); }, [promptAsync]);
  const logout = useCallback(() => setUser(null), []);

  return { user, isVerified, voteWeight, loading, login, logout };
}



