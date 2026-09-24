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
  badge_type: 'platinum' | 'gold' | 'silver' | 'developer' | 'blue' | 'none';
  badge_expires_at?: string;
  dob?: string;
  gender?: 'male' | 'female';
  is_developer?: boolean;
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


export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const result = await supabase.auth.getSession();
  return result.data.session;
}

export async function signIn(phoneOrIdentifier: string, password?: string): Promise<MobileUser> {
  const query = phoneOrIdentifier.trim();

  // 1. Try Supabase Auth first
  if (isSupabaseConfigured) {
    const syntheticEmail = `${cleanPhone(query)}@gatewayconnect.joedaniels.org`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: query.includes('@') ? query : syntheticEmail,
      password: password || 'gateway2026',
    });

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('Invalid phone number or password. If you do not have an account yet, please tap "Create Account".');
      }
      throw new Error(error.message || 'Authentication failed. Please verify credentials.');
    }

    if (data.user) {
      let mapped = mapSupabaseUser(data.user, query);
      // Fetch latest profile from Supabase users table to ensure sync with web
      try {
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (dbUser) {
          mapped = {
            ...mapped,
            name: dbUser.full_name || mapped.name,
            phone: dbUser.phone || mapped.phone,
            handle: dbUser.handle || mapped.handle,
            role: dbUser.role || mapped.role,
            location: dbUser.location || dbUser.city_location || mapped.location,
            avatar_url: dbUser.avatar_url || mapped.avatar_url,
            bio: dbUser.bio || mapped.bio,
            website: dbUser.website || mapped.website,
            member_id: dbUser.member_id || mapped.member_id,
            badge_type: dbUser.badge_type || mapped.badge_type,
          };
        }
      } catch {}

      await saveProfile(mapped);
      notifySubscribers(mapped);
      return mapped;
    }
  }

  // 2. Check cached profile for offline usage
  const cached = await getCachedProfile();
  if (cached && (arePhoneNumbersEqual(cached.phone || '', query) || cached.handle?.toLowerCase() === query.toLowerCase())) {
    notifySubscribers(cached);
    return cached;
  }

  throw new Error('No account found for this phone number. Please tap "Create Account" to register.');
}

export const AUTO_FOLLOW_ACCOUNTS = [
  { id: 'usr_developer', name: 'mr_juice7', role: 'developer', handle: '@mr_juice7' },
  { id: 'usr_apostle_joe', name: 'Apostle Joe Daniels', role: 'super_admin', handle: '@apostle_joe_daniels' },
  { id: 'usr_prophetess_melinda', name: 'Prophetess Melinda Daniels', role: 'super_admin', handle: '@prophetess_melinda' },
];

export async function autoFollowFounders(userId: string): Promise<string[]> {
  return AUTO_FOLLOW_ACCOUNTS.map(a => a.id);
}

