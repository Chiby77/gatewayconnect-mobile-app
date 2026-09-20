import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser, signIn, signUp, signOut } from '../auth/authService';
import { SettingsRepository } from '../settings/settingsRepository';
import { trackEvent } from '../analytics/analyticsService';
import { BibleRepository } from '../bible/bibleRepository';
import { listDownloads, deleteDownload, MediaDownload } from '../media/downloadManager';
import { listPrayerRequests, PrayerRequest } from '../data/contentRepository';

interface ProfileScreenProps {
  profile: MobileUser | null;
  onGuest: () => void;
  onNavigateBible?: () => void;
}

export function ProfileScreen({ profile, onNavigateBible }: ProfileScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [lowData, setLowData] = useState(SettingsRepository.getLowDataMode());
  const [analytics, setAnalytics] = useState(SettingsRepository.getAnalyticsOptIn());

  // Profile active subtab
  const [activeTab, setActiveTab] = useState<'saved' | 'downloads' | 'prayers' | 'settings'>('saved');

  // User content stats
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<MediaDownload[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile?.name || 'Tinodaishe Chibi');
  const [editBio, setEditBio] = useState('Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
  const [editLocation, setEditLocation] = useState('Harare, Zimbabwe');

  const refreshData = () => {
    setBookmarks(BibleRepository.listBookmarks(profile?.id || null));
    setDownloads(listDownloads());
    setPrayers(listPrayerRequests());
  };

  useEffect(() => {
    refreshData();
  }, [profile]);

  const handleLowDataToggle = () => {
    const next = !lowData;
    SettingsRepository.setLowDataMode(next);
    setLowData(next);
    trackEvent('toggled_low_data_mode', { enabled: next });
  };

  const handleAnalyticsToggle = () => {
    const next = !analytics;
    SettingsRepository.setAnalyticsOptIn(next);
    setAnalytics(next);
    if (next) trackEvent('analytics_enabled');
  };

  const authenticate = async (create: boolean) => {
    try {
      setError('');
      if (!email.trim()) { setError('Please enter your email address.'); return; }
      if (!password.trim()) { setError('Please enter your password.'); return; }
      const next = create
        ? await signUp(email, password, name.trim() || 'Gateway Member')
        : await signIn(email, password);
      setError(`Welcome, ${next.name}! ✓`);
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : 'Something went wrong. Please try again.';
      if (msg.includes('Invalid login')) setError('Incorrect email or password. Please try again.');
      else if (msg.includes('already registered')) setError('This email is already registered. Try signing in instead.');
      else if (msg.includes('not configured')) setError('Authentication is not available in this build.');
      else setError(msg);
    }
  };

  return (
    <>
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Account & Profile</Text>
        {profile && (
          <Pressable style={styles.editBtn} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={16} color={Colors.gold} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Member Profile Hero Card */}
      <View style={styles.profileHero}>
        <View style={styles.heroTop}>
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={32} color={Colors.gold} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>
                {profile ? 'COVENANT MEMBER' : 'GUEST / VISITOR'}
              </Text>
              <View style={styles.memberIdPill}>
                <Text style={styles.memberIdText}>GCZ-MEM-082</Text>
              </View>
            </View>
            <Text style={styles.userName}>{profile?.name || editName}</Text>
            <Text style={styles.userHandle}>@{profile?.name?.toLowerCase().replace(/\s+/g, '_') || 'tinodaishe_chibi'}</Text>
          </View>
        </View>

        <Text style={styles.userBio}>{editBio}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={Colors.gold} />
          <Text style={styles.locationText}>{editLocation}</Text>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statItem} onPress={() => setActiveTab('saved')}>
            <Text style={styles.statNumber}>{bookmarks.length}</Text>
            <Text style={styles.statLabel}>Saved Verses</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => setActiveTab('downloads')}>
            <Text style={styles.statNumber}>{downloads.length}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => setActiveTab('prayers')}>
            <Text style={styles.statNumber}>{prayers.length}</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </Pressable>
        </View>
      </View>

      {/* Profile Section Tabs */}
      <View style={styles.tabNav}>
        <Pressable
          style={[styles.tabNavItem, activeTab === 'saved' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons name="bookmark" size={14} color={activeTab === 'saved' ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.tabNavText, activeTab === 'saved' && styles.tabNavTextActive]}>Saved Verses</Text>
        </Pressable>
        <Pressable
          style={[styles.tabNavItem, activeTab === 'downloads' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('downloads')}
        >
          <Ionicons name="cloud-download" size={14} color={activeTab === 'downloads' ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.tabNavText, activeTab === 'downloads' && styles.tabNavTextActive]}>Downloads</Text>
        </Pressable>
        <Pressable
          style={[styles.tabNavItem, activeTab === 'prayers' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('prayers')}
        >
          <Ionicons name="heart" size={14} color={activeTab === 'prayers' ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.tabNavText, activeTab === 'prayers' && styles.tabNavTextActive]}>My Prayers</Text>
        </Pressable>
        <Pressable
          style={[styles.tabNavItem, activeTab === 'settings' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons name="settings-sharp" size={14} color={activeTab === 'settings' ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.tabNavText, activeTab === 'settings' && styles.tabNavTextActive]}>Settings</Text>
        </Pressable>
      </View>

      {/* Tab 1: Saved Verses */}
      {activeTab === 'saved' && (
        <View style={styles.sectionContainer}>
          {bookmarks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={38} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No saved verses yet</Text>
              <Text style={styles.emptyBody}>
                Tap the star icon on any Bible verse to bookmark it for quick access and meditation.
              </Text>
              {onNavigateBible && (
                <Pressable style={styles.actionBtn} onPress={onNavigateBible}>
                  <Text style={styles.actionBtnText}>Open Bible Reader</Text>
                </Pressable>
              )}
            </View>
          ) : (
            bookmarks.map(bm => (
              <View key={bm} style={styles.savedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedTitle}>{bm}</Text>
                  <Text style={styles.savedSubtitle}>Saved to your personal offline meditation library</Text>
                </View>
                <Pressable
                  onPress={() => {
                    BibleRepository.toggleBookmark(profile?.id || null, 'KJV', bm);
                    refreshData();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 2: Offline Downloads */}
      {activeTab === 'downloads' && (
        <View style={styles.sectionContainer}>
          {downloads.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cloud-download-outline" size={38} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No offline media downloaded</Text>
              <Text style={styles.emptyBody}>
                Download sermons and audio messages to listen anywhere without internet or data usage.
              </Text>
            </View>
          ) : (
            downloads.map(dl => (
              <View key={dl.id} style={styles.savedCard}>
                <Ionicons name="musical-notes" size={20} color={Colors.gold} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.savedTitle}>{dl.content_id}</Text>
                  <Text style={styles.savedSubtitle}>Offline Ready • Full Apostolic Audio</Text>
                </View>
                <Pressable
                  onPress={async () => {
                    await deleteDownload(dl.content_id);
                    refreshData();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 3: My Prayers */}
      {activeTab === 'prayers' && (
        <View style={styles.sectionContainer}>
          {prayers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="heart-outline" size={38} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No prayer requests yet</Text>
              <Text style={styles.emptyBody}>
                Submit your prayer needs in the Prayer tab. They are saved securely on your device.
              </Text>
            </View>
          ) : (
            prayers.map(p => (
              <View key={p.id} style={styles.prayerCard}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerTitle}>{p.title}</Text>
                  <View style={styles.prayerBadge}>
                    <Text style={styles.prayerBadgeText}>✓ SUBMITTED</Text>
                  </View>
                </View>
                <Text style={styles.prayerBody}>{p.body}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 4: Settings */}
      {activeTab === 'settings' && (
        <View style={styles.sectionContainer}>
          {!profile && (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>SIGN IN / REGISTER</Text>
              <Text style={styles.cardTitle}>Connect your Gateway Account</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name (for new account)"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              <View style={styles.authRow}>
                <Pressable style={styles.btn} onPress={() => authenticate(false)}>
                  <Text style={styles.btnText}>Sign In</Text>
                </Pressable>
                <Pressable style={styles.btnOutline} onPress={() => authenticate(true)}>
                  <Text style={styles.btnOutlineText}>Create Account</Text>
                </Pressable>
              </View>
              {error ? (
                <Text style={[styles.cardBody, { color: error.startsWith('Welcome') ? Colors.success : Colors.danger, marginTop: 12 }]}>
                  {error}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Low-Data Mode</Text>
                <Text style={styles.cardBody}>Saves mobile data by reducing media downloads.</Text>
              </View>
              <Switch
                value={lowData}
                onValueChange={handleLowDataToggle}
                trackColor={{ false: Colors.bgSecondary, true: Colors.goldMuted }}
                thumbColor={lowData ? Colors.gold : Colors.textMuted}
              />
            </View>

            <View style={[styles.settingRow, { marginTop: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Analytics</Text>
                <Text style={styles.cardBody}>Share anonymous usage data to help us improve.</Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={handleAnalyticsToggle}
                trackColor={{ false: Colors.bgSecondary, true: Colors.goldMuted }}
                thumbColor={analytics ? Colors.gold : Colors.textMuted}
              />
            </View>
          </View>

          {profile && (
            <Pressable
              style={styles.btnDanger}
              onPress={() => {
                void signOut();
                trackEvent('sign_out');
              }}
            >
              <Ionicons name="log-out-outline" size={16} color={Colors.danger} />
              <Text style={styles.btnDangerText}>Sign Out of GatewayConnect</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Bio / Testimony</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Your bio..."
              placeholderTextColor={Colors.textMuted}
              multiline
              style={[styles.input, { minHeight: 70 }]}
            />

            <Text style={styles.inputLabel}>Location / Cell Hub</Text>
            <TextInput
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="City, Country"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />

            <Pressable
              style={styles.saveBtn}
              onPress={() => {
                setShowEditModal(false);
                Alert.alert('Profile Updated', 'Your profile details have been saved.');
              }}
            >
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
  profileHero: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  badgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  memberIdPill: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  memberIdText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
  },
  userName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  userHandle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  userBio: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  statNumber: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 17,
  },
  statLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  tabNavItemActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  tabNavText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
  },
  tabNavTextActive: {
    color: Colors.gold,
  },
  sectionContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  savedSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  prayerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  prayerBadge: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  prayerBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.success,
    fontSize: 9,
  },
  prayerBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  actionBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  actionBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.bgMuted,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 6,
  },
  inputLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    marginTop: 10,
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnOutlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 14,
  },
  btnDangerText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.danger,
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
});
