import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutFirebase,
  ensureFirebaseMemberProfile,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from '../remote/firebase';

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

let cachedUser: MobileUser | null = null;
type AuthSubscriber = (profile: MobileUser | null) => void;
const subscribers = new Set<AuthSubscriber>();

function notifySubscribers(profile: MobileUser | null) {
  cachedUser = profile;
  subscribers.forEach((cb) => {
    try {
      cb(profile);
    } catch {}
  });
}

export function subscribeToAuth(callback: AuthSubscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function mapFirebaseUser(user: FirebaseUser): MobileUser {
  const displayName = user.displayName || user.email?.split('@')[0] || 'Gateway Member';
  return {
    id: user.uid,
    name: displayName,
    email: user.email || undefined,
    phone: user.phoneNumber || '0772000111',
    handle: `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    role: 'member',
    location: 'Harare, Zimbabwe',
    bio: 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare',
    website: 'gatewaychurchzim.org',
    member_id: `GCZ-MEM-${user.uid.slice(0, 6).toUpperCase()}`,
    avatar_url: user.photoURL || undefined,
    followers_count: 0,
    following_count: 3,
    is_premium: false,
    badge_type: 'none',
  };
}

export function initAuthListener(): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      notifySubscribers(null);
      return;
    }
    try {
      await ensureFirebaseMemberProfile(fbUser);
      const pubSnap = await getDoc(doc(db, 'users', fbUser.uid));
      const base = mapFirebaseUser(fbUser);
      if (pubSnap.exists()) {
        const data = pubSnap.data();
        base.name = data.name || base.name;
        base.handle = data.handle || base.handle;
        base.member_id = data.memberId || base.member_id;
        base.badge_type = data.badgeType || base.badge_type;
      }
      notifySubscribers(base);
    } catch {
      notifySubscribers(mapFirebaseUser(fbUser));
    }
  });
}

export async function getCachedProfile(): Promise<MobileUser | null> {
  if (auth.currentUser) {
    return mapFirebaseUser(auth.currentUser);
  }
  return cachedUser;
}

export async function signIn(_phoneOrIdentifier?: string, _password?: string): Promise<MobileUser> {
  const fbUser = await signInWithGooglePopup();
  const mapped = mapFirebaseUser(fbUser);
  notifySubscribers(mapped);
  return mapped;
}

export async function signUp(
  name: string,
  phone: string,
  _password?: string,
  location = 'Harare, Zimbabwe'
): Promise<MobileUser> {
  const fbUser = await signInWithGooglePopup();
  const mapped: MobileUser = {
    ...mapFirebaseUser(fbUser),
    name: name.trim() || fbUser.displayName || 'Gateway Member',
    phone: phone.trim() || '0772000111',
    location,
  };
  notifySubscribers(mapped);
  return mapped;
}

export async function updateProfile(updates: Partial<MobileUser>): Promise<MobileUser> {
  const current = cachedUser || (auth.currentUser ? mapFirebaseUser(auth.currentUser) : null);
  if (!current) throw new Error('No user currently logged in');
  const updated: MobileUser = { ...current, ...updates };

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    try {
      await updateDoc(doc(db, 'users', uid), {
        name: updated.name.slice(0, 100),
        handle: (updated.handle || '@believer').slice(0, 60),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }

  notifySubscribers(updated);
  return updated;
}

export async function signOut(): Promise<void> {
  await signOutFirebase();
  notifySubscribers(null);
}

export async function deleteAccount(): Promise<void> {
  await signOut();
}

export async function changePassword(_newPassword: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export const AUTO_FOLLOW_ACCOUNTS = [
  { id: 'usr_developer', name: 'mr_juice7', role: 'developer', handle: '@mr_juice7' },
  { id: 'usr_apostle_joe', name: 'Apostle Joe Daniels', role: 'super_admin', handle: '@apostle_joe_daniels' },
  { id: 'usr_prophetess_melinda', name: 'Prophetess Melinda Daniels', role: 'super_admin', handle: '@prophetess_melinda' },
];

const MANUALLY_VERIFIED_REGISTRY: Record<string, 'platinum' | 'gold' | 'silver' | 'none'> = {};

export async function updateUserBadge(
  _userId: string,
  badge: 'platinum' | 'gold' | 'silver' | 'developer' | 'blue' | 'none'
): Promise<MobileUser | null> {
  if (!cachedUser) return null;
  const updated: MobileUser = {
    ...cachedUser,
    badge_type: badge,
    is_premium: badge === 'gold' || badge === 'platinum' || cachedUser.is_premium,
  };
  notifySubscribers(updated);
  return updated;
}

export function adminManuallyVerifyMember(
  memberId: string,
  badge: 'platinum' | 'gold' | 'silver' | 'none'
): void {
  MANUALLY_VERIFIED_REGISTRY[memberId] = badge;
}

export function getMemberBadgeOverride(
  memberId: string
): 'platinum' | 'gold' | 'silver' | 'none' | undefined {
  return MANUALLY_VERIFIED_REGISTRY[memberId];
}

export function getAssignableChurchMembers(): Array<{
  id: string;
  name: string;
  handle: string;
  role: string;
  currentBadge: string;
}> {
  return [
    { id: 'usr_apostle_joe', name: 'Apostle Joe Daniels', handle: '@apostle_joe_daniels', role: 'General Overseer', currentBadge: 'gold' },
    { id: 'usr_prophetess_melinda', name: 'Prophetess Melinda Daniels', handle: '@prophetess_melinda', role: 'Co-Founder', currentBadge: 'gold' },
    { id: 'usr_pastor_easter', name: 'Pastor Easter', handle: '@pastor_easter', role: 'Executive Pastor', currentBadge: MANUALLY_VERIFIED_REGISTRY['usr_pastor_easter'] || 'gold' },
    { id: 'usr_developer', name: 'mr_juice7', handle: '@mr_juice7', role: 'Core Systems Developer', currentBadge: 'developer' },
  ];
}
