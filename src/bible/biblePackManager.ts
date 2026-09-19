import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { BiblePack, installBiblePack } from './biblePack';

export interface DownloadableBiblePack extends BiblePack {
  checksum?: string;
}

async function validatePack(pack: DownloadableBiblePack, raw?: string): Promise<void> {
  if (!pack.id || !pack.version || !pack.packVersion || !Array.isArray(pack.books) || !Array.isArray(pack.verses)) {
    throw new Error('Bible pack is missing required metadata or content.');
  }
  if (!pack.license) throw new Error('Bible pack licensing metadata is required.');
  if (pack.checksum && raw) {
    const checksum = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
    if (checksum.toLowerCase() !== pack.checksum.toLowerCase()) throw new Error('Bible pack checksum verification failed.');
  }
}

export async function downloadBiblePack(url: string): Promise<DownloadableBiblePack> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bible pack download failed: ${response.status}`);
  const raw = await response.text();
  const pack = JSON.parse(raw) as DownloadableBiblePack;
  await validatePack(pack, raw);
  installBiblePack(pack);
  return pack;
}

export async function importBiblePackFile(uri: string): Promise<DownloadableBiblePack> {
  const raw = await FileSystem.readAsStringAsync(uri);
  const pack = JSON.parse(raw) as DownloadableBiblePack;
  await validatePack(pack, raw);
  installBiblePack(pack);
  return pack;
}
