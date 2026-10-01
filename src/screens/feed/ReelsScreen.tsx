import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ActivityResponse, Feed } from '@stream-io/feeds-react-native-sdk';
import { StreamFeed, useFeedActivities } from '@stream-io/feeds-react-native-sdk';
import { Colors, Typography } from '../../theme/colors';
import { ReelItem } from './ReelItem';
import { CommentsSheet } from './CommentsSheet';

const hasVideo = (a: ActivityResponse) => a.attachments?.some(x => x.type === 'video') ?? false;

export function ReelsScreen({ feed, height, onOpenProfile }: { feed?: Feed; height: number; onOpenProfile?: (userId: string) => void }) {
  if (!feed) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }
  return (
    <StreamFeed feed={feed}>
      <InnerReels height={height} onOpenProfile={onOpenProfile} />
    </StreamFeed>
  );
}

function InnerReels({ height, onOpenProfile }: { height: number; onOpenProfile?: (userId: string) => void }) {
  // Reels rides on whichever feed is passed in (Explore's `foryou` group today - see
  // CommunityFeedScreen) and just filters to posts that carry a video attachment.
  const { activities, is_loading, has_next_page, loadNextPage } = useFeedActivities() ?? {};
  const reels = (activities ?? []).filter(hasVideo);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find(v => v.isViewable);
    if (first && typeof first.index === 'number') setActiveIndex(first.index);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  if (is_loading && reels.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="videocam-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No reels yet</Text>
        <Text style={styles.emptyBody}>Short videos shared by the community will play here.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={reels}
        keyExtractor={a => a.id}
        renderItem={({ item, index }) => (
          <ReelItem
            activity={item}
            height={height}
            isActive={index === activeIndex}
            muted={muted}
            onToggleMute={() => setMuted(m => !m)}
            onOpenComments={setActiveComments}
            onOpenProfile={onOpenProfile}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReachedThreshold={0.6}
        onEndReached={() => has_next_page && loadNextPage?.()}
        style={styles.list}
      />
      <CommentsSheet activityId={activeComments} onClose={() => setActiveComments(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000', padding: 32 },
  emptyTitle: { fontFamily: Typography.fontSemiBold, fontSize: 16, color: '#fff', textAlign: 'center' },
  emptyBody: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
