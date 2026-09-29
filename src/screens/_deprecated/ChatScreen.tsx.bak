/**
 * ChatScreen.tsx
 * ──────────────────────────────────────────────────────────────────
 * Standalone WhatsApp-style Chat screen powered by GetStream.io.
 *
 * Requirements:
 *  1. Build a standalone Chat interface utilizing stream-chat-expo.
 *  2. Top Navigation Tabs: Scrollable filter tabs exactly like WhatsApp:
 *     [Chats] [Unread] [Direct] [Groups] [Calls].
 *  3. Theme: Override the default Stream Chat theme to perfectly match
 *     our app's dark theme (dark backgrounds, gold/white text, gold active states).
 *  4. Filter the Stream ChannelList based on the selected top tab
 *     (e.g., querying channels with unread_count > 0 for the Unread tab).
 * ──────────────────────────────────────────────────────────────────
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Typography } from '../theme/colors';
import { MobileUser } from '../auth/authService';

// ─── Stream Imports (safe dynamic resolution) ──────────────────────
let StreamChat: any;
let Chat: any;
let Channel: any;
let ChannelList: any;
let MessageList: any;
let MessageInput: any;
let OverlayProvider: any;

try {
  const sc = require('stream-chat');
  const scExpo = require('stream-chat-expo');
  StreamChat = sc.StreamChat;
  Chat = scExpo.Chat;
  Channel = scExpo.Channel;
  ChannelList = scExpo.ChannelList;
  MessageList = scExpo.MessageList;
  MessageInput = scExpo.MessageInput;
  OverlayProvider = scExpo.OverlayProvider;
} catch (_) {
  // stream-chat-expo will fall back gracefully to the interactive demo UI
}

// ─── Constants ────────────────────────────────────────────────────
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY ?? '';
const IS_CONFIGURED = !!(
  STREAM_API_KEY &&
  STREAM_API_KEY !== 'REPLACE_WITH_YOUR_STREAM_API_KEY' &&
  StreamChat &&
  Chat
);

// ─── Types ────────────────────────────────────────────────────────
export type ChatTab = 'chats' | 'unread' | 'direct' | 'groups' | 'calls';

export const CHAT_TABS: { key: ChatTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'chats',  label: 'Chats',  icon: 'chatbubbles-outline' },
  { key: 'unread', label: 'Unread', icon: 'notifications-outline' },
  { key: 'direct', label: 'Direct', icon: 'person-outline' },
  { key: 'groups', label: 'Groups', icon: 'people-outline' },
  { key: 'calls',  label: 'Calls',  icon: 'call-outline' },
];

export interface ChatScreenProps {
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
  onBack?: () => void;
}

// ─── Stream Theme Override (Dark & Gold) ──────────────────────────
export const STREAM_THEME = {
  colors: {
    accent_blue: Colors.gold,
    accent_green: '#22c55e',
    accent_red: Colors.danger,
    bg_gradient_end: Colors.bg,
    bg_gradient_start: Colors.bgCard,
    black: Colors.textPrimary,
    blue_alice: Colors.bgSecondary,
    border: 'rgba(255, 255, 255, 0.08)',
    grey: Colors.textMuted,
    grey_gainsboro: Colors.bgSecondary,
    grey_whisper: Colors.bgMuted,
    icon_background: Colors.bgSecondary,
    modal_shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.75)',
    overlay_dark: 'rgba(0, 0, 0, 0.88)',
    shadow_icon: 'rgba(0, 0, 0, 0.6)',
    targetedMessageBackground: 'rgba(223, 167, 50, 0.16)',
    transparent: 'transparent',
    white: Colors.bg,
    white_smoke: Colors.bgCard,
    white_snow: Colors.bgCard,
  },
  channelListMessenger: {
    flatList: {
      backgroundColor: Colors.bg,
    },
    flatListContent: {
      backgroundColor: Colors.bg,
    },
  },
  channelPreview: {
    container: {
      backgroundColor: Colors.bg,
      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: Colors.textPrimary,
      fontFamily: Typography.fontSemiBold,
      fontSize: 15,
    },
    message: {
      color: Colors.textMuted,
      fontFamily: Typography.fontRegular,
      fontSize: 13,
    },
    date: {
      color: Colors.textMuted,
      fontFamily: Typography.fontRegular,
      fontSize: 11,
    },
    unreadContainer: {
      backgroundColor: Colors.gold,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
    },
    unreadText: {
      color: '#000000',
      fontFamily: Typography.fontBold,
      fontSize: 10,
    },
  },
  messageList: {
    container: {
      backgroundColor: Colors.bg,
    },
  },
  messageSimple: {
    content: {
      containerInner: {
        backgroundColor: Colors.bgCard,
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      textContainer: {
        backgroundColor: Colors.bgCard,
      },
      markdown: {
        text: {
          color: Colors.textPrimary,
        },
      },
    },
  },
  messageInput: {
    container: {
      backgroundColor: Colors.bgCard,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputBox: {
      color: Colors.textPrimary,
      backgroundColor: Colors.bgSecondary,
      borderRadius: Radii.full,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sendButtonContainer: {
      backgroundColor: Colors.gold,
      borderRadius: 20,
    },
  },
};

// ─── Demo Channel & Messages Data ─────────────────────────────────
interface DemoChannel {
  id: string;
  name: string;
  last: string;
  time: string;
  unread: number;
  type: 'group' | 'direct';
  avatarText: string;
  verified?: boolean;
}

interface DemoMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const INITIAL_DEMO_CHANNELS: DemoChannel[] = [
  { id: 'c1', name: 'Gateway Prayer Warriors',    last: 'Amen! The Lord is faithful. 🙏', time: '10:32 AM', unread: 3, type: 'group',  avatarText: 'PW', verified: true },
  { id: 'c2', name: 'Apostle Joe Daniels',         last: 'I will be praying for you.',     time: '9:14 AM',  unread: 1, type: 'direct', avatarText: 'JD', verified: true },
  { id: 'c3', name: 'ISM Academy Students',        last: 'Class notes uploaded ✅',         time: 'Yesterday', unread: 0, type: 'group',  avatarText: 'IS' },
  { id: 'c4', name: 'Prophetess Melinda',          last: 'The Word for this week…',        time: 'Yesterday', unread: 0, type: 'direct', avatarText: 'MD', verified: true },
  { id: 'c5', name: "Men's Growth Covenant Group", last: 'Sunday recap is out.',            time: 'Mon',       unread: 0, type: 'group',  avatarText: 'MG' },
  { id: 'c6', name: 'Harare Cell Leaders',         last: 'Next meeting: Saturday 9AM',     time: 'Sun',       unread: 0, type: 'group',  avatarText: 'HC' },
];

const INITIAL_DEMO_CONVERSATIONS: Record<string, DemoMessage[]> = {
  c1: [
    { id: 'm1', text: 'Shalom saints! Welcome to the morning intercession hour.', sender: 'them', time: '10:15 AM' },
    { id: 'm2', text: 'Standing in faith for supernatural health across all families.', sender: 'me', time: '10:20 AM' },
    { id: 'm3', text: 'Amen! The Lord is faithful. 🙏', sender: 'them', time: '10:32 AM' },
  ],
  c2: [
    { id: 'm1', text: 'Greetings beloved. How is your spirit today?', sender: 'them', time: '9:00 AM' },
    { id: 'm2', text: 'Apostle, please remember our business venture in prayer.', sender: 'me', time: '9:10 AM' },
    { id: 'm3', text: 'I will be praying for you. Supernatural wisdom is yours.', sender: 'them', time: '9:14 AM' },
  ],
  c3: [
    { id: 'm1', text: 'Module 4: Pneumatology lecture starts at 6PM CAT.', sender: 'them', time: 'Yesterday' },
    { id: 'm2', text: 'Class notes uploaded ✅', sender: 'them', time: 'Yesterday' },
  ],
  c4: [
    { id: 'm1', text: 'The Word for this week is Supernatural Acceleration! 🕊️', sender: 'them', time: 'Yesterday' },
  ],
  c5: [
    { id: 'm1', text: 'Iron sharpens iron brothers. Sunday recap is out.', sender: 'them', time: 'Mon' },
  ],
  c6: [
    { id: 'm1', text: 'Harare Cell Leaders: Next meeting is Saturday 9AM at the Main Sanctuary.', sender: 'them', time: 'Sun' },
  ],
};

const RECENT_CALLS = [
  { id: 'k1', name: 'Apostle Joe Daniels', type: 'incoming', time: 'Today, 8:45 AM',  duration: '14:32', avatarText: 'JD', missed: false },
  { id: 'k2', name: 'Prayer Hotline',      type: 'outgoing', time: 'Yesterday',       duration: '5:12',  avatarText: 'PH', missed: false },
  { id: 'k3', name: 'Prophetess Melinda',  type: 'missed',   time: 'Mon, 7:20 PM',    duration: '',      avatarText: 'MD', missed: true  },
  { id: 'k4', name: 'Harare Cell Leaders', type: 'incoming', time: 'Sun, 4:15 PM',    duration: '22:04', avatarText: 'HC', missed: false },
];

// ─── Main Component ───────────────────────────────────────────────
export function ChatScreen({ profile, onRequestAuth, onBack }: ChatScreenProps) {
  const [activeTab, setActiveTab] = useState<ChatTab>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStreamChannel, setActiveStreamChannel] = useState<any>(null);

  // Stream Client state
  const [streamClient, setStreamClient] = useState<any>(null);
  const [clientReady, setClientReady] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Interactive Demo mode states
  const [demoChannels, setDemoChannels] = useState<DemoChannel[]>(INITIAL_DEMO_CHANNELS);
  const [activeDemoChannel, setActiveDemoChannel] = useState<DemoChannel | null>(null);
  const [demoConversations, setDemoConversations] = useState<Record<string, DemoMessage[]>>(INITIAL_DEMO_CONVERSATIONS);
  const [demoInputText, setDemoInputText] = useState('');

  // Tab spring indicator
  const tabIndicatorX = useRef(new Animated.Value(0)).current;

  // ── Build Stream client when configured & user logged in ──
  useEffect(() => {
    if (!IS_CONFIGURED || !profile) return;
    let cancelled = false;

    const initClient = async () => {
      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        // Dev token for development / token-based auth
        const devToken = client.devToken(profile.id);
        await client.connectUser(
          {
            id: profile.id,
            name: profile.name ?? profile.phone ?? 'Gateway Member',
            image: profile.avatar_url ?? undefined,
          },
          devToken
        );
        if (!cancelled) {
          setStreamClient(client);
          setClientReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setClientError(err?.message ?? 'Failed to connect to Stream Chat.');
        }
      }
    };

    initClient();
    return () => {
      cancelled = true;
      streamClient?.disconnectUser().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ── Tab switch handler ──
  const onTabPress = useCallback((tab: ChatTab, idx: number) => {
    setActiveTab(tab);
    setActiveStreamChannel(null);
    setActiveDemoChannel(null);
    Animated.spring(tabIndicatorX, {
      toValue: idx,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [tabIndicatorX]);

  // ── Stream filter per tab ──
  const streamFilters = useMemo(() => {
    const base: Record<string, any> = { members: { $in: [profile?.id ?? ''] } };
    if (searchQuery.trim()) {
      base.name = { $autocomplete: searchQuery.trim() };
    }
    switch (activeTab) {
      case 'unread': return { ...base, unread_count: { $gt: 0 } };
      case 'direct': return { ...base, type: 'messaging' };
      case 'groups': return { ...base, type: { $in: ['team', 'livestream'] } };
      default:       return base;
    }
  }, [activeTab, profile?.id, searchQuery]);

  // ── Filter demo channels for non-Stream mode ──
  const filteredDemo = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return demoChannels.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.last.toLowerCase().includes(q)) return false;
      if (activeTab === 'unread') return c.unread > 0;
      if (activeTab === 'direct') return c.type === 'direct';
      if (activeTab === 'groups') return c.type === 'group';
      return true;
    });
  }, [activeTab, searchQuery, demoChannels]);

  // Total unread for badge
  const totalUnreadCount = useMemo(() => {
    return demoChannels.reduce((sum, ch) => sum + ch.unread, 0);
  }, [demoChannels]);

  // ── Demo message sending ──
  const handleSendDemoMessage = () => {
    if (!demoInputText.trim() || !activeDemoChannel) return;
    const chId = activeDemoChannel.id;
    const text = demoInputText.trim();
    const newMsg: DemoMessage = {
      id: 'm_' + Date.now(),
      text,
      sender: 'me',
      time: 'Just now',
    };

    setDemoConversations(prev => ({
      ...prev,
      [chId]: [...(prev[chId] || []), newMsg],
    }));

    setDemoChannels(prev =>
      prev.map(ch => (ch.id === chId ? { ...ch, last: text, time: 'Just now' } : ch))
    );
    setDemoInputText('');

    // Simulate auto-reply after 1.2s
    setTimeout(() => {
      const replyMsg: DemoMessage = {
        id: 'reply_' + Date.now(),
        text: chId === 'c2'
          ? 'Grace and peace be multiplied unto you! Standing with you in persistent faith. 🕊️'
          : 'Amen! God is working all things together for your good! 🙏',
        sender: 'them',
        time: 'Just now',
      };
      setDemoConversations(p => ({
        ...p,
        [chId]: [...(p[chId] || []), replyMsg],
      }));
      setDemoChannels(p =>
        p.map(ch => (ch.id === chId ? { ...ch, last: replyMsg.text, time: 'Just now' } : ch))
      );
    }, 1200);
  };

  // ─────────────────────────────────────────────────────────────────
  // Sign-in Gate (Guest view)
  // ─────────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <View style={styles.gateContainer}>
        {onBack && (
          <Pressable style={styles.gateBackBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.gold} />
          </Pressable>
        )}
        <View style={styles.gateCard}>
          <View style={styles.gateIconWrap}>
            <Ionicons name="chatbubbles" size={44} color={Colors.gold} />
          </View>
          <Text style={styles.gateTitle}>Kingdom WhatsApp & Chat</Text>
          <Text style={styles.gateSub}>
            Sign in to chat in real-time with Apostle Joe Daniels, church ministry leaders, cell groups, and prayer partners.
          </Text>
          <Pressable
            style={styles.gateBtn}
            onPress={() => onRequestAuth?.('Sign in to access Gateway Connect messaging.')}
          >
            <Ionicons name="log-in-outline" size={18} color="#000" />
            <Text style={styles.gateBtnText}>Sign In to Chat</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Top Header (WhatsApp Header)
  // ─────────────────────────────────────────────────────────────────
  const renderWhatsAppHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack && (
          <Pressable style={styles.headerBackBtn} onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={Colors.gold} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Gateway Chat</Text>
      </View>
      <View style={styles.headerRight}>
        <Pressable style={styles.headerIconBtn} accessibilityLabel="Camera">
          <Ionicons name="camera-outline" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => {
            if (activeTab === 'calls') {
              setActiveTab('chats');
            }
          }}
          accessibilityLabel="Search"
        >
          <Ionicons name="search-outline" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.headerIconBtn} accessibilityLabel="Options">
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────
  // WhatsApp Scrollable Top Navigation Tabs:
  // [Chats] [Unread] [Direct] [Groups] [Calls]
  // ─────────────────────────────────────────────────────────────────
  const renderTopFilterTabs = () => (
    <View style={styles.filterTabsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
      >
        {CHAT_TABS.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'unread' && totalUnreadCount > 0;
          return (
            <Pressable
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onTabPress(tab.key, idx)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isActive ? '#000000' : Colors.textMuted}
              />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
              {showBadge && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {totalUnreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────
  // Search Bar
  // ─────────────────────────────────────────────────────────────────
  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search chats, leaders, groups..."
        placeholderTextColor={Colors.textMuted}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </Pressable>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────
  // WhatsApp Calls Tab Content
  // ─────────────────────────────────────────────────────────────────
  const renderCallsView = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.callsPromoCard}>
        <View style={styles.callsPromoIconWrap}>
          <Ionicons name="videocam" size={24} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callsPromoTitle}>High-Quality Audio & Video Calls</Text>
          <Text style={styles.callsPromoSub}>Connect face-to-face with your pastors, prayer intercessors, and fellowship.</Text>
        </View>
      </View>

      <Text style={styles.callsSectionTitle}>RECENT CALLS</Text>

      {RECENT_CALLS.map((call, i) => (
        <View key={call.id} style={[styles.callRow, i > 0 && styles.callRowBorder]}>
          <View style={[styles.callAvatar, call.missed && { borderColor: Colors.danger }]}>
            <Text style={styles.callAvatarText}>{call.avatarText}</Text>
          </View>
          <View style={styles.callContent}>
            <View style={styles.callTopRow}>
              <Text style={[styles.callName, call.missed && { color: Colors.danger }]}>
                {call.name}
              </Text>
              <Text style={styles.callTime}>{call.time}</Text>
            </View>
            <View style={styles.callBottomRow}>
              <Ionicons
                name={call.type === 'incoming' ? 'arrow-down' : call.type === 'missed' ? 'call' : 'arrow-up'}
                size={13}
                color={call.missed ? Colors.danger : '#22c55e'}
              />
              <Text style={[styles.callStatusText, call.missed && { color: Colors.danger }]}>
                {call.missed ? 'Missed Call' : `${call.type === 'incoming' ? 'Incoming' : 'Outgoing'} · ${call.duration}`}
              </Text>
            </View>
          </View>
          <Pressable style={styles.callActionBtn}>
            <Ionicons name="call" size={17} color={Colors.gold} />
          </Pressable>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────
  // CONFIGURED STREAM CHAT PATH (Live GetStream.io Engine)
  // ─────────────────────────────────────────────────────────────────
  if (IS_CONFIGURED) {
    if (!clientReady && !clientError) {
      return (
        <View style={styles.rootContainer}>
          {renderWhatsAppHeader()}
          {renderTopFilterTabs()}
          <View style={styles.centerStatus}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.statusText}>Connecting to GetStream.io...</Text>
          </View>
        </View>
      );
    }

    if (clientError) {
      return (
        <View style={styles.rootContainer}>
          {renderWhatsAppHeader()}
          {renderTopFilterTabs()}
          <View style={styles.centerStatus}>
            <Ionicons name="alert-circle-outline" size={38} color={Colors.danger} />
            <Text style={styles.errorText}>{clientError}</Text>
          </View>
        </View>
      );
    }

    // Active Channel open -> Show MessageList & MessageInput
    if (activeStreamChannel) {
      return (
        <OverlayProvider value={{ style: STREAM_THEME }}>
          <Chat client={streamClient} style={STREAM_THEME}>
            <Channel channel={activeStreamChannel}>
              <View style={styles.channelScreen}>
                {/* WhatsApp Channel Header */}
                <View style={styles.channelHeader}>
                  <Pressable
                    style={styles.channelHeaderBack}
                    onPress={() => setActiveStreamChannel(null)}
                  >
                    <Ionicons name="arrow-back" size={22} color={Colors.gold} />
                  </Pressable>
                  <View style={styles.channelHeaderAvatar}>
                    <Text style={styles.channelHeaderAvatarText}>
                      {(activeStreamChannel.data?.name ?? 'C').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.channelHeaderMeta}>
                    <Text style={styles.channelHeaderTitle} numberOfLines={1}>
                      {activeStreamChannel.data?.name ?? 'Chat'}
                    </Text>
                    <Text style={styles.channelHeaderSub}>Online</Text>
                  </View>
                  <Pressable style={styles.channelHeaderAction}>
                    <Ionicons name="videocam-outline" size={20} color={Colors.gold} />
                  </Pressable>
                  <Pressable style={styles.channelHeaderAction}>
                    <Ionicons name="call-outline" size={18} color={Colors.gold} />
                  </Pressable>
                </View>

                {/* Stream Messages List & Input */}
                <MessageList />
                <MessageInput />
              </View>
            </Channel>
          </Chat>
        </OverlayProvider>
      );
    }

    // Channel List View
    return (
      <OverlayProvider value={{ style: STREAM_THEME }}>
        <Chat client={streamClient} style={STREAM_THEME}>
          <View style={styles.rootContainer}>
            {renderWhatsAppHeader()}
            {renderTopFilterTabs()}
            {activeTab === 'calls' ? (
              renderCallsView()
            ) : (
              <>
                {renderSearchBar()}
                <ChannelList
                  filters={streamFilters}
                  sort={{ last_message_at: -1 }}
                  onSelect={(channel: any) => setActiveStreamChannel(channel)}
                />
              </>
            )}
          </View>
        </Chat>
      </OverlayProvider>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // INTERACTIVE DEMO CONVERSATION VIEW (Fallback Mode)
  // ─────────────────────────────────────────────────────────────────
  if (activeDemoChannel) {
    const messages = demoConversations[activeDemoChannel.id] || [];

    return (
      <KeyboardAvoidingView
        style={styles.channelScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* WhatsApp Channel Header */}
        <View style={styles.channelHeader}>
          <Pressable
            style={styles.channelHeaderBack}
            onPress={() => setActiveDemoChannel(null)}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.gold} />
          </Pressable>
          <View style={styles.channelHeaderAvatar}>
            <Text style={styles.channelHeaderAvatarText}>{activeDemoChannel.avatarText}</Text>
          </View>
          <View style={styles.channelHeaderMeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.channelHeaderTitle} numberOfLines={1}>
                {activeDemoChannel.name}
              </Text>
              {activeDemoChannel.verified && (
                <Ionicons name="checkmark-circle" size={13} color={Colors.gold} />
              )}
            </View>
            <Text style={styles.channelHeaderSub}>Online • Tap for details</Text>
          </View>
          <Pressable style={styles.channelHeaderAction}>
            <Ionicons name="videocam-outline" size={20} color={Colors.gold} />
          </Pressable>
          <Pressable style={styles.channelHeaderAction}>
            <Ionicons name="call-outline" size={18} color={Colors.gold} />
          </Pressable>
        </View>

        {/* Messages List */}
        <ScrollView
          style={styles.demoMessagesContainer}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(m => {
            const isMe = m.sender === 'me';
            return (
              <View
                key={m.id}
                style={[
                  styles.demoBubble,
                  isMe ? styles.demoBubbleMe : styles.demoBubbleThem,
                ]}
              >
                <Text style={[styles.demoBubbleText, isMe && styles.demoBubbleTextMe]}>
                  {m.text}
                </Text>
                <View style={styles.demoBubbleMeta}>
                  <Text style={styles.demoBubbleTime}>{m.time}</Text>
                  {isMe && (
                    <Ionicons name="checkmark-done" size={13} color={Colors.gold} />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Message Input Bar */}
        <View style={styles.demoInputRow}>
          <Pressable style={styles.inputAttachmentBtn}>
            <Ionicons name="add" size={22} color={Colors.gold} />
          </Pressable>
          <TextInput
            style={styles.demoTextInput}
            placeholder="Type a kingdom message..."
            placeholderTextColor={Colors.textMuted}
            value={demoInputText}
            onChangeText={setDemoInputText}
            multiline
          />
          {demoInputText.trim().length > 0 ? (
            <Pressable style={styles.demoSendBtn} onPress={handleSendDemoMessage}>
              <Ionicons name="send" size={16} color="#000" />
            </Pressable>
          ) : (
            <Pressable style={styles.demoMicBtn}>
              <Ionicons name="mic-outline" size={20} color={Colors.gold} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // UNCONFIGURED / DEMO CHANNEL LIST VIEW
  // ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      {/* Stream API Notice Banner */}
      <View style={styles.setupBanner}>
        <Ionicons name="information-circle" size={14} color={Colors.gold} />
        <Text style={styles.setupBannerText}>
          Stream Chat Engine Ready — Add <Text style={{ color: Colors.gold, fontFamily: Typography.fontBold }}>EXPO_PUBLIC_STREAM_API_KEY</Text> in .env for live sync.
        </Text>
      </View>

      {renderWhatsAppHeader()}
      {renderTopFilterTabs()}

      {activeTab === 'calls' ? (
        renderCallsView()
      ) : (
        <>
          {renderSearchBar()}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {filteredDemo.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No conversations found</Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'unread'
                    ? 'All messages have been read!'
                    : 'Start a new conversation with your church family.'}
                </Text>
              </View>
            ) : (
              filteredDemo.map((ch, idx) => (
                <Pressable
                  key={ch.id}
                  style={[styles.channelItem, idx > 0 && styles.channelItemBorder]}
                  onPress={() => {
                    // Mark as read and open
                    setDemoChannels(prev =>
                      prev.map(c => (c.id === ch.id ? { ...c, unread: 0 } : c))
                    );
                    setActiveDemoChannel(ch);
                  }}
                >
                  {/* Avatar */}
                  <View style={[styles.avatarWrap, ch.type === 'group' && styles.avatarGroup]}>
                    <Text style={styles.avatarText}>{ch.avatarText}</Text>
                    {ch.type === 'group' && (
                      <View style={styles.groupIconBadge}>
                        <Ionicons name="people" size={8} color="#000" />
                      </View>
                    )}
                  </View>

                  {/* Channel Body */}
                  <View style={styles.channelBody}>
                    <View style={styles.channelRowTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        <Text style={styles.channelName} numberOfLines={1}>
                          {ch.name}
                        </Text>
                        {ch.verified && (
                          <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
                        )}
                      </View>
                      <Text style={[styles.channelTime, ch.unread > 0 && { color: Colors.gold }]}>
                        {ch.time}
                      </Text>
                    </View>
                    <View style={styles.channelRowBottom}>
                      <Text style={styles.channelLastMsg} numberOfLines={1}>
                        {ch.last}
                      </Text>
                      {ch.unread > 0 && (
                        <View style={styles.unreadPill}>
                          <Text style={styles.unreadPillText}>{ch.unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
            <View style={{ height: 110 }} />
          </ScrollView>
        </>
      )}

      {/* Floating Action Button for New Chat */}
      <Pressable
        style={styles.newChatFab}
        onPress={() => {
          if (filteredDemo.length > 0) {
            setActiveDemoChannel(filteredDemo[0]);
          }
        }}
        accessibilityLabel="New Chat"
      >
        <Ionicons name="chatbox-ellipses" size={24} color="#000" />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── Setup banner
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 167, 50, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  setupBannerText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },

  // ── WhatsApp Top Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: Colors.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: -4,
  },
  headerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    padding: 4,
  },

  // ── Filter Tabs (WhatsApp pill chips)
  filterTabsWrap: {
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTabsContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
  },
  filterChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#000000',
    fontFamily: Typography.fontBold,
  },
  tabBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: '#000000',
  },
  tabBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#000000',
    fontSize: 10,
  },
  tabBadgeTextActive: {
    color: Colors.gold,
  },

  // ── Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141a',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    marginHorizontal: 14,
    marginVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 13,
  },

  // ── Channel Rows
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bg,
  },
  channelItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181e2b',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGroup: {
    backgroundColor: '#162235',
  },
  avatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 15,
  },
  groupIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  channelBody: {
    flex: 1,
  },
  channelRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  channelName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  channelTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  channelRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelLastMsg: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadPill: {
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadPillText: {
    fontFamily: Typography.fontBold,
    color: '#000000',
    fontSize: 10,
  },

  // ── Calls Tab
  callsPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 14,
    padding: 16,
    backgroundColor: 'rgba(223, 167, 50, 0.08)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.2)',
  },
  callsPromoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(223, 167, 50, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callsPromoTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  callsPromoSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  callsSectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bg,
  },
  callRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  callAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#161922',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
  },
  callContent: {
    flex: 1,
  },
  callTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  callName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  callTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  callBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callStatusText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  callActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Channel Screen / Conversation
  channelScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111318',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  channelHeaderBack: {
    padding: 4,
  },
  channelHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1d2332',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  channelHeaderMeta: {
    flex: 1,
  },
  channelHeaderTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  channelHeaderSub: {
    fontFamily: Typography.fontRegular,
    color: '#22c55e',
    fontSize: 11,
  },
  channelHeaderAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Demo Messages & Input
  demoMessagesContainer: {
    flex: 1,
    backgroundColor: '#07080b',
  },
  demoBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.lg,
  },
  demoBubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#181b24',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  demoBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e241c',
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  demoBubbleText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  demoBubbleTextMe: {
    color: '#ffffff',
  },
  demoBubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  demoBubbleTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  demoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111318',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputAttachmentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTextInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    backgroundColor: '#1b1e27',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    fontSize: 14,
    maxHeight: 90,
  },
  demoSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoMicBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── New Chat Floating Button
  newChatFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },

  // ── Empty & Status States
  centerStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  statusText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 13,
  },
  errorText: {
    fontFamily: Typography.fontRegular,
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Auth Gate
  gateContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  gateBackBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
  },
  gateCard: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.25)',
    padding: 30,
    gap: 14,
    width: '100%',
    maxWidth: 380,
  },
  gateIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    textAlign: 'center',
  },
  gateSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 6,
  },
  gateBtnText: {
    fontFamily: Typography.fontBold,
    color: '#000000',
    fontSize: 14,
  },
});
