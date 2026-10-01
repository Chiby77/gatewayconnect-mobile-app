import React, { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { ActivityResponse } from '@stream-io/feeds-react-native-sdk';
import { useClientConnectedUser, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import { Colors, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';

const LIKE = 'like';

interface Props {
  activity: ActivityResponse;
  height: number; // measured available height (window height minus the app's bottom tab bar)
  isActive: boolean; // only the reel currently on-screen plays
  muted: boolean;
  onToggleMute: () => void;
  onOpenComments: (activityId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

export const ReelItem = memo(function ReelItem({ activity, height, isActive, muted, onToggleMute, onOpenComments, onOpenProfile }: Props) {
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState((activity.own_reactions ?? []).some(r => r.type === LIKE));
  const [likeCount, setLikeCount] = useState(activity.reaction_groups?.[LIKE]?.count ?? 0);

  const video = activity.attachments?.find(a => a.type === 'video');
  const player = useVideoPlayer(video?.asset_url ?? '', p => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const toggleLike = async () => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    try {
      if (next) await client.addActivityReaction({ activity_id: activity.id, type: LIKE });
      else await client.deleteActivityReaction({ activity_id: activity.id, type: LIKE });
    } catch {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    }
  };

  return (
    <View style={[styles.reel, { height }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onToggleMute}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      </Pressable>

      {muted && (
        <View style={styles.muteBadge}>
          <Ionicons name="volume-mute" size={16} color="#fff" />
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
        <Pressable style={styles.author} onPress={() => activity.user?.id && onOpenProfile?.(activity.user.id)}>
          <Avatar name={activity.user?.name} image={activity.user?.image} size={34} />
          <Text style={styles.authorName} numberOfLines={1}>
            {activity.user?.name || 'Gateway Member'}
          </Text>
        </Pressable>
        {!!activity.text && (
          <Text style={styles.caption} numberOfLines={3}>
            {activity.text}
          </Text>
        )}
      </View>

      <View style={[styles.actions, { bottom: insets.bottom + 100 }]} pointerEvents="box-none">
        <Pressable onPress={toggleLike} style={styles.actionBtn} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={30} color={liked ? Colors.danger : '#fff'} />
          <Text style={styles.actionCount}>{likeCount > 0 ? likeCount : ''}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments(activity.id)} style={styles.actionBtn} accessibilityLabel="Comments">
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionCount}>{(activity.comment_count ?? 0) > 0 ? activity.comment_count : ''}</Text>
        </Pressable>
        <Pressable onPress={onToggleMute} style={styles.actionBtn} accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={26} color="#fff" />
        </Pressable>
        {me?.id === activity.user?.id && (
          <Pressable
            onPress={() => client?.deleteActivity({ id: activity.id, hard_delete: true }).catch(() => undefined)}
            style={styles.actionBtn}
            accessibilityLabel="Delete reel"
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  reel: { width: '100%', backgroundColor: '#000' },
  muteBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 8,
  },
  bottomBar: { position: 'absolute', left: 0, right: 84, bottom: 0, paddingHorizontal: 14, gap: 8 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { color: '#fff', fontFamily: Typography.fontSemiBold, fontSize: 14 },
  caption: { color: '#fff', fontFamily: Typography.fontRegular, fontSize: 13, lineHeight: 18 },
  actions: { position: 'absolute', right: 12, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionCount: { color: '#fff', fontFamily: Typography.fontSemiBold, fontSize: 12 },
});
