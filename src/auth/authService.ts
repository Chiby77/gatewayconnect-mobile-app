import * as SecureStore from 'expo-secure-store';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../remote/supabase';
import { registerForPushNotificationsAsync, syncPushTokenToSupabase, removePushTokenFromSupabase } from '../remote/notificationService';

const PROFILE_KEY = 'gatewayconnect_profile';

export interface MobileUser {
  id: string;
  name: string;
  email?: string;
  role: 'member';
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const result = await supabase.auth.getSession();
  return result.data.session;
}

export async function signIn(email: string, password: string): Promise<MobileUser> {
  if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this build.');
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) throw new Error(result.error?.message || 'Unable to sign in.');
  return saveProfile(result.data.user);
}

export async function signUp(email: string, password: string, name: string): Promise<MobileUser> {
  if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this build.');
  const result = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role: 'member' } } });
  if (result.error || !result.data.user) throw new Error(result.error?.message || 'Unable to create account.');
  return saveProfile(result.data.user);
}

export async function signOut(): Promise<void> {
  try {
    const session = await getCurrentSession();
    if (session?.user) {
      const registration = await registerForPushNotificationsAsync();
      if (registration?.token) {
        await removePushTokenFromSupabase(session.user.id, registration.token);
      }
    }
  } catch (err) {
    console.log('Error removing push token on sign out:', err);
  }
  
  await supabase.auth.signOut();
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function getCachedProfile(): Promise<MobileUser | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return raw ? JSON.parse(raw) as MobileUser : null;
}

function saveProfile(user: SupabaseUser): MobileUser {
  const profile: MobileUser = { id: user.id, name: String(user.user_metadata?.full_name || user.email || 'Gateway Member'), email: user.email, role: 'member' };
  void SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

type AuthSubscriber = (profile: MobileUser | null) => void;
const subscribers = new Set<AuthSubscriber>();

export function subscribeToAuth(callback: AuthSubscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = saveProfile(session.user);
      subscribers.forEach(cb => cb(profile));
      
      try {
        const registration = await registerForPushNotificationsAsync();
        if (registration?.token) {
          await syncPushTokenToSupabase(session.user.id, registration.token);
        }
      } catch (err) {
        console.log('Error registering push token on auth state change:', err);
      }
    } else if (event === 'SIGNED_OUT') {
      void SecureStore.deleteItemAsync(PROFILE_KEY);
      subscribers.forEach(cb => cb(null));
    }
  });
}
