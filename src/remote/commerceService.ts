import { getNetworkStatus } from '../network/networkStatus';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

function requireOnline(): void {
  if (getNetworkStatus() === 'offline') throw new Error('This action requires an internet connection.');
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  requireOnline();
  if (!apiBaseUrl) throw new Error('GatewayConnect API is not configured for this build.');
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed: ${response.status}`);
  return result as T;
}

export interface PaymentInitiation {
  reference: string;
  browserUrl?: string;
  pollUrl?: string;
  status: 'Created' | 'Sent' | 'Paid' | 'Failed';
}

export function initiatePaynowPayment(payload: { reference: string; amount: number; phone?: string; method?: string }): Promise<PaymentInitiation> {
  return post('/api/paynow/initiate', payload);
}

export function pollPaynowPayment(pollUrl: string): Promise<PaymentInitiation> {
  return post('/api/paynow/poll', { url: pollUrl });
}

export function createBooking(payload: { serviceType: string; preferredDate: string; preferredTime: string; notes?: string }): Promise<{ id: string; status: string }> {
  return post('/api/bookings', payload);
}
