import * as SecureStore from 'expo-secure-store';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../remote/supabase';
import { registerForPushNotificationsAsync, syncPushTokenToSupabase, removePushTokenFromSupabase } from '../remote/notificationService';

const PROFILE_KEY = 'gatewayconnect_profile';

export interface MobileUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  handle?: string;
  role: 'member' | 'moderator' | 'super_admin' | 'developer';
  location?: string;
  bio?: string;
  website?: string;
  member_id: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  is_premium: boolean;
  badge_type: 'gold' | 'silver' | 'none';
}

function cleanPhone(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

function arePhoneNumbersEqual(p1: string, p2: string): boolean {
  const c1 = cleanPhone(p1);
  const c2 = cleanPhone(p2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  // Match without country code (e.g. 263781081816 vs 0781081816)
  const norm1 = c1.startsWith('263') ? c1.slice(3) : c1.replace(/^0+/, '');
  const norm2 = c2.startsWith('263') ? c2.slice(3) : c2.replace(/^0+/, '');
  return norm1 === norm2;
}

// Built-in Demo Accounts matching web app and Screenshot 5
export const DEMO_USERS: MobileUser[] = [
  {
    id: 'usr_tinodaishe',
    name: 'Tinodaishe Morgan Chibi',
    phone: '+263781081816',
    handle: '@tinodaishe_morgan_chibi',
    role: 'member',
    location: 'Harare',
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: 'gatewaychurchzim.org',
    member_id: 'GCZ-MEM-5323',
    followers_count: 0,
    following_count: 2,
    is_premium: true,
    badge_type: 'gold',
  },
  {
    id: 'usr_apostle_joe',
    name: 'Apostle Joe Daniels',
    phone: '0772123456',
    handle: '@apostle_joe_daniels',
    role: 'super_admin',
    location: 'Harare, Zimbabwe',
    bio: 'General Overseer & Founder, Gateway Church International. Walking in supernatural dominion and apostolic grace.',
    website: 'gatewaychurchzim.org',
    member_id: 'GCZ-001-APOSTLE',
    followers_count: 14200,
    following_count: 12,
    is_premium: true,
    badge_type: 'gold',
  },
  {
    id: 'usr_prophetess_melinda',
    name: 'Prophetess Melinda Daniels',
    phone: '0775112233',
    handle: '@prophetess_melinda',
    role: 'super_admin',
    location: 'Harare, Zimbabwe',
    bio: 'Co-Founder & General Overseer, Passion Ladies Director. Apostolic and Prophetic Grace.',
    website: 'gatewaychurchzim.org',
    member_id: 'GCZ-002-FOUNDER',
    followers_count: 9800,
    following_count: 15,
    is_premium: true,
    badge_type: 'gold',
  },
  {
    id: 'usr_pastor_easter',
    name: 'Pastor Easter',
    phone: '0771889900',
    handle: '@pastor_easter',
    role: 'super_admin',
    location: 'Harare, Zimbabwe',
    bio: 'National Executive Overseer & Apostolic Administrator. Global kingdom governance.',
    website: 'gatewaychurchzim.org',
    member_id: 'GCZ-003-ADMIN',
    followers_count: 5200,
    following_count: 10,
    is_premium: true,
    badge_type: 'gold',
  },
  {
    id: 'usr_developer',
    name: 'mr_juice7',
    phone: '0780699988',
    handle: '@mr_juice7',
    role: 'developer',
    location: 'Harare, Zimbabwe',
    bio: 'Core Systems Developer & Platform Architect. Engineering scalable cloud solutions for Gateway Connect.',
    website: 'gatewaychurchzim.org',
    member_id: 'GCZ-DEV-001',
    followers_count: 50,
    following_count: 5,
    is_premium: true,
    badge_type: 'gold',
  },
];

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const result = await supabase.auth.getSession();
  return result.data.session;
}

export async function signIn(phoneOrIdentifier: string, password?: string): Promise<MobileUser> {
  const query = phoneOrIdentifier.trim();

  // Check Demo accounts
  const demo = DEMO_USERS.find(u =>
    (u.phone && arePhoneNumbersEqual(u.phone, query)) ||
    (u.handle && u.handle.toLowerCase() === query.toLowerCase())
  );
  if (demo) {
    await saveProfile(demo);
    notifySubscribers(demo);
    return demo;
  }

  // Attempt Supabase auth using synthetic email for phone number
  if (isSupabaseConfigured && password) {
    const syntheticEmail = query.includes('@')
      ? query
      : `${cleanPhone(query) || query.replace(/[^a-zA-Z0-9]/g, '')}@gatewayconnect.joedaniels.org`;

    try {
      const result = await supabase.auth.signInWithPassword({ email: syntheticEmail, password });
      if (result.data.user) {
        const user = mapSupabaseUser(result.data.user, query);
        await saveProfile(user);
        notifySubscribers(user);
        return user;
      }
    } catch {
      // Fall through to local auth
    }
  }

  // Local user account matching
  const cached = await getCachedProfile();
  if (cached && (
    (cached.phone && arePhoneNumbersEqual(cached.phone, query)) ||
    (cached.handle && cached.handle.toLowerCase() === query.toLowerCase()) ||
    cached.name.toLowerCase() === query.toLowerCase()
  )) {
    notifySubscribers(cached);
    return cached;
  }

  // Create or sign in user with phone number
  const handle = query.startsWith('@') ? query : `@${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const localUser: MobileUser = {
    id: `usr_${Date.now().toString().slice(-8)}`,
    name: query.startsWith('07') || query.startsWith('+') ? `Believer (${query})` : query,
    phone: query,
    handle,
    role: 'member',
    location: 'Harare, Zimbabwe',
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: 'gatewaychurchzim.org',
    member_id: `GCZ-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
    followers_count: 0,
    following_count: 2,
    is_premium: false,
    badge_type: 'none',
  };

  await saveProfile(localUser);
  notifySubscribers(localUser);
  return localUser;
}

