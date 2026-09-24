import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput, Animated, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { NetworkStatus } from '../network/networkStatus';
import { SyncState } from '../sync/syncStatus';
import { listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { MobileUser } from '../auth/authService';
import { ZoomMeetingModal } from '../components/ZoomMeetingModal';

interface HomeScreenProps {
  networkStatus: NetworkStatus;
  pendingMutations: number;
  syncState: SyncState;
  profile: MobileUser | null;
  onNavigateBible: () => void;
  onNavigateStore: () => void;
  onNavigateSermons?: () => void;
  onNavigateLive?: () => void;
  onRequestAuth?: (prompt?: string) => void;
  onNavigateProfile?: () => void;
}

interface LiveDecreeMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

const INITIAL_DECREES: LiveDecreeMessage[] = [
  { id: '1', user: 'Sister Tariro (Harare)', text: 'Amen! Receiving this word of divine speed!', time: '10:04' },
  { id: '2', user: 'Brother Farai (UK)', text: 'Watching live from London! The presence of God is heavy!', time: '10:05' },
  { id: '3', user: 'Deacon Mutasa', text: 'Hallelujah! Prophetic alignment is happening!', time: '10:06' },
  { id: '4', user: 'Chiedza (Bulawayo)', text: 'Glory to Jesus! No more stagnation!', time: '10:07' },
];

const UPCOMING_SERVICES = [
  {
    id: 'sund',
    title: 'Sunday Glorious Service',
    time: 'Sun • 09:00 AM CAT',
    venue: 'Main Sanctuary & Global Live',
    icon: 'flame',
    tag: 'Next Service',
  },
  {
    id: 'wed',
    title: 'Midweek Dominion & Word',
    time: 'Wed • 05:30 PM CAT',
    venue: 'Teaching Sanctuary & Stream',
    icon: 'book',
    tag: 'Deep Bible',
  },
  {
    id: 'fri',
    title: 'Fire Friday Prayer Rally',
    time: 'Fri • 06:00 PM CAT',
    venue: 'Harare Sanctuary & Virtual',
    icon: 'flash',
    tag: 'Atmosphere',
  },
];

const TRENDING_DECREES = [
  {
    id: 'td1',
    author: 'Sister Tariro (Harare)',
    badgeLabel: 'Covenant Believer',
    avatarText: 'ST',
    text: 'After Friday prayer altar, God opened a corporate breakthrough for me this week! Divine speed is real!',
    initialLikes: 48,
    time: '1h ago',
  },
  {
    id: 'td2',
    author: 'Brother Farai (UK)',
    badgeLabel: 'Verified Believer',
    avatarText: 'BF',
    text: "Apostle's decree of supernatural speed literally broke 3 years of visa delay in 48 hours. Glory to God!",
    initialLikes: 65,
    time: '3h ago',
  },
  {
    id: 'td3',
    author: 'Deacon Mutasa',
    badgeLabel: 'Gold Partner',
    avatarText: 'DM',
    text: 'The atmosphere in the sanctuary is shifting. Miracles and financial releases are breaking out everywhere!',
    initialLikes: 39,
    time: '5h ago',
  },
];

export function HomeScreen({
  networkStatus,
  profile,
  onNavigateBible,
  onNavigateStore,
  onNavigateSermons,
  onNavigateLive,
  onRequestAuth,
  onNavigateProfile,
}: HomeScreenProps) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeDevotional, setActiveDevotional] = useState<ContentItem | null>(null);

  // Daily Bread & Trending states
  const [dailyBreadLiked, setDailyBreadLiked] = useState(false);
  const [dailyBreadLikes, setDailyBreadLikes] = useState(142);
  const [decreeLikesState, setDecreeLikesState] = useState<Record<string, { count: number; liked: boolean; amened: boolean }>>({
    td1: { count: 48, liked: false, amened: false },
    td2: { count: 65, liked: false, amened: false },
    td3: { count: 39, liked: false, amened: false },
  });
  // Per-service notification bell state
  const [serviceReminders, setServiceReminders] = useState<Record<string, boolean>>({});
  const toggleServiceReminder = (id: string) => {
    setServiceReminders(prev => {
      const next = !prev[id];
      triggerToast(next ? '🔔 Reminder set!' : '🔕 Reminder removed.');
      return { ...prev, [id]: next };
    });
  };

  // Live broadcast interactive states matching Screenshots 1 & 2
  const [isLiveAudioMuted, setIsLiveAudioMuted] = useState(false);
  const [broadcastLikes, setBroadcastLikes] = useState(42);
  const [isLiked, setIsLiked] = useState(false);
  const [showInStreamGiving, setShowInStreamGiving] = useState(false);
  const [givingCurrency, setGivingCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [givingAmount, setGivingAmount] = useState<number>(20);
  const [givingPhone, setGivingPhone] = useState(profile?.phone || '0770000000');
  const [givingGateway, setGivingGateway] = useState<'EcoCash' | 'Innbucks' | 'Card'>('EcoCash');
  const [givingPurpose, setGivingPurpose] = useState('Altar Seed (Prophetic Covenant)');
  const [decreeInput, setDecreeInput] = useState('');
  const [decreeMessages, setDecreeMessages] = useState<LiveDecreeMessage[]>(INITIAL_DECREES);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Zoom Meeting Modal state (Screenshots 3 & 4)
  const [showZoomModal, setShowZoomModal] = useState(false);

  useEffect(() => {
    setDevotionals(listContent('devotional'));
    setSermons(listContent('sermon'));
  }, []);

  const isOnline = networkStatus === 'online';

  const triggerToast = (msg: string) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(null), 3000);
  };

  const handleLikeBroadcast = () => {
    setIsLiked(prev => !prev);
    setBroadcastLikes(prev => isLiked ? prev - 1 : prev + 1);
    triggerToast('❤️ Altar decree reaction sent!');
  };

  const handleSendDecree = (presetText?: string) => {
    const text = presetText || decreeInput.trim();
    if (!text) return;
    const authorName = profile?.name ? `${profile.name} (${profile.location?.split(',')[0] || 'Member'})` : 'Believer in Faith';
    const newMsg: LiveDecreeMessage = {
      id: `dec_${Date.now()}`,
      user: authorName,
      text,
      time: 'Just now',
    };
    setDecreeMessages(prev => [...prev, newMsg]);
    if (!presetText) setDecreeInput('');
    triggerToast(`Decreed: "${text}"`);
  };

  const handleExecuteGiving = () => {
    if (!givingPhone.trim()) {
      Alert.alert('Phone Required', `Please enter your ${givingGateway} phone number.`);
      return;
    }
    Alert.alert(
      'Seed Placed on the Altar',
      `Thank you! Your seed of ${givingCurrency === 'USD' ? `$${givingAmount} USD` : `ZiG ${givingAmount * 15}`} has been dedicated to ${givingPurpose}.`,
      [{ text: 'Amen', onPress: () => setShowInStreamGiving(false) }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Live Toast Notification */}
      {liveToast ? (
        <View style={styles.liveToastBar}>
          <Ionicons name="flash" size={14} color={Colors.gold} />
          <Text style={styles.liveToastText}>{liveToast}</Text>
        </View>
      ) : null}

      {/* Interactive Live Broadcast Stream Player (Screenshots 1 & 2) */}
      <View style={styles.broadcastCard}>
        {/* Stream Top Bar */}
        <View style={styles.streamTopBar}>
          <View style={styles.streamBroadcasterRow}>
            <View style={styles.apostleAvatar}>
              <Text style={styles.apostleAvatarText}>JD</Text>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.broadcasterHandle}>apostle_joe_daniels</Text>
                <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
              </View>
              <Text style={styles.broadcasterLocation}>Harare, Zimbabwe • Main Sanctuary</Text>
            </View>
          </View>

          <View style={styles.streamBadgesRow}>
            <View style={styles.livePulseBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.livePulseText}>LIVE BROADCAST</Text>
            </View>
            <Pressable
              onPress={() => setIsLiveAudioMuted(!isLiveAudioMuted)}
              style={styles.audioToggleBtn}
            >
              <Ionicons
                name={isLiveAudioMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={16}
                color={Colors.gold}
              />
            </Pressable>
          </View>
        </View>

        {/* In-App Stream Video Player */}
        <View style={styles.videoPlayerBox}>
          <WebView
            source={{
              html: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000000; overflow:hidden; }
    iframe { width:100%; height:100%; border:0; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube-nocookie.com/embed/-CibsaxijIk?autoplay=1&playsinline=1&enablejsapi=1&fs=1&rel=0&modestbranding=1&origin=https://gatewayconnect.joedaniels.org"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`,
              baseUrl: 'https://gatewayconnect.joedaniels.org',
            }}
            originWhitelist={['*']}
            style={{ flex: 1, backgroundColor: '#000000' }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* Under Video Actions Row (Screenshot 2) */}
        <View style={styles.underVideoBar}>
          <Pressable style={styles.likeBtn} onPress={handleLikeBroadcast}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
            <Text style={styles.likeCountText}>{broadcastLikes}</Text>
          </Pressable>

          <Pressable
            style={[styles.seedToggleBtn, showInStreamGiving && styles.seedToggleBtnActive]}
            onPress={() => setShowInStreamGiving(!showInStreamGiving)}
          >
            <Ionicons name="gift" size={14} color={showInStreamGiving ? Colors.gold : Colors.textInverse} />
            <Text style={[styles.seedToggleBtnText, showInStreamGiving && { color: Colors.gold }]}>
              {showInStreamGiving ? 'Close Seed' : 'Seed'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.shareIconBtn}
            onPress={() => triggerToast('Link copied to share stream!')}
          >
            <Ionicons name="share-social-outline" size={18} color={Colors.gold} />
          </Pressable>

          <View style={styles.quickReactionsWrap}>
            {['❤️', '🙏', '🔥'].map(emoji => (
              <Pressable
                key={emoji}
                style={styles.emojiReactionBtn}
                onPress={() => handleSendDecree(emoji)}
              >
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* In-Stream Giving Drawer (Clean, non-intrusive below video) */}
        {showInStreamGiving && (
          <View style={styles.inStreamGivingCard}>
            <View style={styles.inStreamHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="gift" size={15} color={Colors.gold} />
                <Text style={styles.inStreamTitle}>Seed Altar Offering</Text>
              </View>
              <Pressable onPress={() => setShowInStreamGiving(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={18} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Currency Selector */}
            <View style={styles.currencyToggleRow}>
              <Pressable
                style={[styles.currencyBtn, givingCurrency === 'USD' && styles.currencyBtnActive]}
                onPress={() => setGivingCurrency('USD')}
              >
                <Text style={[styles.currencyBtnText, givingCurrency === 'USD' && styles.currencyBtnTextActive]}>USD ($)</Text>
              </Pressable>
              <Pressable
                style={[styles.currencyBtn, givingCurrency === 'ZiG' && styles.currencyBtnActive]}
                onPress={() => setGivingCurrency('ZiG')}
              >
                <Text style={[styles.currencyBtnText, givingCurrency === 'ZiG' && styles.currencyBtnTextActive]}>ZiG</Text>
              </Pressable>
            </View>

            {/* Presets */}
            <View style={styles.presetRow}>
              {[5, 10, 20, 50].map(amt => (
                <Pressable
                  key={amt}
                  style={[styles.presetCard, givingAmount === amt && styles.presetCardActive]}
                  onPress={() => setGivingAmount(amt)}
                >
                  <Text style={[styles.presetText, givingAmount === amt && styles.presetTextActive]}>
                    {givingCurrency === 'USD' ? `$${amt}` : `ZiG ${amt * 15}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Method Row */}
            <View style={styles.gatewayPillRow}>
              {(['EcoCash', 'Innbucks', 'Card'] as const).map(gw => (
                <Pressable
                  key={gw}
                  style={[styles.gwPill, givingGateway === gw && styles.gwPillActive]}
                  onPress={() => setGivingGateway(gw)}
                >
                  <Text style={[styles.gwPillText, givingGateway === gw && styles.gwPillTextActive]}>{gw}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={givingPhone}
              onChangeText={setGivingPhone}
              placeholder="0770000000 (Phone or account)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              style={styles.givingInput}
            />

            <Pressable style={styles.giveDirectBtn} onPress={handleExecuteGiving}>
              <Text style={styles.giveDirectBtnText}>
                Plant Seed • {givingCurrency === 'USD' ? `$${givingAmount} USD` : `ZiG ${givingAmount * 15}`}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Live Decrees & Comments Feed (Screenshot 2) */}
        <View style={styles.commentsContainer}>
          <View style={styles.commentsHeaderRow}>
            <Ionicons name="chatbubbles-outline" size={14} color={Colors.gold} />
            <Text style={styles.commentsTitle}>Live Decrees & Comments</Text>
            <View style={styles.commentsCountBadge}>
              <Text style={styles.commentsCountText}>{decreeMessages.length}</Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 110 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {decreeMessages.slice(-4).map(msg => (
              <View key={msg.id} style={styles.commentRow}>
                <View style={styles.commentHeaderLine}>
                  <Text style={styles.commentAuthor}>{msg.user}</Text>
                  <Text style={styles.commentTime}>{msg.time}</Text>
                </View>
                <Text style={styles.commentBody}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Quick Decree Pills */}
          <View style={styles.quickDecreesPills}>
            {['Amen! 🙏', 'Receiving speed! ⚡', 'Hallelujah! 🙌', 'Grace multiplied! 🔥'].map(pill => (
              <Pressable
                key={pill}
                style={styles.decreePill}
                onPress={() => handleSendDecree(pill)}
              >
                <Text style={styles.decreePillText}>{pill}</Text>
              </Pressable>
            ))}
          </View>

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              value={decreeInput}
              onChangeText={setDecreeInput}
              placeholder="Post a decree or praise while watching..."
              placeholderTextColor={Colors.textMuted}
              style={styles.commentInput}
            />
            <Pressable style={styles.commentSendBtn} onPress={() => handleSendDecree()}>
              <Ionicons name="send" size={14} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={18} color={Colors.warning} />
          <View style={styles.statusCopy}>
            <Text style={styles.offlineBannerTitle}>Offline Mode Active</Text>
            <Text style={styles.offlineBannerBody}>
              Your 66-book Bible, prayers, and downloaded sermons are ready to use.
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions Row */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={onNavigateBible}>
          <View style={styles.quickIconWrap}>
            <Ionicons name="book" size={18} color={Colors.gold} />
          </View>
          <Text style={styles.quickLabel}>Read Bible</Text>
          <Text style={styles.quickSub}>66 Books</Text>
        </Pressable>

        <Pressable style={styles.quickCard} onPress={onNavigateSermons}>
          <View style={styles.quickIconWrap}>
            <Ionicons name="videocam" size={18} color={Colors.gold} />
          </View>
          <Text style={styles.quickLabel}>Sermons</Text>
          <Text style={styles.quickSub}>Audio & Video</Text>
        </Pressable>

        <Pressable style={styles.quickCard} onPress={() => setShowZoomModal(true)}>
          <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(45, 140, 255, 0.15)' }]}>
            <Ionicons name="videocam-outline" size={18} color="#2D8CFF" />
          </View>
          <Text style={styles.quickLabel}>1-on-1 Zoom</Text>
          <Text style={styles.quickSub}>Consultation</Text>
        </Pressable>

        <Pressable style={styles.quickCard} onPress={onNavigateStore}>
          <View style={styles.quickIconWrap}>
            <Ionicons name="heart" size={18} color={Colors.gold} />
          </View>
          <Text style={styles.quickLabel}>Give</Text>
          <Text style={styles.quickSub}>Partner</Text>
        </Pressable>
      </View>

      {/* 1. Daily Bread Card (Clean, elegant scripture of the day with gold quotation styling) */}
      <View style={styles.dailyBreadCard}>
        <View style={styles.dailyBreadHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={14} color={Colors.gold} />
            <Text style={styles.dailyBreadEyebrow}>DAILY BREAD • SCRIPTURE OF THE DAY</Text>
          </View>
          <View style={styles.dailyBreadGoldTag}>
            <Text style={styles.dailyBreadGoldTagText}>TODAY</Text>
          </View>
        </View>

        <View style={styles.dailyBreadQuoteRow}>
          <Text style={styles.dailyBreadQuoteMark}>“</Text>
          <Text style={styles.dailyBreadScripture}>
            Arise, shine; for thy light is come, and the glory of the LORD is risen upon thee.
          </Text>
        </View>

        <Text style={styles.dailyBreadRef}>Isaiah 60:1 (KJV)</Text>

        <Text style={styles.dailyBreadExcerpt} numberOfLines={2}>
          Walk in supernatural dominion today. What looked like a setback was God setting you up for rapid acceleration. You are established in kingdom authority!
        </Text>

        {/* Compact Pro Action Buttons */}
        <View style={styles.dailyBreadActionsRow}>
          <Pressable
            style={[styles.proAmenBtn, dailyBreadLiked && styles.proAmenBtnActive]}
            onPress={() => {
              setDailyBreadLiked(!dailyBreadLiked);
              setDailyBreadLikes(dailyBreadLiked ? dailyBreadLikes - 1 : dailyBreadLikes + 1);
              triggerToast(dailyBreadLiked ? 'Decree unpinned' : '🙏 Amen! Daily Bread received in faith!');
            }}
          >
            <Ionicons
              name={dailyBreadLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={dailyBreadLiked ? '#ef4444' : Colors.gold}
            />
            <Text style={[styles.proAmenBtnText, dailyBreadLiked && { color: '#ef4444' }]}>
              Amen ({dailyBreadLikes})
            </Text>
          </Pressable>

          <Pressable
            style={styles.proShareBtn}
            onPress={() => triggerToast('Scripture copied to share!')}
          >
            <Ionicons name="share-social-outline" size={14} color={Colors.gold} />
            <Text style={styles.proShareBtnText}>Share</Text>
          </Pressable>

          {devotionals.length > 0 ? (
            <Pressable
              style={styles.proReadBtn}
              onPress={() => setActiveDevotional(devotionals[0])}
            >
              <Text style={styles.proReadBtnText}>Read Full</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.textInverse} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 2. Trending Posts / Decrees Feed */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="flame" size={16} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Trending Decrees & Praise</Text>
        </View>
        <Text style={styles.viewAllText}>Community Feed</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
        {TRENDING_DECREES.map(item => {
          const state = decreeLikesState[item.id] || { count: item.initialLikes, liked: false, amened: false };
          return (
            <View key={item.id} style={styles.trendingCard}>
              {/* Clickable avatar + name → navigate to profile */}
              <Pressable
                style={styles.trendingCardTop}
                onPress={() => onNavigateProfile?.()}
              >
                <View style={styles.trendingAvatar}>
                  <Text style={styles.trendingAvatarText}>{item.avatarText}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trendingAuthor, { textDecorationLine: 'underline' }]} numberOfLines={1}>{item.author}</Text>
                  <Text style={styles.trendingBadge}>{item.badgeLabel} • {item.time}</Text>
                </View>
              </Pressable>

              <Text style={styles.trendingText} numberOfLines={3}>{item.text}</Text>

              <View style={styles.trendingBottom}>
                {/* Heart / Amen Toggle */}
                <Pressable
                  style={[styles.trendingLikeBtn, state.liked && { backgroundColor: 'rgba(223,167,50,0.18)', borderColor: 'rgba(223,167,50,0.35)' }]}
                  onPress={() => {
                    const nextLiked = !state.liked;
                    setDecreeLikesState(prev => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        count: nextLiked ? state.count + 1 : state.count - 1,
                        liked: nextLiked,
                      },
                    }));
                    triggerToast(nextLiked ? `🙏 Amen! Agreed with ${item.author} in faith!` : 'Amen removed.');
                  }}
                >
                  <MaterialCommunityIcons
                    name={state.liked ? 'heart' : 'heart-outline'}
                    size={16}
                    color={state.liked ? Colors.gold : Colors.textMuted}
                  />
                  <Text style={[styles.trendingLikeText, state.liked && { color: Colors.gold, fontFamily: Typography.fontBold }]}>
                    {state.count} Amen
                  </Text>
                </Pressable>

                {/* Amen toggle button */}
                <Pressable
                  style={[styles.trendingAmenBtn, state.amened && { backgroundColor: 'rgba(223,167,50,0.18)', borderRadius: 8 }]}
                  onPress={() => {
                    const nextAmened = !state.amened;
                    setDecreeLikesState(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], amened: nextAmened },
                    }));
                    triggerToast(nextAmened ? `🙏 Amen sent to ${item.author}!` : 'Amen removed.');
                  }}
                >
                  <Ionicons
                    name={state.amened ? 'hand-right' : 'chatbubble-ellipses-outline'}
                    size={12}
                    color={state.amened ? Colors.gold : Colors.textMuted}
                  />
                  <Text style={[styles.trendingAmenText, state.amened && { color: Colors.gold }]}>Amen</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 3. Upcoming Kingdom Events */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar" size={16} color={Colors.gold} />
          <Text style={styles.sectionTitle}>Upcoming Services</Text>
        </View>
        <Text style={styles.viewAllText}>Believers Calendar</Text>
      </View>

      <View style={styles.eventsGrid}>
        {UPCOMING_SERVICES.map(ev => {
          const reminded = !!serviceReminders[ev.id];
          return (
            <View key={ev.id} style={styles.upcomingEventCard}>
              <View style={styles.eventIconWrap}>
                <Ionicons name={ev.icon as any} size={18} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.upcomingEventTitle}>{ev.title}</Text>
                  <View style={styles.eventTagPill}>
                    <Text style={styles.eventTagPillText}>{ev.tag}</Text>
                  </View>
                </View>
                <Text style={styles.upcomingEventTime}>{ev.time}</Text>
                <Text style={styles.upcomingEventVenue}>{ev.venue}</Text>
              </View>
              {/* Bell toggles between outline (off) and filled (on) */}
              <Pressable
                style={[styles.proEventRemindBtn, reminded && { backgroundColor: 'rgba(223,167,50,0.2)' }]}
                onPress={() => toggleServiceReminder(ev.id)}
              >
                <Ionicons
                  name={reminded ? 'notifications' : 'notifications-outline'}
                  size={14}
                  color={Colors.gold}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Full Devotional Modal */}
      <Modal visible={!!activeDevotional} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>DAILY APOSTOLIC DEVOTIONAL</Text>
                <Text style={styles.modalDateText}>
                  {String(activeDevotional?.metadata?.date || 'Today')} • Apostle Joe Daniels
                </Text>
              </View>
              <Pressable onPress={() => setActiveDevotional(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{activeDevotional?.title}</Text>

              {activeDevotional?.metadata?.scripture ? (
                <View style={styles.scriptureCard}>
                  <View style={styles.scriptureHeader}>
                    <Ionicons name="book" size={14} color={Colors.gold} />
                    <Text style={styles.scriptureHeaderText}>SCRIPTURE FOCUS</Text>
                  </View>
                  <Text style={styles.scriptureRefText}>
                    {String(activeDevotional.metadata.scripture)}
                  </Text>
                </View>
              ) : null}

              {/* Devotional Full Body */}
              <View style={styles.devotionalBodyContainer}>
                {activeDevotional?.body ? (
                  activeDevotional.body.split('\n\n').map((paragraph, idx) => {
                    const clean = paragraph.trim();
                    if (!clean) return null;
                    const isPrayer = clean.startsWith('Prayer:');
                    const isDeclaration = clean.startsWith('Declaration:');

                    if (isPrayer) {
                      return (
                        <View key={idx} style={styles.prayerCard}>
                          <View style={styles.prayerCardHeader}>
                            <Ionicons name="hand-right" size={14} color={Colors.success} />
                            <Text style={styles.prayerCardTitle}>TODAY'S PRAYER</Text>
                          </View>
                          <Text style={styles.prayerCardText}>
                            {clean.replace(/^Prayer:\s*/, '')}
                          </Text>
                        </View>
                      );
                    }

                    if (isDeclaration) {
                      return (
                        <View key={idx} style={styles.declarationCard}>
                          <View style={styles.declarationCardHeader}>
                            <Ionicons name="flash" size={14} color={Colors.gold} />
                            <Text style={styles.declarationCardTitle}>PROPHETIC DECLARATION</Text>
                          </View>
                          <Text style={styles.declarationCardText}>
                            {clean.replace(/^Declaration:\s*/, '')}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <Text key={idx} style={styles.modalParagraph}>
                        {clean}
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.modalParagraph}>Reading content is loading...</Text>
                )}
              </View>

              <View style={styles.authorBadge}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>JD</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>Apostle Joe Daniels</Text>
                  <Text style={styles.authorTitle}>Gateway Church International</Text>
                </View>
              </View>
            </ScrollView>

            <Pressable style={styles.modalDoneBtn} onPress={() => setActiveDevotional(null)}>
              <Ionicons name="checkmark-done" size={16} color={Colors.textInverse} />
              <Text style={styles.modalDoneBtnText}>Amen • Blessed by this Word</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 1-on-1 Zoom Consultation Modal */}
      <ZoomMeetingModal
        visible={showZoomModal}
        onClose={() => setShowZoomModal(false)}
        profile={profile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  liveToastBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveToastText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  broadcastCard: {
    backgroundColor: '#0a0a0e',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  streamTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#101016',
  },
  streamBroadcasterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apostleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c1a14',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apostleAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  broadcasterHandle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  broadcasterLocation: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
  },
  streamBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  livePulseText: {
    fontFamily: Typography.fontBold,
    color: '#ef4444',
    fontSize: 8,
  },
  audioToggleBtn: {
    padding: 4,
  },
  videoPlayerBox: {
    width: '100%',
    height: 215,
    backgroundColor: '#000000',
    position: 'relative',
  },
  inStreamGivingCard: {
    backgroundColor: '#121622',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    padding: 12,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  seedToggleBtnActive: {
    backgroundColor: 'rgba(223, 167, 50, 0.2)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  inStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inStreamTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  inStreamSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
  },
  currencyToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    padding: 2,
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  currencyBtnActive: {
    backgroundColor: Colors.gold,
  },
  currencyBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 10,
  },
  currencyBtnTextActive: {
    color: Colors.textInverse,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetCardActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  presetText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 10,
  },
  presetTextActive: {
    color: Colors.textInverse,
  },
  gatewayPillRow: {
    flexDirection: 'row',
    gap: 4,
  },
  gwPill: {
    flex: 1,
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingVertical: 4,
    alignItems: 'center',
  },
  gwPillActive: {
    backgroundColor: '#2D8CFF',
  },
  gwPillText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 9,
  },
  gwPillTextActive: {
    color: '#ffffff',
    fontFamily: Typography.fontBold,
  },
  givingInput: {
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: Colors.textPrimary,
    fontSize: 10,
  },
  giveDirectBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  giveDirectBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 11,
  },
  underVideoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#16161e',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCountText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  seedToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seedToggleBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 11,
  },
  shareIconBtn: {
    padding: 4,
  },
  quickReactionsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  emojiReactionBtn: {
    padding: 3,
  },
  commentsContainer: {
    padding: 10,
    gap: 6,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentsTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  commentsCountBadge: {
    backgroundColor: '#1a1a22',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.full,
  },
  commentsCountText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
  },
  commentRow: {
    marginBottom: 6,
  },
  commentHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
  },
  commentTime: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 8,
  },
  commentBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  quickDecreesPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  decreePill: {
    backgroundColor: '#16161e',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  decreePillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 9,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#16161e',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: Radii.md,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    gap: 10,
  },
  offlineBannerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.warning,
    fontSize: 12,
  },
  offlineBannerBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  statusCopy: { flex: 1 },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 10,
    textAlign: 'center',
  },
  quickSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  viewAllText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
  },
  card: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  // Daily Bread Pro Card Styles
  dailyBreadCard: {
    backgroundColor: '#0e121a',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 167, 50, 0.35)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dailyBreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dailyBreadEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  dailyBreadGoldTag: {
    backgroundColor: 'rgba(223, 167, 50, 0.2)',
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  dailyBreadGoldTagText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  dailyBreadQuoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  dailyBreadQuoteMark: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -4,
  },
  dailyBreadScripture: {
    flex: 1,
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  dailyBreadRef: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  dailyBreadExcerpt: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  dailyBreadActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap',
  },
  proAmenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.25)',
  },
  proAmenBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  proAmenBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 10.5,
  },
  proShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161a24',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proShareBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 10.5,
  },
  proReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  proReadBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 10.5,
  },

  // Trending Posts & Decrees
  trendingScroll: {
    marginHorizontal: -4,
  },
  trendingCard: {
    width: 220,
    backgroundColor: '#10141e',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginHorizontal: 4,
    justifyContent: 'space-between',
  },
  trendingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trendingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(223, 167, 50, 0.18)',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  trendingAuthor: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  trendingBadge: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
  },
  trendingText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  trendingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  trendingLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingLikeText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  trendingAmenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingAmenText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
  },

  // Upcoming Events Grid
  eventsGrid: {
    gap: 8,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#10141e',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  eventIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingEventTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  eventTagPill: {
    backgroundColor: 'rgba(223, 167, 50, 0.15)',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eventTagPillText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
  },
  upcomingEventTime: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 10,
    marginTop: 2,
  },
  upcomingEventVenue: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  proEventRemindBtn: {
    padding: 8,
    backgroundColor: '#161a24',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#121216',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.3,
  },
  modalDateText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 10,
  },
  scriptureCard: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 12,
  },
  scriptureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  scriptureHeaderText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  scriptureRefText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  devotionalBodyContainer: {
    gap: 10,
    marginBottom: 14,
  },
  modalParagraph: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  prayerCard: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: Radii.sm,
    padding: 11,
  },
  prayerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  prayerCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  prayerCardText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  declarationCard: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: Radii.sm,
    padding: 11,
  },
  declarationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  declarationCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  declarationCardText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
    lineHeight: 18,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a0a0c',
    padding: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 8,
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    backgroundColor: '#0c1a14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  authorAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
  },
  authorName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  authorTitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  modalDoneBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  modalDoneBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
});
