import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput, Animated, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
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

export function HomeScreen({
  networkStatus,
  profile,
  onNavigateBible,
  onNavigateStore,
  onNavigateSermons,
  onNavigateLive,
  onRequestAuth,
}: HomeScreenProps) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeDevotional, setActiveDevotional] = useState<ContentItem | null>(null);

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

          {/* In-Stream Giving Floating Card Overlay (Screenshot 1) */}
          {showInStreamGiving && (
            <View style={styles.inStreamGivingCard}>
              <View style={styles.inStreamHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="gift" size={16} color={Colors.gold} />
                  <Text style={styles.inStreamTitle}>In-Stream Giving</Text>
                </View>
                <Pressable onPress={() => setShowInStreamGiving(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={18} color={Colors.textPrimary} />
                </Pressable>
              </View>
              <Text style={styles.inStreamSub}>Give while stream plays</Text>

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
                placeholder="0770000000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                style={styles.givingInput}
              />

              <Pressable style={styles.giveDirectBtn} onPress={handleExecuteGiving}>
                <Text style={styles.giveDirectBtnText}>
                  Give {givingCurrency === 'USD' ? `USD ${givingAmount}` : `ZiG ${givingAmount * 15}`} Direct
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Under Video Actions Row (Screenshot 2) */}
        <View style={styles.underVideoBar}>
          <Pressable style={styles.likeBtn} onPress={handleLikeBroadcast}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
            <Text style={styles.likeCountText}>{broadcastLikes}</Text>
          </Pressable>

          <Pressable
            style={styles.seedToggleBtn}
            onPress={() => setShowInStreamGiving(!showInStreamGiving)}
          >
            <Ionicons name="gift" size={14} color={Colors.textInverse} />
            <Text style={styles.seedToggleBtnText}>Seed</Text>
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

      {/* Today at Gateway Devotionals */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Today at Gateway</Text>
      </View>

      {devotionals.length > 0 ? devotionals.slice(0, 2).map(d => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.eyebrow}>DEVOTIONAL • {String(d.metadata?.date || 'TODAY')}</Text>
          <Text style={styles.cardTitle}>{d.title}</Text>
          <Text style={styles.cardBody} numberOfLines={3}>{d.body}</Text>
          <Pressable style={styles.btn} onPress={() => setActiveDevotional(d)}>
            <Text style={styles.btnText}>Read Full Devotional</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.textInverse} />
          </Pressable>
        </View>
      )) : (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>DEVOTIONAL</Text>
          <Text style={styles.cardTitle}>Daily Apostolic Devotional</Text>
          <Text style={styles.cardBody}>
            Receive daily prophetic revelations and prayers from Apostle Joe Daniels.
          </Text>
        </View>
      )}

      {/* Recent Sermons list */}
      {sermons.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Sermons</Text>
            {onNavigateSermons && (
              <Pressable onPress={onNavigateSermons}>
                <Text style={styles.viewAllText}>View All →</Text>
              </Pressable>
            )}
          </View>
          {sermons.slice(0, 3).map(s => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.eyebrow}>SERMON{s.metadata?.speaker ? ` • ${String(s.metadata.speaker).toUpperCase()}` : ''}</Text>
              <Text style={styles.cardTitle}>{s.title}</Text>
              {s.body ? <Text style={styles.cardBody} numberOfLines={2}>{s.body}</Text> : null}
              {s.metadata?.series ? (
                <Text style={[styles.cardBody, { color: Colors.textMuted, marginTop: 2 }]}>
                  Series: {String(s.metadata.series)} • {String(s.metadata?.duration || '40m')}
                </Text>
              ) : null}
              {onNavigateSermons && (
                <Pressable style={styles.btn} onPress={onNavigateSermons}>
                  <Ionicons name="play" size={12} color={Colors.textInverse} />
                  <Text style={styles.btnText}>Watch / Listen</Text>
                </Pressable>
              )}
            </View>
          ))}
        </>
      )}

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
    position: 'absolute',
    top: 8,
    right: 8,
    width: 240,
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 10,
    zIndex: 10,
    gap: 6,
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
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 11,
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
