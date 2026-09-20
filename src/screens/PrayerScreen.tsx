import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { savePrayerRequest, listPrayerRequests, PrayerRequest } from '../data/contentRepository';
import { trackEvent } from '../analytics/analyticsService';

interface PrayerScreenProps {
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
}

export function PrayerScreen({ profile, onRequestAuth }: PrayerScreenProps) {
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerBody, setPrayerBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);

  useEffect(() => {
    setPrayers(listPrayerRequests());
  }, []);

  const handleSave = () => {
    if (!profile) {
      if (onRequestAuth) {
        onRequestAuth('Sign in to submit prayer requests so our pastors and intercessors know who we are standing in faith with.');
      } else {
        Alert.alert('Sign In Required', 'Please sign in or create an account to submit prayer requests.');
      }
      return;
    }
    if (!prayerTitle.trim() || !prayerBody.trim()) return;
    savePrayerRequest(profile.id, prayerTitle.trim(), prayerBody.trim());
    setPrayerTitle(''); setPrayerBody('');
    setSaved(true);
    setPrayers(listPrayerRequests());
    trackEvent('prayer_request_saved');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Prayer & Intercession</Text>
        <Text style={styles.sectionSubtitle}>Standing in covenant faith with Gateway sanctuary intercessors</Text>
      </View>

      {/* Submit prayer */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.eyebrow}>NEW PRAYER PETITION</Text>
          <View style={styles.covenantBadge}>
            <Text style={styles.covenantBadgeText}>CONFIDENTIAL</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>Share your prayer request</Text>
        <Text style={styles.cardBody}>Your request is saved locally and delivered to the pastoral prayer team.</Text>

        <TextInput
          value={prayerTitle}
          onChangeText={setPrayerTitle}
          placeholder="Prayer title (e.g. Healing, Family, Career)..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={prayerBody}
          onChangeText={setPrayerBody}
          placeholder="Detail your prayer petition..."
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Pressable style={styles.btn} onPress={handleSave}>
          <Ionicons name={saved ? 'checkmark-circle' : 'heart'} size={14} color={Colors.textInverse} />
          <Text style={styles.btnText}>{saved ? 'Submitted to Altar!' : 'Submit Prayer Request'}</Text>
        </Pressable>
      </View>

      {/* Prayer requests list */}
      {prayers.length > 0 && (
        <View style={styles.wallSection}>
          <View style={styles.wallHeaderRow}>
            <Text style={styles.subTitle}>Prayer Wall</Text>
            <Text style={styles.wallCount}>{prayers.length} petitions active</Text>
          </View>
          {prayers.map(p => (
            <View key={p.id} style={styles.prayerCard}>
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={14} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prayerCardTitle}>{p.title}</Text>
                <Text style={styles.prayerCardBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {prayers.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={38} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No petitions on the wall</Text>
          <Text style={styles.emptyBody}>Be the first to submit a prayer request to the intercessory team.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  pageHeader: {
    marginTop: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 19,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  card: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  covenantBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  covenantBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 2,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  btnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  wallSection: {
    gap: 6,
    marginTop: 4,
  },
  wallHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  wallCount: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  prayerCardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
