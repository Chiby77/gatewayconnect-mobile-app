/**
 * POST /api/stream/token   — drop this into the GatewayConnect Vercel project (`/api/stream/token.ts`).
 *
 * Why this exists
 *   The mobile app used `client.devToken()`, which Stream rejects for any app that has dev tokens
 *   disabled (the default). Production needs a server that owns the Stream API secret.
 *
 * Security model (do not weaken)
 *   - The Stream user id is derived ONLY from the verified Supabase JWT (`sub`).
 *     The request body / query is never trusted for identity, so nobody can mint a token for someone else.
 *   - STREAM_API_SECRET never leaves the server.
 *
 * Env (Vercel → Project → Settings → Environment Variables):
 *   STREAM_API_KEY, STREAM_API_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Install in the parent repo:  npm i stream-chat @supabase/supabase-js
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { StreamChat } from 'stream-chat';
import { createClient } from '@supabase/supabase-js';

const SUPPORT_USER_ID = 'gateway-support';
const TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4h; the app re-calls this endpoint through its tokenProvider

const need = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const jwt = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return res.status(401).json({ error: 'Missing bearer token' });

    const supabase = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user) return res.status(401).json({ error: 'Invalid session' });

    const authUser = authData.user;
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, avatar_url, role')
      .eq('id', authUser.id)
      .maybeSingle();

    const name = profile?.full_name || authUser.user_metadata?.name || 'Gateway Member';
    const image = profile?.avatar_url || undefined;

    const stream = StreamChat.getInstance(need('STREAM_API_KEY'), need('STREAM_API_SECRET'));

    await stream.upsertUsers([
      { id: authUser.id, name, image },
      // The church support inbox. Member support chats are DMs with this user; staff answer as it.
      { id: SUPPORT_USER_ID, name: 'Gateway Support' },
    ]);

    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const token = stream.createToken(authUser.id, exp);

    return res.status(200).json({
      token,
      user: { id: authUser.id, name, image: image ?? null },
      supportUserId: SUPPORT_USER_ID,
    });
  } catch (e: any) {
    console.error('stream token error', e?.message);
    return res.status(500).json({ error: 'Could not issue chat token' });
  }
}
