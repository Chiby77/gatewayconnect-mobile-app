import { supabase } from '../remote/supabase';
import { API_URL } from './config';

export interface StreamIdentity {
  token: string;
  user: { id: string; name: string; image?: string };
}

/**
 * Asks the GatewayConnect API for a Stream token. Identity comes from the Supabase session on the
 * server - we deliberately send NO user id (sending one would allow impersonation).
 */
export async function fetchStreamIdentity(): Promise<StreamIdentity> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Please sign in to use chat.');

  // Real church-network conditions are frequently slow rather than fully offline; without a timeout a
  // slow response leaves the app stuck on "Connecting…" indefinitely instead of failing fast so
  // StreamRoot's retry logic (see StreamRoot.tsx) can kick in.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/stream/token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
  } catch (e) {
    throw new Error(e instanceof Error && e.name === 'AbortError' ? 'Chat is taking too long to connect. Check your connection.' : 'Could not reach chat. Check your connection.');
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Your session expired. Please sign in again.' : 'Chat is temporarily unavailable.');
  }
  const body = await res.json();
  return { token: body.token, user: { id: body.user.id, name: body.user.name, image: body.user.image ?? undefined } };
}

/** Stable function reference (required: the Stream hooks re-connect if this identity changes). */
export const streamTokenProvider = async (): Promise<string> => (await fetchStreamIdentity()).token;
