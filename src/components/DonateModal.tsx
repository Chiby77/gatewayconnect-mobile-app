import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';

interface DonateModalProps {
  visible: boolean;
  onClose: () => void;
  profile: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
}

const PURPOSES = [
  'Altar Seed (Prophetic Covenant)',
  'Building Fund',
  'Missions & Evangelism',
  'Pastoral Support',
  'Media & Technology',
];

const AMOUNTS_USD = [5, 10, 20, 50, 100];
type PayMethod = 'EcoCash' | 'Innbucks' | 'OneMoney' | 'Card';
const METHODS: PayMethod[] = ['EcoCash', 'Innbucks', 'OneMoney', 'Card'];

export function DonateModal({ visible, onClose, profile, onRequestAuth }: DonateModalProps) {
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [amount, setAmount] = useState(20);
  const [phone, setPhone] = useState(profile?.phone || '0770000000');
  const [method, setMethod] = useState<PayMethod>('EcoCash');
  const [purpose, setPurpose] = useState(PURPOSES[0]);

  const zigAmount = amount * 15;
  const displayAmount = currency === 'USD' ? `$${amount} USD` : `ZiG ${zigAmount}`;

  const handleGive = () => {
    if (!profile) {
      onClose();
      onRequestAuth?.('Sign in to plant your altar seed and receive your giving receipt.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Phone Required', `Please enter your ${method} number.`);
      return;
    }
    Alert.alert(
      'Seed Planted on the Altar',
      `Thank you! Your seed of ${displayAmount} for "${purpose}" has been dedicated.\n\nA receipt will be sent to ${phone}.`,
      [{ text: 'Amen', style: 'default', onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="gift" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Give / Tithe</Text>
                <Text style={styles.headerSub}>Plant your altar seed</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Currency Toggle */}
            <View style={styles.currencyRow}>
              {(['USD', 'ZiG'] as const).map(c => (
                <Pressable
                  key={c}
                  style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>
                    {c === 'USD' ? '$ USD' : 'ZiG'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount Presets */}
            <Text style={styles.sectionLabel}>SELECT AMOUNT</Text>
            <View style={styles.amountGrid}>
              {AMOUNTS_USD.map(a => (
                <Pressable
                  key={a}
                  style={[styles.amountCard, amount === a && styles.amountCardActive]}
                  onPress={() => setAmount(a)}
                >
                  <Text style={[styles.amountCardText, amount === a && styles.amountCardTextActive]}>
                    {currency === 'USD' ? `$${a}` : `ZiG ${a * 15}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Purpose */}
            <Text style={styles.sectionLabel}>PURPOSE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PURPOSES.map(p => (
                <Pressable
                  key={p}
                  style={[styles.purposePill, purpose === p && styles.purposePillActive]}
                  onPress={() => setPurpose(p)}
                >
                  <Text style={[styles.purposePillText, purpose === p && styles.purposePillTextActive]}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Payment Method */}
            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
            <View style={styles.methodRow}>
              {METHODS.map(m => (
                <Pressable
                  key={m}
                  style={[styles.methodPill, method === m && styles.methodPillActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodPillText, method === m && styles.methodPillTextActive]}>{m}</Text>
                </Pressable>
              ))}
            </View>

            {/* Phone Input */}
            <Text style={styles.sectionLabel}>PHONE / ACCOUNT</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0770000000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
              <Text style={styles.summaryText}>
                Planting{' '}
                <Text style={{ color: Colors.gold, fontFamily: Typography.fontBold }}>{displayAmount}</Text>
                {' '}via{' '}
                <Text style={{ color: Colors.gold, fontFamily: Typography.fontBold }}>{method}</Text>
                {' '}for{' '}
                <Text style={{ color: Colors.gold }}>{purpose}</Text>.
              </Text>
            </View>

            {/* Give Button */}
            <Pressable style={styles.giveBtn} onPress={handleGive}>
              <Ionicons name="heart" size={16} color="#000" />
              <Text style={styles.giveBtnText}>Plant Seed • {displayAmount}</Text>
            </Pressable>

            {/* Secure note */}
            <View style={styles.secureNote}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.secureNoteText}>Secured via Gateway Church giving portal</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#0e0e14',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(223,167,50,0.3)',
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a2a36',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  headerSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a1a24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    backgroundColor: '#18181f',
    borderRadius: Radii.md,
    padding: 3,
    marginBottom: 20,
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.md - 2,
  },
  currencyBtnActive: { backgroundColor: Colors.gold },
  currencyBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 13,
  },
  currencyBtnTextActive: { color: '#000' },
  sectionLabel: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  amountCard: {
    width: '18%',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  amountCardActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: Colors.gold,
  },
  amountCardText: {
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  amountCardTextActive: { color: Colors.gold },
  purposePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#1a1a24',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 8,
  },
  purposePillActive: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: Colors.gold,
  },
  purposePillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  purposePillTextActive: { color: Colors.gold },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  methodPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1a1a24',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  methodPillActive: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: Colors.gold,
  },
  methodPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  methodPillTextActive: { color: Colors.gold },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    padding: 12,
    marginBottom: 18,
  },
  summaryText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  giveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  giveBtnText: {
    fontFamily: Typography.fontBold,
    color: '#000',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 8,
  },
  secureNoteText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
});
