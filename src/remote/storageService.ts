import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { Video, Image as ImageCompressor } from 'react-native-compressor';
import { decode } from 'base64-arraybuffer';

export type MediaType = 'image' | 'video' | 'document' | 'audio';

export async function compressAndUploadMedia(
  localUri: string,
  type: MediaType,
  bucketName: 'media' | 'avatars' = 'media'
): Promise<string | null> {
  try {
    let finalUri = localUri;

    // 1. Fast On-Device Compression
    if (type === 'video') {
      console.log('Compressing video...');
      finalUri = await Video.compress(
        localUri,
        {
          compressionMethod: 'auto',
          minimumFileSizeForCompress: 5 * 1024 * 1024, // Don't compress if < 5MB
        },
        (progress) => {
          console.log('Compression Progress: ', progress);
        }
      );
    } else if (type === 'image') {
      console.log('Compressing image...');
      finalUri = await ImageCompressor.compress(localUri, {
        compressionMethod: 'auto',
        quality: 0.8,
        maxWidth: 1920,
      });
    }

    // 2. Read file as Base64 string using Expo FileSystem
    const base64Str = await FileSystem.readAsStringAsync(finalUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Decode base64 to ArrayBuffer for Supabase Storage
    const arrayBuffer = decode(base64Str);
    
    // Generate a unique filename
    const ext = type === 'video' ? 'mp4' : type === 'image' ? 'jpg' : 'bin';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `uploads/${filename}`;

    const contentType = type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : 'application/octet-stream';

    // 4. Upload to Supabase bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw error;
    }

    // 5. Retrieve Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in compressAndUploadMedia:', error);
    return null;
  }
}
