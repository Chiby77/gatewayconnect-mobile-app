import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export function LegalModal({ visible, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  const handleOpenWebsite = () => {
    void Linking.openURL('https://bluewavetechnologies.co.zw');
  };

  const handleSendEmail = () => {
    void Linking.openURL('mailto:info@bluewavetechnologies.co.zw?subject=GatewayConnect%20Legal%20Inquiry');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>LEGAL & COMPLIANCE</Text>
              <Text style={styles.title}>
                {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
              onPress={() => setActiveTab('privacy')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={activeTab === 'privacy' ? Colors.gold : Colors.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'privacy' && styles.tabBtnTextActive]}>
                Privacy Policy
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
              onPress={() => setActiveTab('terms')}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={activeTab === 'terms' ? Colors.gold : Colors.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'terms' && styles.tabBtnTextActive]}>
                Terms of Service
              </Text>
            </Pressable>
          </View>

          {/* Content Body */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {activeTab === 'privacy' ? (
              <>
                <Text style={styles.lastUpdated}>Effective Date: September 20, 2026</Text>
                
                <Text style={styles.sectionHeading}>1. Introduction & Developer Identity</Text>
                <Text style={styles.paragraph}>
                  GatewayConnect is the official mobile application of Gateway Church, developed and engineered in partnership with <Text style={styles.boldText}>BlueWave Technologies</Text> (Harare, Zimbabwe). We take your personal data privacy seriously and are committed to protecting all information collected in accordance with data protection principles and Zimbabwean laws.
                </Text>

                <Text style={styles.sectionHeading}>2. Information We Collect</Text>
                <Text style={styles.paragraph}>
                  • <Text style={styles.boldText}>Account Data:</Text> When you register as a member, we collect your name, email address, password hash, and church campus.
                </Text>
                <Text style={styles.paragraph}>
                  • <Text style={styles.boldText}>Community Content:</Text> Testimonies, prayer requests, and comments you choose to post.
                </Text>
                <Text style={styles.paragraph}>
                  • <Text style={styles.boldText}>Giving & Payment Records:</Text> Contribution amounts, chosen fund (Tithe, Offering, Building Fund), currency (USD/ZiG), and payment method (EcoCash, OneMoney, Card). We never store payment PINs or private mobile banking credentials.
                </Text>
                <Text style={styles.paragraph}>
                  • <Text style={styles.boldText}>Device & Offline Storage:</Text> The app caches Scripture, devotionals, and downloaded sermons locally in SQLite on your device for offline reading without data.
                </Text>

                <Text style={styles.sectionHeading}>3. How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                  Your data is used solely for facilitating church ministry, delivering apostolic devotionals, processing voluntary donations, enabling community fellowship, and delivering offline media. We do not sell, rent, or commercialize your personal data to any third parties.
                </Text>

                <Text style={styles.sectionHeading}>4. Data Security & Storage</Text>
                <Text style={styles.paragraph}>
                  All network communication is encrypted using Industry-Standard TLS/HTTPS protocols. User credentials and secure tokens are stored in hardware-backed secure storage.
                </Text>

                <Text style={styles.sectionHeading}>5. Technical Provider Contact</Text>
                <Text style={styles.paragraph}>
                  For data requests, corrections, or privacy questions, contact our technology partner:
                </Text>
                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>BlueWave Technologies</Text>
                  <Pressable onPress={handleOpenWebsite} style={styles.contactRow}>
                    <Ionicons name="globe-outline" size={16} color={Colors.gold} />
                    <Text style={styles.contactLink}>bluewavetechnologies.co.zw</Text>
                  </Pressable>
                  <Pressable onPress={handleSendEmail} style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={16} color={Colors.gold} />
                    <Text style={styles.contactLink}>info@bluewavetechnologies.co.zw</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lastUpdated}>Effective Date: September 20, 2026</Text>

                <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                  By downloading, accessing, or using GatewayConnect, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue use of the application.
                </Text>

                <Text style={styles.sectionHeading}>2. Community Standards & Conduct</Text>
                <Text style={styles.paragraph}>
                  GatewayConnect is a sacred space for Christian fellowship, prayer, and apostolic edification. Users agree not to post defamatory, obscene, offensive, commercial, or deceptive content. The church leadership reserves the right to moderate or remove content that violates these guidelines.
                </Text>

                <Text style={styles.sectionHeading}>3. Intellectual Property</Text>
                <Text style={styles.paragraph}>
                  All sermons, video and audio broadcasts, devotional writings, logos, and materials by Apostle Joe Daniels and Gateway Church are protected by copyright. Content downloaded for offline use is licensed strictly for personal spiritual study and non-commercial edification.
                </Text>

                <Text style={styles.sectionHeading}>4. Donations & Giving Policy</Text>
                <Text style={styles.paragraph}>
                  All financial contributions, tithes, and offerings made via EcoCash, OneMoney, or Card are voluntary charitable contributions to the ministry of Gateway Church. Due to immediate allocation to ministry projects, contributions are non-refundable.
                </Text>

                <Text style={styles.sectionHeading}>5. App Development & Disclaimer</Text>
                <Text style={styles.paragraph}>
                  GatewayConnect is engineered and maintained by <Text style={styles.boldText}>BlueWave Technologies</Text>. While we endeavor to provide 100% reliable offline and online availability, the software is provided on an "as-is" and "as-available" basis without warranties of uninterrupted uptime.
                </Text>

                <Text style={styles.sectionHeading}>6. Governing Law</Text>
                <Text style={styles.paragraph}>
                  These terms shall be governed by and construed in accordance with the substantive laws of the Republic of Zimbabwe.
                </Text>

                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>BlueWave Technologies</Text>
                  <Pressable onPress={handleOpenWebsite} style={styles.contactRow}>
                    <Ionicons name="globe-outline" size={16} color={Colors.gold} />
                    <Text style={styles.contactLink}>bluewavetechnologies.co.zw</Text>
                  </Pressable>
                  <Pressable onPress={handleSendEmail} style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={16} color={Colors.gold} />
                    <Text style={styles.contactLink}>info@bluewavetechnologies.co.zw</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Close */}
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Understood & I Agree</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: Radii.lg,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.forestGreen,
  },
  tabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 13,
  },
  tabBtnTextActive: {
    color: Colors.gold,
  },
  content: {
    paddingVertical: 14,
    gap: 8,
  },
  lastUpdated: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  sectionHeading: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
    marginTop: 10,
  },
  paragraph: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  boldText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
  },
  contactCard: {
    backgroundColor: Colors.bg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  contactTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLink: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  doneBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
});
