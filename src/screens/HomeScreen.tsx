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
}

export function HomeScreen({ networkStatus, onNavigateBible, onNavigateStore, onNavigateSermons }: HomeScreenProps) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeDevotional, setActiveDevotional] = useState<ContentItem | null>(null);

  useEffect(() => {
    setDevotionals(listContent('devotional'));
    setSermons(listContent('sermon'));
  }, []);

  const isOnline = networkStatus === 'online';

  return (
    <>
      {/* Hero Card */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>YOUR FAITH, AVAILABLE ANYWHERE</Text>
        <Text style={styles.heroTitle}>Read. Reflect.{'\n'}Connect.</Text>
        <Text style={styles.heroBody}>
          Your church library, Bible, community, and prayer life — always with you.
        </Text>
      </View>

      {/* Offline Banner - simple, friendly, only when offline */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color={Colors.warning} />
          <View style={styles.statusCopy}>
            <Text style={styles.offlineBannerTitle}>Offline</Text>
            <Text style={styles.offlineBannerBody}>
              Your Bible, prayers, and saved content are ready to use.
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={onNavigateBible}>
          <Ionicons name="book" size={24} color={Colors.gold} />
          <Text style={styles.quickLabel}>Read Bible</Text>
          <Text style={styles.quickSub}>66 Books</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={onNavigateSermons}>
          <Ionicons name="videocam" size={24} color={Colors.gold} />
          <Text style={styles.quickLabel}>Sermons</Text>
          <Text style={styles.quickSub}>Audio & Video</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={onNavigateStore}>
          <Ionicons name="heart" size={24} color={Colors.gold} />
          <Text style={styles.quickLabel}>Give</Text>
          <Text style={styles.quickSub}>Partner</Text>
        </Pressable>
      </View>

      {/* Today at Gateway */}
      <Text style={styles.sectionTitle}>Today at Gateway</Text>

      {devotionals.length > 0 ? devotionals.slice(0, 2).map(d => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.eyebrow}>DEVOTIONAL • {String(d.metadata?.date || 'TODAY')}</Text>
          <Text style={styles.cardTitle}>{d.title}</Text>
          <Text style={styles.cardBody} numberOfLines={3}>{d.body}</Text>
          <Pressable style={styles.btn} onPress={() => setActiveDevotional(d)}>
            <Text style={styles.btnText}>Read Full Devotional</Text>
          </Pressable>
        </View>
      )) : (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>DEVOTIONAL</Text>
          <Text style={styles.cardTitle}>
            {isOnline ? 'Loading devotionals...' : 'Devotionals'}
          </Text>
          <Text style={styles.cardBody}>
            {isOnline
              ? 'Your church devotionals will appear here shortly.'
              : 'Connect to the internet to load new devotionals from your church.'}
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
                <Text style={[styles.cardBody, { color: Colors.textMuted, marginTop: 4 }]}>
                  Series: {String(s.metadata.series)} • {String(s.metadata?.duration || '40m')}
                </Text>
              ) : null}
              {onNavigateSermons && (
                <Pressable style={styles.btn} onPress={onNavigateSermons}>
                  <Ionicons name="play" size={13} color={Colors.textInverse} />
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
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{activeDevotional?.title}</Text>

              {activeDevotional?.metadata?.scripture ? (
                <View style={styles.scriptureCard}>
                  <View style={styles.scriptureHeader}>
                    <Ionicons name="book" size={16} color={Colors.gold} />
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
                            <Ionicons name="hand-right" size={16} color={Colors.success} />
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
                            <Ionicons name="flash" size={16} color={Colors.gold} />
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
              <Ionicons name="checkmark-done" size={18} color={Colors.textInverse} />
              <Text style={styles.modalDoneBtnText}>Amen • Blessed by this Word</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.forestGreen,
    borderRadius: Radii.xl,
    padding: 24,
    marginTop: 4,
    shadowColor: Colors.forestGreen,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  heroLabel: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
  },
  heroBody: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    gap: 12,
  },
  offlineBannerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.warning,
    fontSize: 14,
  },
  offlineBannerBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statusCopy: { flex: 1 },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  quickSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 6,
  },
  viewAllText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  modalDateText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 19,
    lineHeight: 25,
    marginBottom: 12,
  },
  scriptureCard: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 14,
  },
  scriptureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scriptureHeaderText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  scriptureRefText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  devotionalBodyContainer: {
    gap: 12,
    marginBottom: 16,
  },
  modalParagraph: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  scriptureQuoteCard: {
    backgroundColor: Colors.bg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    padding: 10,
    borderRadius: Radii.sm,
  },
  scriptureQuoteText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  prayerCard: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: Radii.md,
    padding: 14,
  },
  prayerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  prayerCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  prayerCardText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  declarationCard: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: Radii.md,
    padding: 14,
  },
  declarationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  declarationCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  declarationCardText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
    lineHeight: 20,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bg,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  authorAvatarText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  authorName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  authorTitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  modalDoneBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  modalDoneBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
});
