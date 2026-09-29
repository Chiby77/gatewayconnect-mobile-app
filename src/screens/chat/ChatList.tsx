import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChannelList, WithComponents } from 'stream-chat-expo';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { useStream } from '../../stream/StreamRoot';
import { Colors, Radii, Typography } from '../../theme/colors';
import { NewChatSheet } from './NewChatSheet';
import { useOpenSupport } from './useOpenSupport';

type Filter = 'all' | 'unread' | 'groups' | 'direct';
const CHIPS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'direct', label: 'Direct' },
];

const SORT: ChannelSort = { last_message_at: -1 };
const OPTIONS: ChannelOptions = { limit: 30, presence: true, state: true, watch: true };

function EmptyChats({ listType }: { listType?: string }) {
  if (listType && listType !== 'channel') return null;
  return (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No chats here yet</Text>
      <Text style={styles.emptySub}>Start a conversation with a member or create a fellowship group.</Text>
    </View>
  );
}

interface Props {
  onOpenChannel: (cid: string) => void;
}

export function ChatList({ onOpenChannel }: Props) {
  const { me, status, error, retry } = useStream();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(false);
  const { openSupport, opening } = useOpenSupport(onOpenChannel);

  // Stable, memoised filters (RULES: never build filters inline per render).
  const filters = useMemo<ChannelFilters>(() => {
    const f: ChannelFilters = { members: { $in: [me?.id ?? ''] } };
    if (filter === 'unread') f.has_unread = true;
    if (filter === 'groups') f.type = 'team';
    if (filter === 'direct') f.type = 'messaging';
    const q = query.trim();
    if (q) f.$or = [{ name: { $autocomplete: q } }, { 'member.user.name': { $autocomplete: q } }];
    return f;
  }, [filter, query, me?.id]);

  const overrides = useMemo(() => ({ EmptyStateIndicator: EmptyChats }), []);
  const onSelect = useCallback((channel: { cid: string }) => onOpenChannel(channel.cid), [onOpenChannel]);

  if (status === 'connecting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }
  if (status !== 'ready' || !me) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>{status === 'not-configured' ? 'Chat is not configured' : 'Chat unavailable'}</Text>
        <Text style={styles.emptySub}>
          {status === 'not-configured'
            ? 'This build is missing its chat settings.'
            : error ?? 'Check your connection and try again.'}
        </Text>
        {status === 'error' && (
          <Pressable style={styles.retry} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats and members"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
        {CHIPS.map(c => {
          const active = c.key === filter;
          return (
            <Pressable
              key={c.key}
              onPress={() => setFilter(c.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.support} onPress={openSupport} disabled={opening} accessibilityRole="button">
        <View style={styles.supportIcon}>
          <Ionicons name="headset" size={18} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.supportTitle}>Gateway Support</Text>
          <Text style={styles.supportSub}>Questions, prayer, giving or app help - message the church office</Text>
        </View>
        {opening ? <ActivityIndicator color={Colors.gold} /> : <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </Pressable>

      <View style={{ flex: 1 }}>
        <WithComponents overrides={overrides}>
          <ChannelList filters={filters} sort={SORT} options={OPTIONS} onSelect={onSelect} />
        </WithComponents>
      </View>

      <Pressable style={styles.fab} onPress={() => setSheet(true)} accessibilityLabel="New chat" accessibilityRole="button">
        <Ionicons name="create-outline" size={24} color="#09090b" />
      </Pressable>

      <NewChatSheet visible={sheet} onClose={() => setSheet(false)} onOpenChannel={onOpenChannel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  searchRow: { paddingHorizontal: 16, paddingTop: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15 },
  chipsScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.goldMuted, borderColor: Colors.gold },
  chipText: { fontFamily: Typography.fontSemiBold, fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.gold },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  supportSub: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  empty: { alignItems: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontFamily: Typography.fontSemiBold, fontSize: 17, color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontFamily: Typography.fontRegular, fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retry: { marginTop: 8, backgroundColor: Colors.gold, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radii.full },
  retryText: { fontFamily: Typography.fontBold, color: '#09090b' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
