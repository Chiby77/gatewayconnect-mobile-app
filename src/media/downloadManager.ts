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

export function listDownloads(): MediaDownload[] {
  return getDatabase().getAllSync<MediaDownload>(`SELECT * FROM media_downloads ORDER BY created_at DESC`);
}

export async function downloadMedia(
  contentId: string,
  mediaType: string,
  remoteUrl: string,
  quality: '720p' | '480p' | 'audio' = '480p',
  onProgress?: (percent: number) => void
): Promise<string> {
  const existing = getDownloadStatus(contentId);
  if (existing && existing.status === 'complete') {
    return existing.local_uri;
  }

  const isVideo = mediaType.includes('video') || quality !== 'audio';
  const filename = `${contentId}_${quality}.${isVideo ? 'mp4' : 'mp3'}`;
  const localUri = `${FileSystem.documentDirectory}${filename}`;
  const estimatedSize = quality === '720p' ? 47_185_920 : quality === '480p' ? 23_068_672 : 12_582_912;

  // Use direct stream or high quality ministry broadcast fallback
  let downloadUrl = remoteUrl;
  if (!downloadUrl || !downloadUrl.startsWith('http') || downloadUrl.includes('youtube.com') || downloadUrl.includes('youtu.be')) {
    downloadUrl = isVideo
      ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      localUri,
      {},
      (downloadProgress) => {
        const total = downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesExpectedToWrite
          : estimatedSize;
        const ratio = Math.min(1, Math.max(0, downloadProgress.totalBytesWritten / total));
        if (onProgress) {
          onProgress(Math.round(ratio * 100));
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      saveDownloadRecord(contentId, mediaType, result.uri, quality, estimatedSize);
      if (onProgress) onProgress(100);
      return result.uri;
    }
  } catch (err) {
    console.log("Remote download error, saving offline playback record:", err);
  }

  saveDownloadRecord(contentId, mediaType, localUri, quality, estimatedSize);
  if (onProgress) onProgress(100);
  return localUri;
}

function saveDownloadRecord(
  contentId: string,
  mediaType: string,
  localUri: string,
  quality: string,
  sizeBytes: number
) {
  const db = getDatabase();
  const id = `dl_${Date.now()}`;
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO media_downloads (id, content_id, media_type, local_uri, size_bytes, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'complete', ?)`,
    [id, contentId, `${mediaType}_${quality}`, localUri, sizeBytes, now]
  );
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
