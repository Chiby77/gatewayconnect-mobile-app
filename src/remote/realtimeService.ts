import {
  auth,
  db,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from './firebase';

/**
 * Subscribes to real-time Firestore collections when a Firebase user is signed in.
 */
export function startRealtimePersistence(): () => void {
  if (!auth.currentUser) return () => undefined;

  const qPrayers = query(
    collection(db, 'prayerRequests'),
    where('status', 'in', ['active', 'answered']),
    limit(50)
  );

  const unsubPrayers = onSnapshot(
    qPrayers,
    () => {
      // Synced via Firestore real-time cache
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prayerRequests');
    }
  );

  return () => {
    unsubPrayers();
  };
}
