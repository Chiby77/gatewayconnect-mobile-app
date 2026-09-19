import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { setAppSetting } from '../db/database';

export type NetworkStatus = 'online' | 'offline';

let currentStatus: NetworkStatus = 'online';
let initialized = false;
const listeners = new Set<(status: NetworkStatus) => void>();

function mapStatus(state: NetInfoState): NetworkStatus {
  return state.isConnected === false || state.isInternetReachable === false ? 'offline' : 'online';
}

export function initializeNetworkStatus(): () => void {
  if (initialized) return () => undefined;
  initialized = true;
  const unsubscribe = NetInfo.addEventListener(state => {
    const newStatus = mapStatus(state);
    if (newStatus === 'online') {
      try { setAppSetting('last_online_at', new Date().toISOString()); } catch(e) {}
    }
    currentStatus = newStatus;
    listeners.forEach(listener => listener(currentStatus));
  });
  return unsubscribe;
}

export function getNetworkStatus(): NetworkStatus {
  return currentStatus;
}

export function subscribeToNetworkStatus(listener: (status: NetworkStatus) => void): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}
