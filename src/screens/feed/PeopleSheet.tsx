import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { UserResponse } from 'stream-chat';
import { useStream } from '../../stream/StreamRoot';
import { SUPPORT_USER_ID } from '../../stream/config';
import { Colors, Radii, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';

/** Discover members to follow. Follows drive whose posts appear on your community feed. */
export function PeopleSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { chatClient, me } = useStream();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !chatClient || !me) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const term = q.trim();
        const res = await chatClient.queryUsers({ ...(term ? { name: { $autocomplete: term } } : {}) }, { last_active: -1 }, { limit: 40 });
        if (!cancelled) setUsers(res.users.filter(u => u.id !== me.id && u.id !== SUPPORT_USER_ID));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, q, chatClient, me]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Find people</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search members" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
        </View>
        {loading && users.length === 0 ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={u => u.id}
            ListEmptyComponent={<Text style={styles.empty}>No members found yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar name={item.name} image={item.image} size={44} />
                <Text style={styles.name} numberOfLines={1}>
                  {item.name || 'Member'}
                </Text>
                <FollowButton userId={item.id} />
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: Typography.fontBold, fontSize: 17, color: Colors.textPrimary },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bgSecondary, borderRadius: Radii.full, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  name: { flex: 1, fontFamily: Typography.fontSemiBold, fontSize: 15, color: Colors.textPrimary },
  empty: { textAlign: 'center', color: Colors.textMuted, fontFamily: Typography.fontRegular, padding: 40 },
});
