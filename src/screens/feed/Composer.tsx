import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useClientConnectedUser, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { Attachment } from '@stream-io/feeds-react-native-sdk';
import { Colors, Radii, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { useOwnFeeds } from './OwnFeeds';

const MAX_PHOTOS = 4;
const MAX_VIDEO_SECONDS = 90; // Reels-length cap, keeps uploads reasonable on mobile data

/**
 * Full-screen "New post" (Instagram-style): caption + up to 4 photos, OR a single short video (which
 * then also appears in the Reels tab - see CommunityFeedScreen/ReelsScreen). Photos and video are
 * mutually exclusive, matching how IG itself treats a single post.
 */
export function Composer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const { ownFeed } = useOwnFeeds();
  const [text, setText] = useState('');
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [posting, setPosting] = useState(false);

  const canPost = (text.trim().length > 0 || assets.length > 0 || !!video) && !posting && !!ownFeed;

  const pickPhotos = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo access in Settings to attach pictures.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - assets.length,
      quality: 0.7, // compressed at pick time: members on mobile data
    });
    if (!res.canceled) {
      setVideo(null);
      setAssets(prev => [...prev, ...res.assets].slice(0, MAX_PHOTOS));
    }
  }, [assets.length]);

  const pickVideo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Video', 'Allow photo/video access in Settings to attach a video.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_VIDEO_SECONDS,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (!res.canceled && res.assets[0]) {
      setAssets([]);
      setVideo(res.assets[0]);
    }
  }, []);

  const post = useCallback(async () => {
    if (!client || !ownFeed || !canPost) return;
    Keyboard.dismiss();
    setPosting(true);
    try {
      const attachments: Attachment[] = [];
      if (video) {
        const up = await client.uploadFile({
          file: { uri: video.uri, name: video.fileName ?? 'video.mp4', type: video.mimeType ?? 'video/mp4' },
        });
        attachments.push({
          type: 'video',
          asset_url: up.file,
          custom: { width: video.width, height: video.height, duration_ms: video.duration ?? undefined },
        });
      }
      for (const a of assets) {
        const up = await client.uploadImage({
          file: { uri: a.uri, name: a.fileName ?? 'photo.jpg', type: a.mimeType ?? 'image/jpeg' },
        });
        attachments.push({ type: 'image', image_url: up.file, custom: {} });
      }
      await ownFeed.addActivity({ type: 'post', text: text.trim(), ...(attachments.length ? { attachments } : {}) });
      setText('');
      setAssets([]);
      setVideo(null);
      onClose();
    } catch {
      Alert.alert('Could not post', 'Please check your connection and try again.');
    } finally {
      setPosting(false);
    }
  }, [assets, canPost, client, onClose, ownFeed, text, video]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>New post</Text>
          <Pressable onPress={post} disabled={!canPost} style={[styles.postBtn, !canPost && { opacity: 0.4 }]}>
            {posting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.postText}>Share</Text>}
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
          <View style={styles.authorRow}>
            <Avatar name={me?.name} image={me?.image} size={40} />
            <Text style={styles.author}>{me?.name}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={video ? 'Say something about this video…' : 'Share a testimony, scripture or encouragement…'}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            textAlignVertical="top"
            autoFocus
          />
          {video && (
            <View style={styles.videoPreview}>
              <Image source={{ uri: video.uri }} style={styles.videoThumb} />
              <View style={styles.videoPlayBadge}>
                <Ionicons name="play" size={22} color="#fff" />
              </View>
              <Text style={styles.videoLabel}>Reel</Text>
              <Pressable style={styles.remove} onPress={() => setVideo(null)} hitSlop={8}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
          {assets.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {assets.map((a, i) => (
                <View key={a.uri}>
                  <Image source={{ uri: a.uri }} style={styles.thumb} />
                  <Pressable style={styles.remove} onPress={() => setAssets(prev => prev.filter((_, j) => j !== i))} hitSlop={8}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </ScrollView>

        <View style={styles.toolbar}>
          <Pressable style={styles.tool} onPress={pickPhotos} disabled={assets.length >= MAX_PHOTOS || !!video}>
            <Ionicons name="image-outline" size={22} color={Colors.gold} />
            <Text style={styles.toolText}>Photos {assets.length > 0 ? `(${assets.length}/${MAX_PHOTOS})` : ''}</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={pickVideo} disabled={assets.length > 0}>
            <Ionicons name="videocam-outline" size={22} color={Colors.primary} />
            <Text style={[styles.toolText, { color: Colors.primary }]}>Reel video</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.fontBold, fontSize: 17, color: Colors.textPrimary },
  postBtn: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingHorizontal: 18, paddingVertical: 8, minWidth: 74, alignItems: 'center' },
  postText: { fontFamily: Typography.fontBold, color: '#ffffff', fontSize: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  author: { fontFamily: Typography.fontSemiBold, fontSize: 15, color: Colors.textPrimary },
  input: { minHeight: 120, fontFamily: Typography.fontRegular, fontSize: 17, lineHeight: 24, color: Colors.textPrimary },
  thumb: { width: 110, height: 110, borderRadius: 12, backgroundColor: Colors.bgSecondary },
  videoPreview: { width: 160, height: 220, borderRadius: 14, backgroundColor: Colors.bgSecondary, overflow: 'hidden' },
  videoThumb: { width: '100%', height: '100%' },
  videoPlayBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    color: '#fff',
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  remove: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10 },
  toolText: { fontFamily: Typography.fontSemiBold, color: Colors.gold, fontSize: 14 },
});
