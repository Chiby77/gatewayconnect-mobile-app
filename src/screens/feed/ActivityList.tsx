import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { ActivityResponse } from '@stream-io/feeds-react-native-sdk';
import { StreamFeed, useFeedActivities } from '@stream-io/feeds-react-native-sdk';
import type { Feed } from '@stream-io/feeds-react-native-sdk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../theme/colors';
import { PostCard } from './PostCard';

const keyExtractor = (item: ActivityResponse) => item.id;

function InnerList({ feed, onOpenComments, onOpenProfile, emptyTitle, emptyBody }: { feed: Feed; onOpenComments: (id: string) => void; onOpenProfile?: (userId: string) => void; emptyTitle: string; emptyBody: string }) {
  const insets = useSafeAreaInsets();
  const { activities, is_loading, has_next_page, loadNextPage } = useFeedActivities(feed) ?? {};
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await feed.getOrCreate({ watch: true });
    } finally {
      setRefreshing(false);
    }
  }, [feed]);

  const renderItem = useCallback(({ item }: { item: ActivityResponse }) => <PostCard activity={item} onOpenComments={onOpenComments} onOpenProfile={onOpenProfile} />, [onOpenComments, onOpenProfile]);

  if (is_loading && (!activities || activities.length === 0)) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  return (
    <FlatList
      data={activities ?? []}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReachedThreshold={0.4}
      onEndReached={loadNextPage}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
        </View>
      }
      ListFooterComponent={is_loading && has_next_page && (activities?.length ?? 0) > 0 ? <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.gold} /> : null}
    />
  );
}

export function ActivityList(props: { feed?: Feed; onOpenComments: (id: string) => void; onOpenProfile?: (userId: string) => void; emptyTitle: string; emptyBody: string }) {
  if (!props.feed) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }
  return (
    <StreamFeed feed={props.feed}>
      <InnerList feed={props.feed} onOpenComments={props.onOpenComments} onOpenProfile={props.onOpenProfile} emptyTitle={props.emptyTitle} emptyBody={props.emptyBody} />
    </StreamFeed>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontFamily: Typography.fontSemiBold, fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
