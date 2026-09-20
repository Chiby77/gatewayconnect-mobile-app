import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { NetworkStatus } from '../network/networkStatus';
import { SyncState } from '../sync/syncStatus';
import { listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';

interface HomeScreenProps {
  networkStatus: NetworkStatus;
  pendingMutations: number;
  syncState: SyncState;
  onNavigateBible: () => void;
  onNavigateStore: () => void;
  onNavigateSermons?: () => void;
  onNavigateLive?: () => void;
}

export function HomeScreen({
  networkStatus,
  onNavigateBible,
  onNavigateStore,
  onNavigateSermons,
  onNavigateLive,
}: HomeScreenProps) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeDevotional, setActiveDevotional] = useState<ContentItem | null>(null);

  useEffect(() => {
    setDevotionals(listContent('devotional'));
    setSermons(listContent('sermon'));
  }, []);

  const isOnline = networkStatus === 'online';

  return (
    <View style={styles.container}>
      {/* Hero Card - Sleek, Inspiring, Compact */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>GATEWAY CHURCH INTERNATIONAL</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>HARARE • GLOBAL</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Read. Reflect. Connect.</Text>
        <Text style={styles.heroBody}>
          Your church sermons, offline Bible, apostolic devotionals, and prayer life.
        </Text>
      </View>

      {/* Watch Live Banner */}
      {onNavigateLive && (
        <Pressable style={styles.liveBanner} onPress={onNavigateLive}>
          <View style={styles.liveBannerLeft}>
            <View style={styles.livePulseDot} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.liveBannerEyebrow}>LIVE BROADCAST</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>ON AIR</Text>
                </View>
              </View>
              <Text style={styles.liveBannerTitle}>Watch Apostolic Live Broadcast</Text>
              <Text style={styles.liveBannerSub}>Stream Sunday & Midweek services directly inside the APK</Text>
            </View>
          </View>
          <View style={styles.livePlayIconWrap}>
            <Ionicons name="play" size={14} color={Colors.textInverse} />
          </View>
        </Pressable>
      )}

      {/* Offline Banner - simple, friendly, only when offline */}
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

      {/* Quick Actions */}
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
        <Pressable style={styles.quickCard} onPress={onNavigateStore}>
          <View style={styles.quickIconWrap}>
            <Ionicons name="heart" size={18} color={Colors.gold} />
          </View>
          <Text style={styles.quickLabel}>Give</Text>
          <Text style={styles.quickSub}>Partner</Text>
        </Pressable>
      </View>

      {/* Today at Gateway */}
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
          <Text style={styles.cardTitle}>
            {isOnline ? 'Loading devotionals...' : 'Daily Apostolic Devotional'}
          </Text>
          <Text style={styles.cardBody}>
            {isOnline
              ? 'Your church devotionals will appear here shortly.'
              : 'Connect to the internet to load new devotionals from Apostle Joe Daniels.'}
          </Text>
        </View>
      )}

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
                    const isScripture = clean.startsWith('Scripture:');
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

                    if (isScripture) {
                      return (
                        <View key={idx} style={styles.scriptureQuoteCard}>
                          <Text style={styles.scriptureQuoteText}>
                            {clean.replace(/^Scripture:\s*/, '')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hero: {
    backgroundColor: '#0c1a14',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroLabel: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  heroPillText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
  },
  heroBody: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  liveBanner: {
    backgroundColor: '#0e0e13',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  liveBannerEyebrow: {
    fontFamily: Typography.fontBold,
    color: '#ef4444',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  liveBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.sm,
  },
  liveBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#ef4444',
    fontSize: 8,
  },
  liveBannerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
    marginTop: 1,
  },
  liveBannerSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  livePlayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    paddingVertical: 11,
    paddingHorizontal: 6,
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
    fontSize: 11,
    textAlign: 'center',
  },
  quickSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
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
    fontSize: 16,
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
  scriptureQuoteCard: {
    backgroundColor: '#0a0a0c',
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    padding: 8,
    borderRadius: Radii.sm,
  },
  scriptureQuoteText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
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
