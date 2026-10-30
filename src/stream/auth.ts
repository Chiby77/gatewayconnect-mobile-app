import { auth } from '../remote/firebase';
import { API_URL } from './config';

export interface StreamIdentity {
  token: string;
  user: { id: string; name: string; image?: string };
}

/**
 * Asks the GatewayConnect API for a Stream token using the verified Firebase ID token.
 */
export async function fetchStreamIdentity(): Promise<StreamIdentity> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Please sign in to use chat.');
  const idToken = await currentUser.getIdToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/stream/token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      signal: controller.signal,
    });
  } catch (e) {
    throw new Error(
      e instanceof Error && e.name === 'AbortError'
        ? 'Chat is taking too long to connect. Check your connection.'
        : 'Could not reach chat. Check your connection.'
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Your session expired. Please sign in again.'
        : 'Chat is temporarily unavailable.'
    );
  }
  const body = await res.json();
  return {
    token: body.token,
    user: { id: body.user.id, name: body.user.name, image: body.user.image ?? undefined },
  };
}

export const streamTokenProvider = async (): Promise<string> => (await fetchStreamIdentity()).token;
