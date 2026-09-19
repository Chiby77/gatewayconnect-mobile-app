import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { savePrayerRequest, listPrayerRequests, PrayerRequest } from '../data/contentRepository';
import { trackEvent } from '../analytics/analyticsService';

interface PrayerScreenProps {
  profile: MobileUser | null;
}

export function PrayerScreen({ profile }: PrayerScreenProps) {
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerBody, setPrayerBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);

  useEffect(() => {
    setPrayers(listPrayerRequests());
  }, []);

  const handleSave = () => {
    if (!prayerTitle.trim() || !prayerBody.trim()) return;
    savePrayerRequest(profile?.id || null, prayerTitle.trim(), prayerBody.trim());
    setPrayerTitle(''); setPrayerBody('');
    setSaved(true);
    setPrayers(listPrayerRequests());
    trackEvent('prayer_request_saved');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Prayer</Text>

      {/* Submit prayer */}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>NEW PRAYER REQUEST</Text>
        <Text style={styles.cardTitle}>Share your prayer need</Text>
        <Text style={styles.cardBody}>Your request is saved locally and shared with the church when you reconnect.</Text>
        <TextInput
          value={prayerTitle}
          onChangeText={setPrayerTitle}
          placeholder="Prayer title"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={prayerBody}
          onChangeText={setPrayerBody}
          placeholder="Describe your prayer request..."
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <Pressable style={styles.btn} onPress={handleSave}>
          <Ionicons name={saved ? 'checkmark-circle' : 'heart'} size={14} color={Colors.textInverse} />
          <Text style={styles.btnText}>{saved ? 'Submitted!' : 'Submit Prayer'}</Text>
        </Pressable>
      </View>

      {/* Prayer requests list */}
      {prayers.length > 0 && (
        <>
          <Text style={styles.subTitle}>Prayer Wall</Text>
          {prayers.map(p => (
            <View key={p.id} style={styles.prayerCard}>
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={14} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {prayers.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No prayers yet</Text>
          <Text style={styles.emptyBody}>Be the first to share a prayer request with your church community.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
    marginTop: 8,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
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
  input: {
    fontFamily: Typography.fontRegular,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 12,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  prayerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  heartBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
    fontSize: 18,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
