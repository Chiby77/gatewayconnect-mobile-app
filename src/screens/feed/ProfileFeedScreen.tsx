import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFeedsClient, useFollowers, useFollowing } from '@stream-io/feeds-react-native-sdk';
import { MobileUser } from '../../auth/authService';
import { supabase } from '../../remote/supabase';
import { useStream } from '../../stream/StreamRoot';
import { SUPPORT_USER_ID } from '../../stream/config';
import { Colors, Radii, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';
import { PostGrid } from './PostGrid';
import { EditProfileSheet } from './EditProfileSheet';

interface OtherProfile {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  badge_type?: string;
}

interface Props {
  userId?: string; // omit to show the signed-in member's own profile
  profile: MobileUser | null; // own MobileUser, from App.tsx - richest source for "me"
  onBack?: () => void;
  onOpenChat?: (cid: string) => void;
  onOpenProfile?: (userId: string) => void;
  onProfileUpdated?: (updated: MobileUser) => void;
  onOpenSettings?: () => void; // own profile only - account settings, sign out, badges, downloads
}

export function ProfileFeedScreen({ userId, profile, onBack, onOpenChat, onOpenProfile, onProfileUpdated, onOpenSettings }: Props) {
  const insets = useSafeAreaInsets();
  const client = useFeedsClient();
  const { chatClient, me } = useStream();
  const isOwn = !userId || userId === profile?.id;
  const targetId = userId ?? profile?.id ?? '';

  const [other, setOther] = useState<OtherProfile | null>(null);
  const [loadingOther, setLoadingOther] = useState(!isOwn);
  const [editOpen, setEditOpen] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const [postCount, setPostCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOwn || !targetId) return;
    let cancelled = false;
    setLoadingOther(true);
    supabase
      .from('users')
      .select('id, full_name, handle, bio, website, avatar_url, badge_type')
      .eq('id', targetId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setOther(data ? { id: data.id, name: data.full_name || 'Gateway Member', handle: data.handle, bio: data.bio, website: data.website, avatar_url: data.avatar_url, badge_type: data.badge_type } : null);
        setLoadingOther(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwn, targetId]);

  const userFeed = useMemo(() => (client && targetId ? client.feed('user', targetId) : undefined), [client, targetId]);
  const timelineFeed = useMemo(() => (client && targetId ? client.feed('timeline', targetId) : undefined), [client, targetId]);

  useEffect(() => {
    userFeed?.getOrCreate({ watch: true }).catch(() => undefined);
    timelineFeed?.getOrCreate({ watch: true }).catch(() => undefined);
  }, [userFeed, timelineFeed]);

  const { follower_count } = useFollowers(userFeed) ?? {};
  const { following_count } = useFollowing(timelineFeed) ?? {};

  const displayName = isOwn ? profile?.name : other?.name;
  const handle = isOwn ? profile?.handle : other?.handle;
  const bio = isOwn ? profile?.bio : other?.bio;
  const website = isOwn ? profile?.website : other?.website;
  const avatarUrl = isOwn ? (me?.image ?? profile?.avatar_url) : other?.avatar_url;

  const messageUser = async () => {
    if (!chatClient || !me || dmBusy || !targetId) return;
    setDmBusy(true);
    try {
      const channel = chatClient.channel('messaging', { members: [me.id, targetId] });
      await channel.watch();
      if (channel.cid) onOpenChat?.(channel.cid);
    } finally {
      setDmBusy(false);
    }
  };

  if (!isOwn && loadingOther) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }
  if (!isOwn && !other) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Member not found</Text>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backChip}>
            <Text style={styles.backChipText}>Go back</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {handle || displayName}
        </Text>
        {isOwn && onOpenSettings ? (
          <Pressable onPress={onOpenSettings} hitSlop={10} accessibilityLabel="Settings">
            <Ionicons name="menu-outline" size={24} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.top}>
          <Avatar name={displayName} image={avatarUrl} size={84} />
          <View style={styles.statsRow}>
            <Stat label="Posts" value={postCount} />
            <Stat label="Followers" value={follower_count} />
            <Stat label="Following" value={following_count} />
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.name}>{displayName}</Text>
          {!!handle && <Text style={styles.handle}>{handle}</Text>}
          {!!bio && <Text style={styles.bio}>{bio}</Text>}
          {!!website && <Text style={styles.website}>{website}</Text>}
        </View>

        {isOwn ? (
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => setEditOpen(true)}>
              <Text style={styles.secondaryBtnText}>Edit profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <FollowButton userId={targetId} />
            </View>
            {targetId !== SUPPORT_USER_ID && (
              <Pressable style={styles.secondaryBtn} onPress={messageUser} disabled={dmBusy}>
                {dmBusy ? <ActivityIndicator color={Colors.textPrimary} /> : <Text style={styles.secondaryBtnText}>Message</Text>}
              </Pressable>
            )}
          </View>
        )}

        {isOwn && <SuggestedForYou excludeUserId={targetId} />}

        <View style={styles.gridDivider} />
        <PostGrid feed={userFeed} onOpenProfile={onOpenProfile} onCountChange={setPostCount} />
      </ScrollView>

      {isOwn && profile && (
        <EditProfileSheet
          visible={editOpen}
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={onProfileUpdated ?? (() => undefined)}
        />
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  // "Posts" has no dedicated count field on the feed - PostGrid reports it once its activities load,
  // so this shows nothing rather than a wrong number until then.
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** IG-style "Suggested for you" - a few members not already followed, own profile only. */
function SuggestedForYou({ excludeUserId }: { excludeUserId: string }) {
  const { chatClient } = useStream();
  const [users, setUsers] = useState<{ id: string; name?: string; image?: string }[]>([]);

  useEffect(() => {
    if (!chatClient) return;
    let cancelled = false;
    chatClient
      .queryUsers({}, { last_active: -1 }, { limit: 10 })
      .then(res => {
        if (cancelled) return;
        setUsers(res.users.filter(u => u.id !== excludeUserId && u.id !== SUPPORT_USER_ID).slice(0, 8));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [chatClient, excludeUserId]);

  if (users.length === 0) return null;

  return (
    <View style={styles.suggested}>
      <Text style={styles.suggestedTitle}>Suggested for you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
        {users.map(u => (
          <View key={u.id} style={styles.suggestedCard}>
            <Avatar name={u.name} image={u.image} size={56} />
            <Text style={styles.suggestedName} numberOfLines={1}>
              {u.name || 'Member'}
            </Text>
            <FollowButton userId={u.id} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontFamily: Typography.fontSemiBold, fontSize: 16, color: Colors.textPrimary },
  backChip: { backgroundColor: Colors.bgSecondary, borderRadius: Radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  backChipText: { color: Colors.textPrimary, fontFamily: Typography.fontSemiBold },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 24 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: Typography.fontBold, fontSize: 18, color: Colors.textPrimary },
  statLabel: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  infoBlock: { paddingHorizontal: 16, paddingTop: 14, gap: 2 },
  name: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
  handle: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textMuted },
  bio: { fontFamily: Typography.fontRegular, fontSize: 14, color: Colors.textPrimary, marginTop: 4, lineHeight: 19 },
  website: { fontFamily: Typography.fontSemiBold, fontSize: 13, color: Colors.primary, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  secondaryBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.borderStrong },
  secondaryBtnText: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  suggested: { marginTop: 20 },
  suggestedTitle: { fontFamily: Typography.fontBold, fontSize: 14, color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 10 },
  suggestedCard: { width: 92, alignItems: 'center', gap: 6 },
  suggestedName: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: Colors.textPrimary },
  gridDivider: { height: 1, backgroundColor: Colors.border, marginTop: 20, marginBottom: 2 },
});
