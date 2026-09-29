import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivityComments, useFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { ActivityWithStateUpdates, CommentResponse } from '@stream-io/feeds-react-native-sdk';
import { Colors, Radii, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { timeAgo } from './timeAgo';

/**
 * Comments for one activity, live-updating. Receives only an `activityId` (never the activity object) and
 * owns a single `activityWithStateUpdates` handle, disposed on close (RULES: Feeds navigation).
 */
export function CommentsSheet({ activityId, onClose }: { activityId: string | null; onClose: () => void }) {
  const client = useFeedsClient();
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = useState<ActivityWithStateUpdates>();
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    if (!client || !activityId) return;
    const handle = client.activityWithStateUpdates(activityId);
    // The `comments` request is REQUIRED or useActivityComments renders empty.
    handle.get({ comments: { limit: 25, sort: 'last', depth: 1 } }).then(() => setActivity(handle));
    return () => {
      handle.dispose();
      setActivity(undefined);
    };
  }, [client, activityId]);

  // OS keyboard events (KeyboardAvoidingView is unreliable inside Modal on Android edge-to-edge).
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', e => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottom = keyboard > 0 ? keyboard + (Platform.OS === 'android' ? insets.bottom : 0) : insets.bottom;

  return (
    <Modal visible={!!activityId} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: bottom, height: '78%' }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          {activity ? (
            <>
              <CommentList activity={activity} />
              <CommentInput activity={activity} />
            </>
          ) : (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function CommentList({ activity }: { activity: ActivityWithStateUpdates }) {
  const { comments = [], loadNextPage, has_next_page, is_loading_next_page } = useActivityComments({ activity });
  const onEnd = useCallback(() => {
    if (!loadNextPage || !has_next_page || is_loading_next_page) return;
    loadNextPage({ limit: 15, sort: 'last' });
  }, [has_next_page, is_loading_next_page, loadNextPage]);

  return (
    <FlatList
      style={{ flex: 1 }}
      data={comments}
      keyExtractor={(c: CommentResponse) => c.id}
      onEndReached={onEnd}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Text style={styles.empty}>No comments yet. Be the first to encourage.</Text>}
      renderItem={({ item }: { item: CommentResponse }) => (
        <View style={styles.row}>
          <Avatar name={item.user?.name} image={item.user?.image} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              <Text style={styles.author}>{item.user?.name || 'Member'} </Text>
              {item.text}
            </Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
      )}
    />
  );
}

function CommentInput({ activity }: { activity: ActivityWithStateUpdates }) {
  const client = useFeedsClient();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const can = draft.trim().length > 0 && !sending;

  const submit = useCallback(async () => {
    if (!client || !can) return;
    setSending(true);
    try {
      await client.addComment({ object_id: activity.id, object_type: 'activity', comment: draft.trim() });
      setDraft('');
    } finally {
      setSending(false);
    }
  }, [activity.id, can, client, draft]);

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Add a comment…"
        placeholderTextColor={Colors.textMuted}
        onSubmitEditing={submit}
        returnKeyType="send"
        maxLength={1000}
      />
      <Pressable onPress={submit} disabled={!can} style={[styles.send, !can && { opacity: 0.4 }]} accessibilityLabel="Send comment">
        {sending ? <ActivityIndicator color="#09090b" /> : <Ionicons name="arrow-up" size={20} color="#09090b" />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  author: { fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  text: { fontFamily: Typography.fontRegular, fontSize: 14, lineHeight: 20, color: Colors.textPrimary },
  time: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: Colors.textMuted, fontFamily: Typography.fontRegular, padding: 40 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
});
