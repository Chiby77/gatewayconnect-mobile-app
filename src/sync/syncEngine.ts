import { getDatabase } from '../db/database';
import { isSupabaseConfigured, supabase } from '../remote/supabase';
import { getNetworkStatus, initializeNetworkStatus, subscribeToNetworkStatus } from '../network/networkStatus';
import { getCursor, listPendingMutations, markFailed, markProcessing, markSynced, saveCursor } from './outbox';
import { OfflineMutation } from '../types/domain';
import { setSyncState } from './syncStatus';
import { AppState } from 'react-native';
import { SettingsRepository } from '../settings/settingsRepository';
import { downloadMedia } from '../media/downloadManager';

const TABLES: Record<string, string> = {
  prayer_request: 'prayer_requests',
  comment: 'post_comments',
  post: 'posts',
  group: 'group_members',
  message: 'messages',
  notification: 'notifications',
  profile: 'users'
};

function tableFor(entityType: string): string {
  const table = TABLES[entityType];
  if (!table) throw new Error(`Unsupported sync entity: ${entityType}`);
  return table;
}

async function applyMutation(mutation: OfflineMutation): Promise<void> {
  const table = tableFor(mutation.entityType);
  const client = supabase.from(table as never) as any;
  const payload = { ...(mutation.payload as Record<string, unknown>), id: mutation.entityId };
  if (mutation.operation === 'create') {
    const result = await client.insert(payload);
    if (result.error) throw result.error;
    return;
  }
  if (mutation.operation === 'update' || mutation.operation === 'action') {
    const result = await client.update(payload).eq('id', mutation.entityId);
    if (result.error) throw result.error;
    return;
  }
  const result = await client.delete().eq('id', mutation.entityId);
  if (result.error) throw result.error;
}

export async function syncPendingMutations(): Promise<{ synced: number; failed: number }> {
  if (!isSupabaseConfigured || getNetworkStatus() === 'offline') return { synced: 0, failed: 0 };
  setSyncState('syncing');
  let synced = 0;
  let failed = 0;
  for (const mutation of listPendingMutations()) {
    markProcessing(mutation.id);
    try {
      await applyMutation(mutation);
      markSynced(mutation.id);
      synced += 1;
    } catch (error) {
      markFailed(mutation.id, error instanceof Error ? error.message : 'Sync failed', mutation.attemptCount);
      failed += 1;
    }
  }
  setSyncState(failed > 0 ? 'failed' : synced > 0 ? 'synced' : 'idle');
  return { synced, failed };
}

