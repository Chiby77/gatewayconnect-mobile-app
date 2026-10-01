import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key)
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

/**
 * React Native suspends JS timers while backgrounded, so the token-refresh timer `autoRefreshToken`
 * schedules can simply never fire while the app is away. Without this, reopening the app after any
 * real gap (which is normal usage, not an edge case) leaves a session whose access_token has already
 * expired sitting in storage - every Supabase call after that (chat token issuance, sermons, prayer
 * requests, profile) then fails until the user force-quits and reopens. This is Supabase's own
 * documented requirement for React Native, and was missing:
 * https://supabase.com/docs/guides/auth/quickstarts/react-native
 */
if (isSupabaseConfigured) {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
  if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
}
