import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ActivityResponse, Feed } from '@stream-io/feeds-react-native-sdk';
import { StreamFeed, useFeedActivities } from '@stream-io/feeds-react-native-sdk';
import { Colors, Typography } from '../../theme/colors';
import { PostCard } from './PostCard';
import { CommentsSheet } from './CommentsSheet';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 2;
const TILE = (SCREEN_W - GAP * 2) / 3;

/** IG-style 3-column grid of a user's own posts (their `user` feed - no reposts, just what they authored). */
export function PostGrid({ feed, onOpenProfile, onCountChange }: { feed?: Feed; onOpenProfile?: (userId: string) => void; onCountChange?: (count: number) => void }) {
  if (!feed) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }
  return (
    <StreamFeed feed={feed}>
      <InnerGrid onOpenProfile={onOpenProfile} onCountChange={onCountChange} />
    </StreamFeed>
  );
}

function InnerGrid({ onOpenProfile, onCountChange }: { onOpenProfile?: (userId: string) => void; onCountChange?: (count: number) => void }) {
  const { activities, is_loading } = useFeedActivities() ?? {};
  const [openPost, setOpenPost] = useState<ActivityResponse | null>(null);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (activities) onCountChange?.(activities.length);
  }, [activities, onCountChange]);

  const renderItem = useCallback(
    ({ item }: { item: ActivityResponse }) => {
      const image = item.attachments?.find(a => a.type === 'image')?.image_url;
      return (
        <Pressable style={styles.tile} onPress={() => setOpenPost(item)}>
          {image ? (
            <Image source={{ uri: image as string }} style={styles.tileImage} resizeMode="cover" />
          ) : (
            <View style={styles.textTile}>
              <Text numberOfLines={4} style={styles.textTileText}>
                {item.text}
              </Text>
            </View>
          )}
          {(item.attachments?.filter(a => a.type === 'image').length ?? 0) > 1 && (
            <Ionicons name="copy-outline" size={14} color="#fff" style={styles.multiIcon} />
          )}
        </Pressable>
      );
    },
    [],
  );

  if (is_loading && (!activities || activities.length === 0)) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={activities ?? []}
        keyExtractor={a => a.id}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="grid-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />

      <Modal visible={!!openPost} animationType="slide" onRequestClose={() => setOpenPost(null)}>
        <View style={[styles.postModal, { paddingTop: insets.top }]}>
          <View style={styles.postModalHeader}>
            <Pressable onPress={() => setOpenPost(null)} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.postModalTitle}>Post</Text>
            <View style={{ width: 24 }} />
          </View>
          {openPost && <PostCard activity={openPost} onOpenComments={setActiveComments} onOpenProfile={onOpenProfile} />}
        </View>
      </Modal>
      <CommentsSheet activityId={activeComments} onClose={() => setActiveComments(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textMuted },
  tile: { width: TILE, height: TILE, backgroundColor: Colors.bgSecondary },
  tileImage: { width: '100%', height: '100%' },
  textTile: { flex: 1, padding: 8, justifyContent: 'center', backgroundColor: Colors.bgCard },
  textTileText: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.textSecondary },
  multiIcon: { position: 'absolute', top: 6, right: 6 },
  postModal: { flex: 1, backgroundColor: Colors.bg },
  postModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  postModalTitle: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
});