async function pullResource(resource: string, table: string): Promise<void> {
  if (!isSupabaseConfigured || getNetworkStatus() === 'offline') return;
  const cursor = getCursor(resource);
  let query = (supabase.from(table as never) as any).select('*').order('updated_at', { ascending: true }).limit(100);
  if (cursor) query = query.gt('updated_at', cursor);
  const result = await query;
  if (result.error || !Array.isArray(result.data)) return;
  const database = getDatabase();
  for (const row of result.data) {
    if (resource === 'notifications') {
      database.runSync(
        `INSERT OR REPLACE INTO notifications (id, title, body, read_at, created_at) VALUES (?, ?, ?, ?, ?)`,
        row.id, row.title || '', row.body || '', row.read_at || null, row.created_at || new Date().toISOString()
      );
    } else if (resource === 'groups') {
      database.runSync(
        `INSERT OR REPLACE INTO groups (id, name, description, location, updated_at) VALUES (?, ?, ?, ?, ?)`,
        row.id, row.name || '', row.description || '', row.location || null, row.updated_at || new Date().toISOString()
      );
    } else if (resource === 'events') {
      database.runSync(
        `INSERT OR REPLACE INTO events (id, title, event_date, event_time, location, description, banner_url, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id, row.title || '', row.event_date || '', row.event_time || '', row.location || '', row.description || null, row.banner_url || null, row.category || null, row.created_at || new Date().toISOString()
      );
    } else if (resource === 'content_items') {
      const meta = typeof row.metadata === 'string' ? row.metadata : JSON.stringify(row.metadata || {});
      database.runSync(
        `INSERT OR REPLACE INTO content_items (id, type, title, body, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        row.id, row.type || '', row.title || '', row.body || '', meta,
        row.created_at || new Date().toISOString(), row.updated_at || new Date().toISOString()
      );
      if (row.type === 'sermon' && !SettingsRepository.getLowDataMode()) {
        const metadataObj = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {});
        if (metadataObj.video_url) {
          downloadMedia(row.id, 'video', metadataObj.video_url).catch(e => console.log('Auto-download video failed:', e));
        } else if (metadataObj.audio_url) {
          downloadMedia(row.id, 'audio', metadataObj.audio_url).catch(e => console.log('Auto-download audio failed:', e));
        }
      }
    } else if (resource === 'sermons') {
      // Web app stores sermons in a dedicated `sermons` table — bridge into local content_items
      const meta = JSON.stringify({
        audio_url: row.audio_url || null,
        video_url: row.video_url || null,
        youtube_id: row.youtube_id || null,
        speaker: row.speaker || null,
        series: row.series || null,
        thumbnail_url: row.thumbnail_url || null,
      });
      database.runSync(
        `INSERT OR REPLACE INTO content_items (id, type, title, body, metadata, created_at, updated_at) VALUES (?, 'sermon', ?, ?, ?, ?, ?)`,
        row.id, row.title || '', row.description || row.body || '', meta,
        row.created_at || new Date().toISOString(), row.updated_at || new Date().toISOString()
      );
      if (!SettingsRepository.getLowDataMode() && row.audio_url) {
        downloadMedia(row.id, 'audio', row.audio_url).catch(() => {});
      }
    } else if (resource === 'devotionals') {
      // Web app stores devotionals in `devotionals` table — bridge into local content_items
      const fullBody = [
        row.content || '',
        row.scripture_verse ? `\n\nScripture: ${row.scripture_reference || ''}\n"${row.scripture_verse}"` : '',
        row.prayer ? `\n\nPrayer:\n${row.prayer}` : '',
        row.declaration ? `\n\nDeclaration:\n${row.declaration}` : '',
      ].filter(Boolean).join('');
      const meta = JSON.stringify({
        speaker: row.author || 'Apostle Joe Daniels',
        scripture: row.scripture_reference || '',
        date: row.publish_date || 'Today',
      });
      database.runSync(
        `INSERT OR REPLACE INTO content_items (id, type, title, body, metadata, created_at, updated_at) VALUES (?, 'devotional', ?, ?, ?, ?, ?)`,
        row.id, row.title || '', fullBody, meta,
        row.created_at || new Date().toISOString(), row.updated_at || new Date().toISOString()
      );
    } else if (resource === 'products') {
      database.runSync(
        `INSERT OR REPLACE INTO products (id, name, description, price, currency, image_url, category, in_stock, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id, row.name || '', row.description || '', row.price || 0,
        row.currency || 'USD', row.image_url || null, row.category || null,
        row.in_stock !== false ? 1 : 0, row.updated_at || new Date().toISOString()
      );
    }
  }
  const last = result.data.at(-1)?.updated_at || result.data.at(-1)?.created_at;
  if (last) saveCursor(resource, last);
}

export async function syncNow(): Promise<void> {
  await syncPendingMutations();
  await pullResource('notifications', 'notifications');
  await pullResource('groups', 'groups');
  await pullResource('group_members', 'group_members');
  await pullResource('prayer_requests', 'prayer_requests');
  await pullResource('content_items', 'content_items');
  await pullResource('community_comments', 'community_comments');
  await pullResource('events', 'events');
  await pullResource('sermons', 'sermons');       // web sermons table → local content_items
  await pullResource('devotionals', 'devotionals'); // web devotionals table → local content_items
  await pullResource('products', 'products');     // web products/store table
}

export function startSyncEngine(): () => void {
  const unsubscribe = initializeNetworkStatus();
  const unsubscribeStatus = subscribeToSyncNetwork();
  const interval = setInterval(() => { void syncNow(); }, 30_000);
  const appStateSubscription = AppState.addEventListener('change', state => {
    if (state === 'active') void syncNow();
  });
  void syncNow();
  return () => {
    unsubscribe();
    unsubscribeStatus();
    clearInterval(interval);
    appStateSubscription.remove();
  };
}

function subscribeToSyncNetwork(): () => void {
  return subscribeToNetworkStatus(status => {
    if (status === 'online') void syncNow();
  });
}
