import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { UserAvatar } from 'stream-chat-expo';
import type { UserResponse } from 'stream-chat';
import { useStream } from '../../stream/StreamRoot';
import { SUPPORT_USER_ID } from '../../stream/config';
import { Colors, Radii, Typography } from '../../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenChannel: (cid: string) => void;
}

export function NewChatSheet({ visible, onClose, onOpenChannel }: Props) {
  const { chatClient, me } = useStream();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, UserResponse>>({});
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced member search (Stream users are created when a member first signs in on this build).
  useEffect(() => {
    if (!visible || !chatClient || !me) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const q = query.trim();
        const res = await chatClient.queryUsers(
          { ...(q ? { name: { $autocomplete: q } } : {}) },
          { name: 1 },
          { limit: 40 },
        );
        if (!cancelled) setUsers(res.users.filter(u => u.id !== SUPPORT_USER_ID && u.id !== me.id));
      } catch {
        if (!cancelled) setError('Could not load members.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, query, chatClient, me]);

  const reset = useCallback(() => {
    setMode('direct');
    setQuery('');
    setSelected({});
    setGroupName('');
    setError(null);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const startDirect = useCallback(
    async (user: UserResponse) => {
      if (!chatClient || !me || busy) return;
      setBusy(true);
      try {
        const channel = chatClient.channel('messaging', { members: [me.id, user.id] });
        await channel.watch();
        reset();
        onClose();
        if (channel.cid) onOpenChannel(channel.cid);
      } catch {
        setError('Could not start the chat. Try again.');
      } finally {
        setBusy(false);
      }
    },
    [busy, chatClient, me, onClose, onOpenChannel, reset],
  );

  const createGroup = useCallback(async () => {
    const members = Object.keys(selected);
    if (!chatClient || !me || busy || !groupName.trim() || members.length === 0) return;
    setBusy(true);
    try {
      // 'team' channel type = group chats (kept separate from 1:1 'messaging' so the Groups filter is exact)
      const channel = chatClient.channel('team', Crypto.randomUUID(), {
        name: groupName.trim(),
        members: [me.id, ...members],
        is_group: true,
      } as Record<string, unknown>);
      await channel.watch();
      reset();
      onClose();
      if (channel.cid) onOpenChannel(channel.cid);
    } catch {
      setError('Could not create the group. Check that group chats are enabled for members.');
    } finally {
      setBusy(false);
    }
  }, [busy, chatClient, groupName, me, onClose, onOpenChannel, reset, selected]);

  const toggle = (u: UserResponse) =>
    setSelected(prev => {
      const next = { ...prev };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u;
      return next;
    });

  const canCreate = groupName.trim().length > 0 && Object.keys(selected).length > 0 && !busy;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'direct' ? 'New chat' : 'New group'}</Text>
            <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.segment}>
            {(['direct', 'group'] as const).map(m => (
              <Pressable key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} onPress={() => setMode(m)}>
                <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'direct' ? 'Message' : 'Group'}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'group' && (
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
              placeholderTextColor={Colors.textMuted}
              maxLength={60}
            />
          )}

          <View style={styles.search}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search members"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading && users.length === 0 ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={u => u.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 360 }}
              ListEmptyComponent={<Text style={styles.empty}>No members found. Members appear here once they have opened the updated app.</Text>}
              renderItem={({ item }) => {
                const isSel = !!selected[item.id];
                return (
                  <Pressable
                    style={styles.row}
                    onPress={() => (mode === 'direct' ? startDirect(item) : toggle(item))}
                    accessibilityRole="button"
                  >
                    <UserAvatar user={item} size="lg" showOnlineIndicator={false} />
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name || item.id}
                    </Text>
                    {mode === 'group' && (
                      <Ionicons
                        name={isSel ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSel ? Colors.gold : Colors.textMuted}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          )}

          {mode === 'group' && (
            <Pressable style={[styles.cta, !canCreate && styles.ctaDisabled]} disabled={!canCreate} onPress={createGroup}>
              {busy ? (
                <ActivityIndicator color="#09090b" />
              ) : (
                <Text style={styles.ctaText}>Create group{Object.keys(selected).length ? ` (${Object.keys(selected).length})` : ''}</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: Typography.fontBold, fontSize: 20, color: Colors.textPrimary },
  segment: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: Radii.full, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: Radii.full, alignItems: 'center' },
  segBtnActive: { backgroundColor: Colors.gold },
  segText: { fontFamily: Typography.fontSemiBold, color: Colors.textSecondary, fontSize: 14 },
  segTextActive: { color: '#09090b' },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 15,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  name: { flex: 1, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary, fontSize: 16 },
  empty: { color: Colors.textMuted, fontFamily: Typography.fontRegular, textAlign: 'center', paddingVertical: 24 },
  error: { color: Colors.danger, fontFamily: Typography.fontRegular, fontSize: 13 },
  cta: { backgroundColor: Colors.gold, borderRadius: Radii.full, paddingVertical: 14, alignItems: 'center' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: Typography.fontBold, color: '#09090b', fontSize: 15 },
});
