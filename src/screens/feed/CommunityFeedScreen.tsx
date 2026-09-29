import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { Feed } from '@stream-io/feeds-react-native-sdk';
import { useStream } from '../../stream/StreamRoot';
import { Colors, Typography } from '../../theme/colors';
import { useOwnFeeds } from './OwnFeeds';
import { ActivityList } from './ActivityList';
import { Composer } from './Composer';
import { CommentsSheet } from './CommentsSheet';
import { PeopleSheet } from './PeopleSheet';

type Tab = 'feed' | 'explore';

/**
 * The Community tab, reworked as a social feed (Instagram-style posts, likes, comments, follows)
 * in place of the old testimony-form screen. Mounted inside <OwnFeedsProvider> from App.tsx.
 */
export function CommunityFeedScreen() {
  const insets = useSafeAreaInsets();
  const client = useFeedsClient();
  const { status: streamStatus } = useStream();
  const { ownTimeline } = useOwnFeeds();
  const [tab, setTab] = useState<Tab>('feed');
  const [composerOpen, setComposerOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);

  // 'popular' selector on the `foryou` group; see credentials.md Step C7 for server-side setup.
  const forYou: Feed | undefined = client ? client.feed('foryou', 'timeline') : undefined;

  if (streamStatus !== 'ready') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.centerTitle}>{streamStatus === 'connecting' ? 'Loading community…' : 'Community is unavailable right now'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.brand}>Community</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setPeopleOpen(true)} hitSlop={10} accessibilityLabel="Find people">
            <Ionicons name="person-add-outline" size={23} color={Colors.textPrimary} />
          </Pressable>
          <Pressable onPress={() => setComposerOpen(true)} hitSlop={10} accessibilityLabel="New post">
            <Ionicons name="add-circle-outline" size={26} color={Colors.gold} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'feed' && styles.tabActive]} onPress={() => setTab('feed')}>
          <Text style={[styles.tabText, tab === 'feed' && styles.tabTextActive]}>Following</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'explore' && styles.tabActive]} onPress={() => setTab('explore')}>
          <Text style={[styles.tabText, tab === 'explore' && styles.tabTextActive]}>Explore</Text>
        </Pressable>
      </View>

      {tab === 'feed' ? (
        <ActivityList
          feed={ownTimeline}
          onOpenComments={setActiveComments}
          emptyTitle="Your feed is quiet"
          emptyBody="Follow other members or share the first post from your church family."
        />
      ) : (
        <ActivityList
          feed={forYou}
          onOpenComments={setActiveComments}
          emptyTitle="Nothing trending yet"
          emptyBody="Posts appear here once the community starts liking and commenting."
        />
      )}

      <Composer visible={composerOpen} onClose={() => setComposerOpen(false)} />
      <PeopleSheet visible={peopleOpen} onClose={() => setPeopleOpen(false)} />
      <CommentsSheet activityId={activeComments} onClose={() => setActiveComments(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  centerTitle: { fontFamily: Typography.fontSemiBold, fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  brand: { fontFamily: Typography.fontBold, fontSize: 24, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 22, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.gold },
  tabText: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary },
});
