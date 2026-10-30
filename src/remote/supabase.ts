// Replaced Supabase client with Firebase Auth & Cloud Firestore bridge.
export {
  db,
  auth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from './firebase';
export const isSupabaseConfigured = false;
export const supabase = null as any;
