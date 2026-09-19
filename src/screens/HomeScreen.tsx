import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
}

export function HomeScreen({ networkStatus, pendingMutations, syncState, onNavigateBible, onNavigateStore }: HomeScreenProps) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  const [sermons, setSermons] = useState<ContentItem[]>([]);

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
          <Ionicons name="book" size={26} color={Colors.gold} />
          <Text style={styles.quickLabel}>Read Bible</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={onNavigateStore}>
          <Ionicons name="heart" size={26} color={Colors.gold} />
          <Text style={styles.quickLabel}>Give</Text>
        </Pressable>
        <View style={styles.quickCard}>
          <Ionicons name="radio" size={26} color={isOnline ? Colors.gold : Colors.textMuted} />
          <Text style={styles.quickLabel}>Live</Text>
          <Text style={styles.quickSub}>{isOnline ? 'Available' : 'Offline'}</Text>
        </View>
      </View>

      {/* Today at Gateway */}
      <Text style={styles.sectionTitle}>Today at Gateway</Text>

      {devotionals.length > 0 ? devotionals.slice(0, 2).map(d => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.eyebrow}>DEVOTIONAL</Text>
          <Text style={styles.cardTitle}>{d.title}</Text>
          <Text style={styles.cardBody} numberOfLines={3}>{d.body}</Text>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Read Devotional</Text>
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
          <Text style={styles.sectionTitle}>Recent Sermons</Text>
          {sermons.slice(0, 3).map(s => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.eyebrow}>SERMON{s.metadata?.speaker ? ` • ${String(s.metadata.speaker)}` : ''}</Text>
              <Text style={styles.cardTitle}>{s.title}</Text>
              {s.body ? <Text style={styles.cardBody} numberOfLines={2}>{s.body}</Text> : null}
              {s.metadata?.series ? (
                <Text style={[styles.cardBody, { color: Colors.textMuted, marginTop: 4 }]}>
                  Series: {String(s.metadata.series)}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.forestGreen,
    borderRadius: Radii.xl,
    padding: 28,
    marginTop: 8,
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
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
  },
  heroBody: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    gap: 14,
  },
  offlineBannerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.warning,
    fontSize: 15,
  },
  offlineBannerBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  statusCopy: { flex: 1 },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    alignItems: 'center',
    gap: 6,
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
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
});