export async function signUp(
  name: string,
  phone: string,
  password?: string,
  location = 'Harare, Zimbabwe'
): Promise<MobileUser> {
  const cleanP = phone.trim();
  const cleanN = name.trim();
  const handle = `@${cleanN.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const memberId = `GCZ-MEM-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: MobileUser = {
    id: `usr_${Date.now().toString().slice(-8)}`,
    name: cleanN,
    phone: cleanP,
    handle,
    role: 'member',
    location,
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: 'gatewaychurchzim.org',
    member_id: memberId,
    followers_count: 0,
    following_count: 2,
    is_premium: false,
    badge_type: 'none',
  };

  if (isSupabaseConfigured && password) {
    const syntheticEmail = `${cleanPhone(cleanP)}@gatewayconnect.joedaniels.org`;
    try {
      await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: {
            full_name: cleanN,
            phone: cleanP,
            handle,
            role: 'member',
            location,
            member_id: memberId,
          },
        },
      });
    } catch {
      // Offline fallback
    }
  }

  await saveProfile(newUser);
  notifySubscribers(newUser);
  return newUser;
}

export async function updateProfile(updates: Partial<MobileUser>): Promise<MobileUser> {
  const current = await getCachedProfile();
  if (!current) throw new Error('No user currently logged in');
  const updated: MobileUser = { ...current, ...updates };
  await saveProfile(updated);
  notifySubscribers(updated);
  return updated;
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update password' };
  }
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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log('Error during sign out:', err);
  }

  await SecureStore.deleteItemAsync(PROFILE_KEY);
  notifySubscribers(null);
}

export async function getCachedProfile(): Promise<MobileUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as MobileUser) : null;
  } catch {
    return null;
  }
}

async function saveProfile(profile: MobileUser): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

function mapSupabaseUser(user: SupabaseUser, phoneFallback: string): MobileUser {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.full_name || user.email?.split('@')[0] || 'Gateway Member',
    phone: meta.phone || phoneFallback,
    email: user.email,
    handle: meta.handle || `@${(meta.full_name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    role: meta.role || 'member',
    location: meta.location || 'Harare, Zimbabwe',
    bio: meta.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: meta.website || 'gatewaychurchzim.org',
    member_id: meta.member_id || `GCZ-MEM-${user.id.slice(-4)}`,
    avatar_url: meta.avatar_url,
    followers_count: meta.followers_count || 0,
    following_count: meta.following_count || 2,
    is_premium: Boolean(meta.is_premium),
    badge_type: meta.badge_type || 'none',
  };
}

type AuthSubscriber = (profile: MobileUser | null) => void;
const subscribers = new Set<AuthSubscriber>();

export function subscribeToAuth(callback: AuthSubscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function notifySubscribers(profile: MobileUser | null) {
  subscribers.forEach(cb => {
    try {
      cb(profile);
    } catch {}
  });
}
