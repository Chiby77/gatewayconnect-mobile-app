import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useComponentsContext, useMessageContext, useTheme } from 'stream-chat-expo';
import { Typography } from '../theme/colors';

/**
 * Sender name inside the bubble (incoming, group chats, first message of a run).
 * Replaces the name the default MessageFooter drew below the bubble.
 */
const InBubbleSender = memo(() => {
  const { alignment, groupStyles, members, message } = useMessageContext();
  const {
    theme: {
      semantics: { chatTextUsername },
    },
  } = useTheme();
  const isGroup = Object.keys(members ?? {}).length > 2;
  const startsRun = groupStyles?.some(g => g === 'top' || g === 'single');
  if (!isGroup || alignment !== 'left' || !startsRun || !message.user?.name) return null;
  return (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: Typography.fontSemiBold,
        fontSize: 13,
        color: chatTextUsername,
        paddingHorizontal: 12,
        paddingTop: 8,
      }}
    >
      {message.user.name}
    </Text>
  );
});

/**
 * WhatsApp-style metadata: "Edited  10:32 ✓✓" in the bottom-trailing corner INSIDE the bubble.
 * MessageStatus / MessageTimestamp are the SDK's own (correct sent/delivered/read logic + formatting).
 * These slots have no padding of their own, so it is reproduced here.
 */
const InBubbleMeta = memo(() => {
  const { message, showMessageStatus } = useMessageContext();
  const { MessageStatus, MessageTimestamp } = useComponentsContext();
  const {
    theme: {
      semantics: { chatTextTimestamp },
    },
  } = useTheme();
  const isEdited = Boolean(message.message_text_updated_at);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        paddingHorizontal: 10,
        paddingBottom: 6,
        marginTop: -2,
      }}
    >
      {isEdited ? (
        <Text style={{ fontFamily: Typography.fontRegular, fontSize: 11, color: chatTextTimestamp }}>Edited</Text>
      ) : null}
      <MessageTimestamp />
      {showMessageStatus ? <MessageStatus /> : null}
    </View>
  );
});

export const streamOverrides = {
  MessageContentTopView: InBubbleSender,
  MessageContentBottomView: InBubbleMeta,
  // default footer is suppressed so name/time/ticks are not drawn twice
  MessageFooter: () => null,
};
