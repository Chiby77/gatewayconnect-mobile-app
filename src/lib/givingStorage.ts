import localforage from 'localforage';
import { GivingReceipt, SermonItem } from './domainLogic';
import {
  db,
  doc,
  setDoc,
  serverTimestamp,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../remote/firebase';

export interface StoredGivingReceipt extends GivingReceipt {
  synced: boolean;
  createdAtMs: number;
}

const receiptStore = localforage.createInstance({
  name: 'gatewayconnect_db',
  storeName: 'giving_receipts',
  description: 'IndexedDB storage for Gateway Connect giving receipts with background sync',
});

const offlineSermonStore = localforage.createInstance({
  name: 'gatewayconnect_db',
  storeName: 'offline_sermons',
  description: 'IndexedDB storage for downloaded offline sermons',
});

/**
 * Stores a downloaded sermon in local browser IndexedDB for offline watching.
 */
export async function saveOfflineSermonToIndexedDB(sermon: SermonItem): Promise<SermonItem> {
  await offlineSermonStore.setItem(sermon.id, sermon);
  return sermon;
}

/**
 * Removes a downloaded sermon from local browser IndexedDB.
 */
export async function removeOfflineSermonFromIndexedDB(sermonId: string): Promise<void> {
  await offlineSermonStore.removeItem(sermonId);
}

/**
 * Loads all downloaded sermons stored in browser IndexedDB for offline watching.
 */
export async function loadOfflineSermonsFromIndexedDB(): Promise<SermonItem[]> {
  const items: SermonItem[] = [];
  await offlineSermonStore.iterate<SermonItem, void>((value) => {
    if (value && value.id) {
      items.push(value);
    }
  });
  return items;
}

/**
 * Stores a giving receipt in the local browser IndexedDB via localforage.
 */
export async function saveReceiptToIndexedDB(
  receipt: GivingReceipt,
  synced = false
): Promise<StoredGivingReceipt> {
  const stored: StoredGivingReceipt = {
    ...receipt,
    synced,
    createdAtMs: Date.now(),
  };
  await receiptStore.setItem(receipt.id, stored);
  return stored;
}

/**
 * Loads all stored giving receipts from browser IndexedDB sorted newest-first.
 */
export async function loadReceiptsFromIndexedDB(): Promise<StoredGivingReceipt[]> {
  const items: StoredGivingReceipt[] = [];
  await receiptStore.iterate<StoredGivingReceipt, void>((value) => {
    if (value && value.id) {
      items.push(value);
    }
  });
  return items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

/**
 * Marks a specific receipt in local IndexedDB as synchronized with the cloud.
 */
export async function markReceiptSyncedInIndexedDB(receiptId: string): Promise<void> {
  const existing = await receiptStore.getItem<StoredGivingReceipt>(receiptId);
  if (existing) {
    await receiptStore.setItem(receiptId, { ...existing, synced: true });
  }
}

/**
 * Synchronizes any unsynced local IndexedDB receipts with Firestore when the network is available.
 */
export async function syncOfflineReceiptsToFirestore(
  uid: string | null
): Promise<{ syncedCount: number; receipts: StoredGivingReceipt[] }> {
  const allReceipts = await loadReceiptsFromIndexedDB();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline || !uid || !isFirebaseConfigured) {
    return { syncedCount: 0, receipts: allReceipts };
  }

  let syncedCount = 0;
  for (const receipt of allReceipts) {
    if (!receipt.synced) {
      const path = `givingReceipts/${receipt.id}`;
      try {
        await setDoc(doc(db, 'givingReceipts', receipt.id), {
          ownerId: uid,
          receiptCode: receipt.id.slice(0, 40),
          amount: Number(receipt.amount),
          formattedAmount: receipt.formattedAmount.slice(0, 40),
          currency: receipt.currency,
          fund: receipt.fund.slice(0, 80),
          method: receipt.method.slice(0, 40),
          status: 'completed',
          createdAt: serverTimestamp(),
        });
        await markReceiptSyncedInIndexedDB(receipt.id);
        receipt.synced = true;
        syncedCount += 1;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  }

  const updatedReceipts = await loadReceiptsFromIndexedDB();
  return { syncedCount, receipts: updatedReceipts };
}

/**
 * Registers browser network online event listener to automatically synchronize IndexedDB receipts.
 */
export function registerGivingNetworkSync(
  getUid: () => string | null,
  onSynced?: (syncedCount: number, receipts: StoredGivingReceipt[]) => void
): () => void {
  const handleOnline = async () => {
    const uid = getUid();
    if (!uid) return;
    try {
      const result = await syncOfflineReceiptsToFirestore(uid);
      if (onSynced) {
        onSynced(result.syncedCount, result.receipts);
      }
    } catch {
      // Keep unsynced items in IndexedDB for next retry
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }
  return () => {};
}
