import { Platform } from 'react-native';
import type { DeepPartial, Theme } from 'stream-chat-expo';
import { Colors, Typography } from '../theme/colors';

/**
 * GatewayConnect brand for Stream Chat (v9 token model).
 *
 * v9 colours flow from `semantics.*` tokens, NOT the v8 keys (`messageSimple`, `messageInput`, ...) the
 * previous ChatScreen used - those are ignored by the installed SDK, so the brand never applied.
 * Semantic tokens are resolved from the OS colour scheme *before* this object merges in, and derived
 * tokens are not re-resolved, so every token that matters is set explicitly (dark brand, always).
 */
const INK_ON_GOLD = '#09090b';
const OUTGOING = Colors.forestGreen; // '#2B4C47'
const OUTGOING_ATTACH = Colors.forestGreenLight; // '#3a6159'
const INCOMING = Colors.bgSecondary; // '#1e1e24'
const SURFACE_STRONG = '#26262e';

export const streamTheme: DeepPartial<Theme> = {
  semantics: {
    // accents
    accentPrimary: Colors.gold,
    accentSuccess: Colors.success,
    accentError: Colors.danger,
    accentWarning: Colors.gold,
    accentNeutral: Colors.textMuted,
    // surfaces
    backgroundCoreApp: Colors.bg,
    backgroundCoreSurfaceDefault: Colors.bgCard,
    backgroundCoreSurfaceCard: Colors.bgCard,
    backgroundCoreSurfaceSubtle: Colors.bgSecondary,
    backgroundCoreSurfaceStrong: SURFACE_STRONG,
    backgroundCoreHighlight: Colors.goldMuted,
    backgroundCoreOnAccent: INK_ON_GOLD,
    backgroundCoreOverlayDark: 'rgba(0,0,0,0.75)',
    backgroundCoreScrim: 'rgba(0,0,0,0.6)',
    // borders
    borderCoreDefault: Colors.border,
    borderCoreSubtle: Colors.border,
    borderCoreStrong: Colors.borderStrong,
    borderCoreOpacitySubtle: Colors.border,
    borderCoreOpacityStrong: Colors.borderStrong,
    borderUtilityFocused: Colors.gold,
    borderUtilitySelected: Colors.gold,
    // text
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textTertiary: Colors.textMuted,
    textDisabled: Colors.textMuted,
    textLink: Colors.gold,
    textOnAccent: INK_ON_GOLD,
    // chat bubbles (WhatsApp-style: own = brand green, others = dark grey)
    chatBgOutgoing: OUTGOING,
    chatBgIncoming: INCOMING,
    chatTextOutgoing: Colors.textPrimary,
    chatTextIncoming: Colors.textPrimary,
    chatBgAttachmentOutgoing: OUTGOING_ATTACH,
    chatBgAttachmentIncoming: SURFACE_STRONG,
    chatBorderOutgoing: 'transparent',
    chatBorderIncoming: 'transparent',
    chatBorderOnChatOutgoing: 'transparent',
    chatBorderOnChatIncoming: 'transparent',
    chatTextTimestamp: 'rgba(255,255,255,0.55)',
    chatTextRead: Colors.gold, // read ticks
    chatTextLink: Colors.gold,
    chatTextMention: Colors.gold,
    chatTextUsername: Colors.gold,
    chatTextSystem: Colors.textMuted,
    chatTextReaction: Colors.textPrimary,
    chatReplyIndicatorIncoming: Colors.gold,
    chatReplyIndicatorOutgoing: '#dfa732',
    chatWaveformBar: 'rgba(255,255,255,0.4)',
    chatWaveformBarPlaying: Colors.gold,
    // composer
    inputTextDefault: Colors.textPrimary,
    inputTextPlaceholder: Colors.textMuted,
    inputTextIcon: Colors.textSecondary,
    inputTextDisabled: Colors.textMuted,
    inputSendIcon: INK_ON_GOLD,
    inputSendIconDisabled: Colors.textMuted,
    // buttons
    buttonPrimaryBg: Colors.gold,
    buttonPrimaryText: INK_ON_GOLD,
    buttonPrimaryTextOnAccent: INK_ON_GOLD,
    buttonPrimaryBorder: Colors.gold,
    buttonSecondaryBg: Colors.bgSecondary,
    buttonSecondaryText: Colors.textPrimary,
    buttonSecondaryBorder: Colors.border,
    buttonDestructiveText: Colors.danger,
    // small parts
    badgeBgPrimary: Colors.gold,
    badgeBgDefault: Colors.gold,
    badgeTextOnAccent: INK_ON_GOLD,
    badgeText: INK_ON_GOLD,
    avatarBgDefault: Colors.forestGreenLight,
    avatarTextDefault: Colors.textPrimary,
    avatarBgPlaceholder: Colors.forestGreen,
    avatarTextPlaceholder: Colors.gold,
    presenceBgOnline: Colors.success,
    presenceBorder: Colors.bg,
    reactionBg: Colors.bgSecondary,
    reactionBorder: Colors.border,
    reactionText: Colors.textPrimary,
    controlProgressBarFill: Colors.gold,
    controlPlayButtonBg: Colors.gold,
    controlPlayButtonIcon: INK_ON_GOLD,
    controlToggleSwitchBgSelected: Colors.gold,
  },

  // Wallpaper behind the messages
  messageList: {
    container: { backgroundColor: Colors.bg },
  },

  // Bubbles: uniform 16pt corners (per-corner values are required, `borderRadius` alone loses to the SDK's tail corner)
  messageItemView: {
    content: {
      container: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      },
      markdown: {
        text: {
          fontFamily: Typography.fontRegular,
          fontSize: 15,
          lineHeight: 21,
          color: Colors.textPrimary,
        },
        // text-only bubble height comes from paragraph margins, not contentContainer
        paragraph: { marginTop: 6, marginBottom: 6 },
        paragraphCenter: { marginTop: 6, marginBottom: 6 },
      },
    },
  },

  // Chat list rows
  channelPreview: {
    container: {
      backgroundColor: Colors.bg,
      borderBottomWidth: 0,
    },
    title: { fontFamily: Typography.fontSemiBold, fontSize: 16, color: Colors.textPrimary },
    date: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted },
    unreadContainer: { backgroundColor: Colors.gold },
    unreadText: { fontFamily: Typography.fontBold, fontSize: 11, color: INK_ON_GOLD },
    message: { subtitle: { fontFamily: Typography.fontRegular, fontSize: 14, color: Colors.textSecondary } },
  },

  // Composer: floating pill on the wallpaper (WhatsApp look). Pill grows by symmetric input padding.
  messageComposer: {
    floatingWrapper: { backgroundColor: 'transparent' },
    inputBoxWrapper: {
      backgroundColor: Colors.bgSecondary,
      borderRadius: 24,
      borderWidth: 0,
    },
    inputBox: {
      fontFamily: Typography.fontRegular,
      fontSize: 16,
      color: Colors.textPrimary,
      paddingTop: Platform.OS === 'ios' ? 10 : 8,
      paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    },
  },
};
