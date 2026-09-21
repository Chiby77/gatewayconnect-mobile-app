import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';

interface ZoomMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  profile: MobileUser | null;
}

const CONSULTATION_TOPICS = [
  'Prophetic Consultation & Prayer',
  'Deliverance & Spiritual Warfare',
  'Marriage & Family Guidance',
  'Business & Marketplace Wealth Impartation',
  'Pastoral & Ministerial Discipleship',
];

const TIME_SLOTS = [
  '09:30 AM CAT (Morning)',
  '02:00 PM CAT (Afternoon)',
  '05:30 PM CAT (Evening)',
];

export function ZoomMeetingModal({ visible, onClose, profile }: ZoomMeetingModalProps) {
  const [fullName, setFullName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || 'Harare, Zimbabwe');
  const [focus, setFocus] = useState(CONSULTATION_TOPICS[0]);
  const [preferredDate, setPreferredDate] = useState('2026-09-22');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [zoomMode, setZoomMode] = useState<'gateway_room' | 'custom_link'>('gateway_room');
  const [customLink, setCustomLink] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const MEETING_ID = '812 3901 9284';
  const PASSCODE = 'GATEWAY';
  const DEFAULT_ZOOM_URL = 'https://zoom.us/j/81239019284?pwd=GATEWAY_CONNECT';

  const handleConfirm = () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter your Full Name and Mobile Phone Number.');
      return;
    }
    setConfirmed(true);
  };

  const handleLaunchZoom = () => {
    const url = zoomMode === 'custom_link' && customLink.trim() ? customLink.trim() : DEFAULT_ZOOM_URL;
    void Linking.openURL(url);
  };

  const handleCopyCredentials = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetAndClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleResetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.zoomIconBadge}>
                <Ionicons name="videocam" size={20} color={Colors.textInverse} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.title}>Zoom Meetings Portal</Text>
                  <View style={styles.oneOnOneBadge}>
                    <Text style={styles.oneOnOneBadgeText}>1-on-1</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>Apostle Joe Daniels consultation request</Text>
              </View>
            </View>
            <Pressable onPress={handleResetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {!confirmed ? (
              <>
                {/* Intro Banner */}
                <View style={styles.introBanner}>
                  <Ionicons name="videocam-outline" size={18} color={Colors.gold} />
                  <Text style={styles.introBannerText}>
                    Connect directly with <Text style={{ fontFamily: Typography.fontBold, color: Colors.textPrimary }}>Apostle Joe Daniels</Text> via our interactive <Text style={{ fontFamily: Typography.fontBold, color: Colors.gold }}>Zoom Meetings Portal</Text>. You can use the official Gateway Zoom room or send your personal Zoom link!
                  </Text>
                </View>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="person-outline" size={14} color={Colors.gold} />
                    <Text style={styles.label}>Your Full Name</Text>
                  </View>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Guest Believer"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                </View>

                {/* Phone Number */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="call-outline" size={14} color={Colors.gold} />
                    <Text style={styles.label}>Phone Number</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="077... or +263..."
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.gold} />
                    <Text style={styles.label}>Location / Country</Text>
                  </View>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Harare, Zimbabwe"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                </View>

                {/* Consultation Focus */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="sparkles-outline" size={14} color={Colors.gold} />
                    <Text style={styles.label}>Consultation Focus</Text>
                  </View>
                  <View style={styles.topicsList}>
                    {CONSULTATION_TOPICS.map(t => (
                      <Pressable
                        key={t}
                        style={[styles.topicChip, focus === t && styles.topicChipActive]}
                        onPress={() => setFocus(t)}
                      >
                        <Text style={[styles.topicChipText, focus === t && styles.topicChipTextActive]} numberOfLines={1}>
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Preferred Date & Time */}
                <View style={styles.rowTwoCols}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
                      <Text style={styles.label}>Preferred Date</Text>
                    </View>
                    <TextInput
                      value={preferredDate}
                      onChangeText={setPreferredDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.gold} />
                      <Text style={styles.label}>Time (CAT)</Text>
                    </View>
                    <TextInput
                      value={timeSlot}
                      onChangeText={setTimeSlot}
                      placeholder="09:30 AM CAT"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Zoom Connection Preference */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="link-outline" size={14} color={Colors.gold} />
                    <Text style={styles.label}>Zoom Connection Preference</Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleBtn, zoomMode === 'gateway_room' && styles.toggleBtnActive]}
                      onPress={() => setZoomMode('gateway_room')}
                    >
                      <Text style={[styles.toggleBtnText, zoomMode === 'gateway_room' && styles.toggleBtnTextActive]}>
                        Gateway Zoom Room
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, zoomMode === 'custom_link' && styles.toggleBtnActive]}
                      onPress={() => setZoomMode('custom_link')}
                    >
                      <Text style={[styles.toggleBtnText, zoomMode === 'custom_link' && styles.toggleBtnTextActive]}>
                        Send My Personal Link
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {zoomMode === 'gateway_room' ? (
                  <View style={styles.roomInfoBanner}>
                    <Text style={styles.roomInfoText}>
                      The system will connect you to Apostle Joe Daniels via official room (ID: <Text style={{ fontFamily: Typography.fontBold, color: Colors.gold }}>812 3901 9284</Text>).
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    value={customLink}
                    onChangeText={setCustomLink}
                    placeholder="Paste your Zoom meeting invite link here..."
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                )}

                {/* Discussion Background */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Brief Discussion Background (Optional)</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Give a brief description of what you wish to discuss..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    style={[styles.input, { minHeight: 65, textAlignVertical: 'top' }]}
                  />
                </View>

                {/* Confirm Button */}
                <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                  <Ionicons name="videocam" size={18} color={Colors.textInverse} />
                  <Text style={styles.confirmBtnText}>Confirm & Enter Zoom Meetings Portal</Text>
                </Pressable>
              </>
            ) : (
              /* Confirmation Success Screen */
              <View style={styles.confirmedContainer}>
                <View style={styles.successIconBadge}>
                  <Ionicons name="checkmark-circle" size={48} color={Colors.gold} />
                </View>
                <Text style={styles.confirmedTitle}>Consultation Session Confirmed!</Text>
                <Text style={styles.confirmedSub}>
                  Your 1-on-1 session with Apostle Joe Daniels has been reserved.
                </Text>

                <View style={styles.credentialsCard}>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Date & Time:</Text>
                    <Text style={styles.credentialValue}>{preferredDate} • {timeSlot}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Focus:</Text>
                    <Text style={styles.credentialValue}>{focus}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Meeting ID:</Text>
                    <Text style={[styles.credentialValue, { color: Colors.gold }]}>{MEETING_ID}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Passcode:</Text>
                    <Text style={[styles.credentialValue, { color: Colors.gold }]}>{PASSCODE}</Text>
                  </View>
                </View>

                <Pressable style={styles.launchBtn} onPress={handleLaunchZoom}>
                  <Ionicons name="open-outline" size={18} color={Colors.textInverse} />
                  <Text style={styles.launchBtnText}>Launch Zoom Meeting Now</Text>
                </Pressable>

                <Pressable style={styles.copyBtn} onPress={handleCopyCredentials}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={Colors.gold} />
                  <Text style={styles.copyBtnText}>{copied ? 'Details Copied!' : 'Copy Meeting Invite'}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0c0c10',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  zoomIconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: '#2D8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  oneOnOneBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  oneOnOneBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
  },
  subtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: Radii.md,
    padding: 10,
  },
  introBannerText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  input: {
    backgroundColor: '#16161e',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    backgroundColor: '#16161e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  topicChipText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  topicChipTextActive: {
    color: Colors.textInverse,
    fontFamily: Typography.fontBold,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#16161e',
    borderRadius: Radii.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.gold,
  },
  toggleBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  toggleBtnTextActive: {
    color: Colors.textInverse,
  },
  roomInfoBanner: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radii.sm,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  roomInfoText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 13,
    marginTop: 6,
  },
  confirmBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  confirmedContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  successIconBadge: {
    marginBottom: 4,
  },
  confirmedTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    textAlign: 'center',
  },
  confirmedSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  credentialsCard: {
    width: '100%',
    backgroundColor: '#16161e',
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  credentialLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  credentialValue: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D8CFF',
    borderRadius: Radii.sm,
    paddingVertical: 13,
    width: '100%',
    marginTop: 6,
  },
  launchBtnText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 13,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16161e',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    width: '100%',
  },
  copyBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
});
