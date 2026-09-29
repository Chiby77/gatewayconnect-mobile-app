export const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY ?? '';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Church support inbox. Members' support chats are DMs with this Stream user (created by the token endpoint). */
export const SUPPORT_USER_ID = 'gateway-support';

/**
 * Optional: Stream user ids of church leaders every new member's timeline auto-follows so the
 * community feed is never empty on day one. Comma separated, e.g. "uuid1,uuid2".
 */
export const CHURCH_FEED_IDS = ((process.env.EXPO_PUBLIC_CHURCH_FEED_IDS ?? '') as string)
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

export const isStreamConfigured = Boolean(STREAM_API_KEY && API_URL);
