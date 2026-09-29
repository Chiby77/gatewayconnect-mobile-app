import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Channel,
  ChannelAvatar,
  MessageComposer,
  MessageList,
  messageActions as defaultMessageActions,
  useChannelPreviewDisplayName,
  useChatContext,
} from 'stream-chat-expo';
import type { Channel as StreamChannel } from 'stream-chat';
import { Colors, Typography } from '../../theme/colors';
import { SUPPORT_USER_ID } from '../../stream/config';

interface Props {
  cid: string;
  onBack: () => void;
}

/** WhatsApp-style chat has quoted replies but no thread screens: drop the "Reply in thread" action. */
const messageActions: React.ComponentProps<typeof Channel>['messageActions'] = params =>
  defaultMessageActions(params).filter(a => a.actionType !== 'threadReply');

export function ChatRoom({ cid, onBack }: Props) {
  const { client } = useChatContext();
  const [type, id] = cid.split(':');
  // Recreate the Channel from the CID (RULES: navigation carries a cid, never a Channel instance).
  const channel = useMemo(() => client.channel(type, id), [client, type, id]);

  return (
    <View style={styles.root}>
      {/* Header is rendered INSIDE <Channel>, so offsets are explicit 0 (omitting keyboardVerticalOffset passes undefined). */}
      <Channel
        channel={channel}
        keyboardVerticalOffset={0}
        topInset={0}
        messageInputFloating
        audioRecordingEnabled
        messageActions={messageActions}
        allowThreadMessagesInChannel={false}
      >
        <RoomHeader channel={channel} onBack={onBack} />
        <MessageList />
        <MessageComposer />
      </Channel>
    </View>
  );
}

function RoomHeader({ channel, onBack }: { channel: StreamChannel; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { client } = useChatContext();
  const title = useChannelPreviewDisplayName(channel);
  const [, force] = useState(0);

  // Re-render on presence / member changes so the subtitle stays live.
  useEffect(() => {
    const subs = [
      channel.on('user.presence.changed', () => force(n => n + 1)),
      channel.on('member.added', () => force(n => n + 1)),
      channel.on('member.removed', () => force(n => n + 1)),
    ];
    return () => subs.forEach(s => s.unsubscribe());
  }, [channel]);

  const members = Object.values(channel.state.members ?? {});
  const isGroup = channel.type === 'team' || members.length > 2;
  const other = members.find(m => m.user_id !== client.userID);
  const isSupport = other?.user_id === SUPPORT_USER_ID;

  const subtitle = isGroup
    ? `${members.length} members`
    : isSupport
      ? 'Church office · we reply as soon as we can'
      : other?.user?.online
        ? 'online'
        : other?.user?.last_active
          ? `last seen ${new Date(other.user.last_active).toLocaleDateString([], { day: 'numeric', month: 'short' })}`
          : '';

  const isMuted = channel.muteStatus().muted;

  const openMenu = useCallback(() => {
    const muteLabel = isMuted ? 'Unmute notifications' : 'Mute notifications';
    const leaveLabel = isGroup ? 'Leave group' : 'Delete chat';
    const run = async (i: number) => {
      try {
        if (i === 0) await (isMuted ? channel.unmute() : channel.mute());
        if (i === 1) {
          Alert.alert(leaveLabel, isGroup ? 'You will stop receiving messages from this group.' : 'This chat will be removed from your list.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: leaveLabel,
              style: 'destructive',
              onPress: async () => {
                if (isGroup) await channel.removeMembers([client.userID as string]);
                else await channel.hide(undefined, true);
                onBack();
              },
            },
          ]);
        }
      } catch {
        Alert.alert('Something went wrong', 'Please try again.');
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: [muteLabel, leaveLabel, 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 }, i => i < 2 && run(i));
    } else {
      Alert.alert(title, undefined, [
        { text: muteLabel, onPress: () => run(0) },
        { text: leaveLabel, style: 'destructive', onPress: () => run(1) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [channel, client.userID, isGroup, isMuted, onBack, title]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back} accessibilityLabel="Back" accessibilityRole="button">
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>
      <ChannelAvatar channel={channel} size="lg" showOnlineIndicator={false} />
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitle === 'online' && { color: Colors.success }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={openMenu} hitSlop={10} accessibilityLabel="Chat options" accessibilityRole="button">
        <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: { padding: 2 },
  titles: { flex: 1 },
  title: { fontFamily: Typography.fontSemiBold, fontSize: 17, color: Colors.textPrimary },
  subtitle: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
});
