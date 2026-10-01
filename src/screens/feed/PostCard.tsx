import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ActivityResponse } from '@stream-io/feeds-react-native-sdk';
import { useClientConnectedUser, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import { Colors, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { timeAgo } from './timeAgo';
import { useOwnFeeds } from './OwnFeeds';

const LIKE = 'like';
const REPOST = 'repost';
const { width: SCREEN_W } = Dimensions.get('window');
const MEDIA_W = SCREEN_W;

interface Props {
  activity: ActivityResponse;
  onOpenComments: (activityId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

/** Big center heart that bounces in and fades out on double-tap - the same motion as the reference site. */
function HeartBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0.3;
    opacity.value = 1;
    scale.value = withSequence(
      withTiming(1.15, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 90 }),
    );
    opacity.value = withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.heartBurstWrap, style]}>
      <Ionicons name="heart" size={96} color="#ffffff" style={styles.heartBurstIcon} />
    </Animated.View>
  );
}

export const PostCard = memo(function PostCard({ activity, onOpenComments, onOpenProfile }: Props) {
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const { ownFeed } = useOwnFeeds();
  const lastTap = useRef(0);
  const [burstTick, setBurstTick] = useState(0);
  const [repostBusy, setRepostBusy] = useState(false);

  // A pure repost has no content of its own - every interaction (like, comment, re-repost) targets the
  // original post embedded as `parent`. Only the small "Reposted by" strip belongs to the wrapper.
  const isRepost = activity.type === REPOST && !!activity.parent;
  const reposter = isRepost ? activity.user : null;
  const target = isRepost ? (activity.parent as ActivityResponse) : activity;

  const name = target.user?.name || 'Gateway Member';
  const isMine = target.user?.id === me?.id;
  const liked = (target.own_reactions ?? []).some(r => r.type === LIKE);
  const reposted = (target.own_reactions ?? []).some(r => r.type === REPOST);
  const likeCount = target.reaction_groups?.[LIKE]?.count ?? 0;
  const repostCount = target.share_count ?? 0;
  const images = (target.attachments ?? []).filter(a => a.type === 'image' && a.image_url);

  const toggleLike = useCallback(async () => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      if (liked) await client.deleteActivityReaction({ activity_id: target.id, type: LIKE });
      else await client.addActivityReaction({ activity_id: target.id, type: LIKE });
    } catch {
      /* state is server-driven; a failed toggle simply leaves it unchanged */
    }
  }, [client, liked, target.id]);

  // Instagram double-tap on the media to like (never un-likes) + the heart-burst overlay.
  const onMediaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setBurstTick(t => t + 1);
      if (!liked) toggleLike();
    }
    lastTap.current = now;
  }, [liked, toggleLike]);

  const toggleRepost = useCallback(async () => {
    if (!client || !ownFeed || repostBusy || isMine) return; // reposting your own post isn't meaningful
    setRepostBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      if (reposted) {
        // Find + remove the repost activity this created in the reposter's own feed, then the reaction.
        const shares = await client.queryActivityShares({ activity_id: target.id, limit: 25 });
        const mine = shares.shares.find(s => s.user.id === me?.id);
        if (mine) await client.deleteActivity({ id: mine.activity_id, hard_delete: true }).catch(() => undefined);
        await client.deleteActivityReaction({ activity_id: target.id, type: REPOST });
      } else {
        // target_feeds makes Stream create the repost as a real activity (type mirrors the reaction
        // type) in the reposter's own feed, with `parent` pointing back at the original - no manual copy.
        await client.addActivityReaction({ activity_id: target.id, type: REPOST, target_feeds: [ownFeed.feed] });
      }
    } catch {
      Alert.alert('Could not repost', 'Please try again.');
    } finally {
      setRepostBusy(false);
    }
  }, [client, isMine, me?.id, ownFeed, reposted, target.id]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => client?.deleteActivity({ id: target.id, hard_delete: true }).catch(() => undefined) },
    ]);
  }, [client, target.id]);

  return (
    <View style={styles.card}>
      {isRepost && (
        <Pressable style={styles.repostStrip} onPress={() => reposter?.id && onOpenProfile?.(reposter.id)}>
          <Ionicons name="repeat" size={14} color={Colors.textMuted} />
          <Text style={styles.repostStripText} numberOfLines={1}>
            {reposter?.id === me?.id ? 'You reposted' : `${reposter?.name || 'Someone'} reposted`}
          </Text>
        </Pressable>
      )}

      <Pressable style={styles.header} onPress={() => target.user?.id && onOpenProfile?.(target.user.id)}>
        <Avatar name={name} image={target.user?.image} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{timeAgo(target.created_at)}</Text>
        </View>
        {isMine && !isRepost && (
          <Pressable onPress={confirmDelete} hitSlop={10} accessibilityLabel="Delete post">
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </Pressable>
        )}
      </Pressable>

      {images.length > 0 && (
        <Pressable onPress={onMediaPress}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `${target.id}-${i}`}
            renderItem={({ item }) => <Image source={{ uri: item.image_url as string }} style={styles.media} resizeMode="cover" />}
          />
          {images.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>{images.length} photos</Text>
            </View>
          )}
          <HeartBurst trigger={burstTick} />
        </Pressable>
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggleLike} hitSlop={8} accessibilityLabel={liked ? 'Unlike' : 'Like'} style={styles.action}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? Colors.danger : Colors.textPrimary} />
        </Pressable>
        <Pressable onPress={() => onOpenComments(target.id)} hitSlop={8} accessibilityLabel="Comments" style={styles.action}>
          <Ionicons name="chatbubble-outline" size={23} color={Colors.textPrimary} />
        </Pressable>
        {!isMine && (
          <Pressable onPress={toggleRepost} disabled={repostBusy} hitSlop={8} accessibilityLabel={reposted ? 'Undo repost' : 'Repost'} style={styles.action}>
            <Ionicons name="repeat" size={24} color={reposted ? Colors.primary : Colors.textPrimary} />
          </Pressable>
        )}
      </View>

      {(likeCount > 0 || repostCount > 0) && (
        <View style={styles.countsRow}>
          {likeCount > 0 && <Text style={styles.likes}>{likeCount === 1 ? '1 like' : `${likeCount} likes`}</Text>}
          {repostCount > 0 && <Text style={styles.reposts}>{repostCount === 1 ? '1 repost' : `${repostCount} reposts`}</Text>}
        </View>
      )}

      {!!target.text && (
        <Text style={styles.caption}>
          <Text style={styles.captionName}>{name} </Text>
          {target.text}
        </Text>
      )}

      {(target.comment_count ?? 0) > 0 ? (
        <Pressable onPress={() => onOpenComments(target.id)}>
          <Text style={styles.viewComments}>View {target.comment_count === 1 ? '1 comment' : `all ${target.comment_count} comments`}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => onOpenComments(target.id)}>
          <Text style={styles.viewComments}>Add a comment…</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bg, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  repostStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10 },
  repostStripText: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: Colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  name: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  time: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted },
  media: { width: MEDIA_W, height: MEDIA_W, backgroundColor: Colors.bgSecondary },
  heartBurstWrap: { alignItems: 'center', justifyContent: 'center' },
  heartBurstIcon: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } },
  counter: { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: '#fff', fontFamily: Typography.fontSemiBold, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 14, paddingTop: 10 },
  action: { padding: 2 },
  countsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingTop: 6 },
  likes: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  reposts: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.primary },
  caption: { fontFamily: Typography.fontRegular, fontSize: 14, lineHeight: 20, color: Colors.textPrimary, paddingHorizontal: 14, paddingTop: 4 },
  captionName: { fontFamily: Typography.fontSemiBold },
  viewComments: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textMuted, paddingHorizontal: 14, paddingTop: 6 },
});
