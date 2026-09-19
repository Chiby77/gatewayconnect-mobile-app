export type SyncState = 'idle' | 'queued' | 'syncing' | 'synced' | 'failed';

let currentState: SyncState = 'idle';
const listeners = new Set<(state: SyncState) => void>();

export function getSyncState(): SyncState {
  return currentState;
}

export function setSyncState(state: SyncState): void {
  currentState = state;
  listeners.forEach(listener => listener(state));
}

export function subscribeToSyncState(listener: (state: SyncState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}
