import React, { memo, useCallback, useRef } from 'react';
import { Alert, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ActivityResponse } from '@stream-io/feeds-react-native-sdk';
import { useClientConnectedUser, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import { Colors, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { timeAgo } from './timeAgo';

const LIKE = 'like';
const { width: SCREEN_W } = Dimensions.get('window');
const MEDIA_W = SCREEN_W;

interface Props {
  activity: ActivityResponse;
  onOpenComments: (activityId: string) => void;
}

export const PostCard = memo(function PostCard({ activity, onOpenComments }: Props) {
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const lastTap = useRef(0);

  const name = activity.user?.name || 'Gateway Member';
  const isMine = activity.user?.id === me?.id;
  const liked = (activity.own_reactions?.length ?? 0) > 0;
  const likeCount = activity.reaction_groups?.[LIKE]?.count ?? 0;
  const images = (activity.attachments ?? []).filter(a => a.type === 'image' && a.image_url);

  const toggleLike = useCallback(async () => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      if (liked) await client.deleteActivityReaction({ activity_id: activity.id, type: LIKE });
      else await client.addActivityReaction({ activity_id: activity.id, type: LIKE });
    } catch {
      /* state is server-driven; a failed toggle simply leaves it unchanged */
    }
  }, [activity.id, client, liked]);

  // Instagram double-tap on the media to like (never un-likes)
  const onMediaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300 && !liked) toggleLike();
    lastTap.current = now;
  }, [liked, toggleLike]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => client?.deleteActivity({ id: activity.id, hard_delete: true }).catch(() => undefined) },
    ]);
  }, [activity.id, client]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={name} image={activity.user?.image} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{timeAgo(activity.created_at)}</Text>
        </View>
        {isMine && (
          <Pressable onPress={confirmDelete} hitSlop={10} accessibilityLabel="Delete post">
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {images.length > 0 && (
        <Pressable onPress={onMediaPress}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `${activity.id}-${i}`}
            renderItem={({ item }) => <Image source={{ uri: item.image_url as string }} style={styles.media} resizeMode="cover" />}
          />
          {images.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>{images.length} photos</Text>
            </View>
          )}
        </Pressable>
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggleLike} hitSlop={8} accessibilityLabel={liked ? 'Unlike' : 'Like'} style={styles.action}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? Colors.danger : Colors.textPrimary} />
        </Pressable>
        <Pressable onPress={() => onOpenComments(activity.id)} hitSlop={8} accessibilityLabel="Comments" style={styles.action}>
          <Ionicons name="chatbubble-outline" size={23} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {likeCount > 0 && <Text style={styles.likes}>{likeCount === 1 ? '1 like' : `${likeCount} likes`}</Text>}

      {!!activity.text && (
        <Text style={styles.caption}>
          <Text style={styles.captionName}>{name} </Text>
          {activity.text}
        </Text>
      )}

      {(activity.comment_count ?? 0) > 0 ? (
        <Pressable onPress={() => onOpenComments(activity.id)}>
          <Text style={styles.viewComments}>View {activity.comment_count === 1 ? '1 comment' : `all ${activity.comment_count} comments`}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => onOpenComments(activity.id)}>
          <Text style={styles.viewComments}>Add a comment…</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bg, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  name: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  time: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted },
  media: { width: MEDIA_W, height: MEDIA_W, backgroundColor: Colors.bgSecondary },
  counter: { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: '#fff', fontFamily: Typography.fontSemiBold, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 14, paddingTop: 10 },
  action: { padding: 2 },
  likes: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary, paddingHorizontal: 14, paddingTop: 6 },
  caption: { fontFamily: Typography.fontRegular, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, paddingHorizontal: 14, paddingTop: 4 },
  captionName: { fontFamily: Typography.fontSemiBold },
  viewComments: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textMuted, paddingHorizontal: 14, paddingTop: 6 },
});
