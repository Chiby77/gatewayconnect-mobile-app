import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../remote/supabase';

/**
 * Picks an image and uploads it to Supabase Storage's `avatars` bucket (public, no folder ownership
 * check - see supabase/migrations/20260921_storage_buckets_setup.sql), returning its public URL.
 * Uploading here (rather than to Stream) is deliberate: `avatar_url` lives on the Supabase `users` row,
 * and the Stream token endpoint re-upserts name/image from that row on every connect - one write,
 * both places stay in sync.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  if (res.canceled || !res.assets[0]?.base64) return null;

  const asset = res.assets[0];
  const ext = (asset.mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `${userId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(asset.base64 ?? ''), { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
