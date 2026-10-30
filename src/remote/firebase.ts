import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

/**
 * Ensures the authenticated user has both their public `/users/{uid}` document
 * and isolated `/users/{uid}/private/info` PII document provisioned in Firestore.
 */
export async function ensureFirebaseMemberProfile(user: FirebaseUser): Promise<void> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  try {
    const existingSnap = await getDoc(doc(db, 'users', uid));
    if (!existingSnap.exists()) {
      const displayName = (user.displayName || user.email?.split('@')[0] || 'Gateway Member').slice(0, 100);
      const cleanHandle = `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40) || 'believer'}`;
      const memberId = `GCZ-MEM-${uid.slice(0, 6).toUpperCase()}`;

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: displayName,
        handle: cleanHandle,
        memberId,
        badgeType: 'none',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'users', uid, 'private', 'info'), {
        uid,
        email: (user.email || '').slice(0, 160),
        phone: (user.phoneNumber || '0772000111').slice(0, 40),
        location: 'Harare, Zimbabwe',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureFirebaseMemberProfile(credential.user);
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  onAuthStateChanged,
};
export type { FirebaseUser };
