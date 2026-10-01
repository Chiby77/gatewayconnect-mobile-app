import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useFeedsClient, useOwnFollows } from '@stream-io/feeds-react-native-sdk';
import { Colors, Radii, Typography } from '../../theme/colors';
import { useOwnFeeds } from './OwnFeeds';

/** Follow / Following for another member's `user:<id>` feed. */
export function FollowButton({ userId }: { userId: string }) {
  const client = useFeedsClient();
  const { ownTimeline } = useOwnFeeds();
  const [busy, setBusy] = useState(false);
  const feed = useMemo(() => (client ? client.feed('user', userId) : undefined), [client, userId]);
  const { own_follows: ownFollows } = useOwnFollows(feed) ?? {};
  const following = ownFollows?.some(f => f.source_feed.group_id === 'timeline' && f.status === 'accepted') ?? false;

  const toggle = useCallback(async () => {
    if (!feed || !ownTimeline || busy) return;
    setBusy(true);
    try {
      if (following) await ownTimeline.unfollow(feed.feed);
      else {
        await feed.getOrCreate({ watch: false });
        await ownTimeline.follow(feed.feed);
      }
      await ownTimeline.getOrCreate({ watch: true }); // pull in / drop that person's posts
    } finally {
      setBusy(false);
    }
  }, [busy, feed, following, ownTimeline]);

  return (
    <Pressable onPress={toggle} disabled={busy} style={[styles.btn, following ? styles.following : styles.follow, busy && { opacity: 0.6 }]}>
      <Text style={[styles.label, following ? styles.followingLabel : styles.followLabel]}>{following ? 'Following' : 'Follow'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minWidth: 92, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 14, borderRadius: Radii.full },
  follow: { backgroundColor: Colors.primary },
  following: { borderWidth: 1, borderColor: Colors.borderStrong },
  label: { fontFamily: Typography.fontSemiBold, fontSize: 13 },
  followLabel: { color: '#ffffff' },
  followingLabel: { color: Colors.textSecondary },
});