export async function signUp(
  name: string,
  phone: string,
  password?: string,
  location = 'Harare, Zimbabwe',
  dob?: string,
  gender?: 'male' | 'female'
): Promise<MobileUser> {
  const cleanP = phone.trim();
  const cleanN = name.trim();
  const handle = `@${cleanN.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const memberId = `GCZ-MEM-${Math.floor(1000 + Math.random() * 9000)}`;

  let userId = `usr_${Date.now().toString().slice(-8)}`;

  if (isSupabaseConfigured && password) {
    const syntheticEmail = `${cleanPhone(cleanP)}@gatewayconnect.joedaniels.org`;
    const { data, error } = await supabase.auth.signUp({
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
          dob,
          gender,
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error('An account with this phone number already exists. Please tap "Sign In".');
      }
      throw new Error(error.message || 'Failed to create account.');
    }

    if (data.user) {
      userId = data.user.id;
      // Sync into Supabase users table immediately so web sees it right away
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          phone: cleanP,
          full_name: cleanN,
          handle,
          role: 'member',
          location,
          city_location: location,
          member_id: memberId,
          date_of_birth: dob || null,
          gender: gender || 'male',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn('Upsert to users table notice:', dbErr);
      }
    }
  }

  const newUser: MobileUser = {
    id: userId,
    name: cleanN,
    phone: cleanP,
    handle,
    role: 'member',
    location,
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: 'gatewaychurchzim.org',
    member_id: memberId,
    followers_count: 0,
    following_count: AUTO_FOLLOW_ACCOUNTS.length,
    is_premium: false,
    badge_type: 'none',
    dob,
    gender,
  };

  await autoFollowFounders(newUser.id);
  await saveProfile(newUser);
  notifySubscribers(newUser);
  return newUser;
}

export async function updateProfile(updates: Partial<MobileUser>): Promise<MobileUser> {
  const current = await getCachedProfile();
  if (!current) throw new Error('No user currently logged in');
  
  const updated: MobileUser = { ...current, ...updates };
  await saveProfile(updated);
  
  // Sync to Supabase Postgres real-time
  if (isSupabaseConfigured) {
    try {
      const dbPayload = {
        full_name: updated.name,
        phone: updated.phone,
        bio: updated.bio,
        location: updated.location,
        website: updated.website,
        handle: updated.handle,
        avatar_url: updated.avatar_url,
      };
      await supabase.from('users').update(dbPayload).eq('id', current.id);
    } catch (err) {
      console.warn('Failed to sync profile update to Supabase:', err);
    }
  }

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

export async function deleteAccount(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('You must be logged in to delete your account.');
  }

  // Call the remote RPC to safely delete the user from the backend.
  // NOTE: This requires a PostgreSQL function named "delete_user_account"
  // to be created in Supabase that uses SECURITY DEFINER to delete the auth.users record.
  const { error } = await supabase.rpc('delete_user_account');
  if (error) {
    throw new Error(error.message);
  }

  await signOut();
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

// In-memory registry of manually verified members (fallback)
const MANUALLY_VERIFIED_REGISTRY: Record<string, 'platinum' | 'gold' | 'silver' | 'none'> = {};

export async function updateUserBadge(
  userId: string,
  badge: 'platinum' | 'gold' | 'silver' | 'developer' | 'blue' | 'none'
): Promise<MobileUser | null> {
  const current = await getCachedProfile();
  if (current) {
    const updated: MobileUser = {
      ...current,
      badge_type: badge,
      is_premium: badge === 'gold' || badge === 'platinum' || current.is_premium,
      badge_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await saveProfile(updated);
    notifySubscribers(updated);
    return updated;
  }
  return null;
}

export function adminManuallyVerifyMember(
  memberId: string,
  badge: 'platinum' | 'gold' | 'silver' | 'none'
): void {
  MANUALLY_VERIFIED_REGISTRY[memberId] = badge;

}

export function getMemberBadgeOverride(memberId: string): 'platinum' | 'gold' | 'silver' | 'none' | undefined {
  return MANUALLY_VERIFIED_REGISTRY[memberId];
}

export function getAssignableChurchMembers(): Array<{ id: string; name: string; handle: string; role: string; currentBadge: string }> {
  return [
    { id: 'usr_apostle_joe', name: 'Apostle Joe Daniels', handle: '@apostle_joe_daniels', role: 'General Overseer', currentBadge: 'gold' },
    { id: 'usr_prophetess_melinda', name: 'Prophetess Melinda Daniels', handle: '@prophetess_melinda', role: 'Co-Founder', currentBadge: 'gold' },
    { id: 'usr_pastor_easter', name: 'Pastor Easter', handle: '@pastor_easter', role: 'Executive Pastor', currentBadge: MANUALLY_VERIFIED_REGISTRY['usr_pastor_easter'] || 'gold' },
    { id: 'usr_developer', name: 'mr_juice7', handle: '@mr_juice7', role: 'Core Systems Developer', currentBadge: 'developer' },
    { id: 'usr_member_rep', name: 'Harare Fellowship Leader', handle: '@harare_fellowship', role: 'Cell Leader', currentBadge: MANUALLY_VERIFIED_REGISTRY['usr_member_rep'] || 'silver' },
  ];
}


