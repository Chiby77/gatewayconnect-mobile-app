import * as FileSystem from 'expo-file-system/legacy';
import { getAppSetting, getDatabase } from '../db/database';

export interface MediaDownload {
  id: string;
  content_id: string;
  media_type: string;
  local_uri: string;
  checksum: string | null;
  size_bytes: number | null;
  status: string;
  created_at: string;
}

export function getDownloadStatus(contentId: string): MediaDownload | null {
  const row = getDatabase().getFirstSync<any>(`SELECT * FROM media_downloads WHERE content_id = ? LIMIT 1`, [contentId]);
  return row ? (row as MediaDownload) : null;
}

export async function downloadMedia(contentId: string, mediaType: string, remoteUrl: string): Promise<string> {
  // Simple check if it exists
  const existing = getDownloadStatus(contentId);
  if (existing && existing.status === 'complete') {
    return existing.local_uri;
  }

  // Create local file URI
  const filename = remoteUrl.split('/').pop() || `${contentId}.${mediaType === 'audio' ? 'mp3' : 'mp4'}`;
  const localUri = `${FileSystem.documentDirectory}${filename}`;

  try {
    const downloadResumable = FileSystem.createDownloadResumable(remoteUrl, localUri);
    const result = await downloadResumable.downloadAsync();
    
    if (result && result.uri) {
      const db = getDatabase();
      const id = `dl_${Date.now()}`;
      const now = new Date().toISOString();
      db.runSync(
        `INSERT OR REPLACE INTO media_downloads (id, content_id, media_type, local_uri, size_bytes, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'complete', ?)`,
        [id, contentId, mediaType, result.uri, null, now]
      );
      return result.uri;
    } else {
      throw new Error("Download failed");
    }
  } catch (err) {
    console.error("Failed to download media", err);
    throw err;
  }
}

export async function deleteDownload(contentId: string): Promise<void> {
  const existing = getDownloadStatus(contentId);
  if (existing) {
    try {
      await FileSystem.deleteAsync(existing.local_uri, { idempotent: true });
    } catch (e) {
      console.warn("Could not delete file locally", e);
    }
    getDatabase().runSync(`DELETE FROM media_downloads WHERE content_id = ?`, contentId);
  }
}

export async function enforceExpiration(): Promise<void> {
  const lastOnline = getAppSetting('last_online_at');
  if (!lastOnline) return;

  const lastTime = new Date(lastOnline).getTime();
  const now = Date.now();
  const twoDaysMs = 48 * 60 * 60 * 1000;

  if (now - lastTime > twoDaysMs) {
    // Expire all downloads
    const rows = getDatabase().getAllSync<MediaDownload>(`SELECT * FROM media_downloads`);
    for (const row of rows) {
      await deleteDownload(row.content_id);
    }
  }
}
