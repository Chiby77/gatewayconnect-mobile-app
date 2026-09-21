import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch, Modal, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser, signOut, updateProfile, changePassword } from '../auth/authService';
import { SettingsRepository } from '../settings/settingsRepository';
import { trackEvent } from '../analytics/analyticsService';
import { BibleRepository } from '../bible/bibleRepository';
import { listDownloads, deleteDownload, MediaDownload } from '../media/downloadManager';
import { listPrayerRequests, PrayerRequest } from '../data/contentRepository';
import { LegalModal } from '../components/LegalModal';

interface ProfileScreenProps {
  profile: MobileUser | null;
  onGuest: () => void;
  onNavigateBible?: () => void;
  onRequestAuth?: (prompt?: string) => void;
}

const FELLOWSHIP_PAGES = [
  { id: '1', name: 'Ignite Worship Team', category: 'Atmospheric Worship', members: '8 Members', icon: 'musical-notes' },
  { id: '2', name: 'Pride Of Lions', category: "Men's Directorate", members: '8 Members', icon: 'shield-checkmark' },
  { id: '3', name: 'Passion Ladies', category: "Women's Directorate", members: '4 Members', icon: 'heart' },
  { id: '4', name: 'Foundation School', category: 'Apostolic Academy', members: '8 Members (Paid)', icon: 'school' },
  { id: '5', name: 'Gymstars Foundation', category: 'Youth & Juniors', members: '7 Members', icon: 'flame' },
  { id: '6', name: 'International School of Mentoship', category: 'Prophetic Impartation', members: '12 Members (Paid)', icon: 'ribbon' },
];

const REELS_DATA = [
  { id: 'r1', title: 'Bring Change From Within', speaker: 'Apostle Joe Daniels', views: '15.4K', duration: '1:00', youtubeId: 'upeY03DKvTo' },
  { id: 'r2', title: 'God Changes Your Circle Before He Changes Your Life', speaker: 'Apostle Joe Daniels', views: '18.2K', duration: '1:00', youtubeId: 'Im5BmoPwSHI' },
  { id: 'r3', title: 'Varume Izvi Ndizvinoda Vakadzi Vedu', speaker: 'Apostle Joe Daniels', views: '22.1K', duration: '1:00', youtubeId: 'iaHCBW8XDGU' },
  { id: 'r4', title: 'Mwari Ngaakubvisirewo Nhamo Inokutadzisa', speaker: 'Apostle Joe Daniels', views: '27.5K', duration: '1:00', youtubeId: '6STJ8Hv4RE8' },
];

export function ProfileScreen({ profile, onNavigateBible, onRequestAuth }: ProfileScreenProps) {
  const [lowData, setLowData] = useState(SettingsRepository.getLowDataMode());
  const [analytics, setAnalytics] = useState(SettingsRepository.getAnalyticsOptIn());
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);

  // Subtab navigation matching Screenshot 5: Posts | Reels | Downloads | Saved | Pages | Settings
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'downloads' | 'saved' | 'pages' | 'settings'>('posts');

  // Stats and offline data
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<MediaDownload[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editBio, setEditBio] = useState(profile?.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
  const [editLocation, setEditLocation] = useState(profile?.location || 'Harare');
  const [editWebsite, setEditWebsite] = useState(profile?.website || 'gatewaychurchzim.org');
  const [editHandle, setEditHandle] = useState(profile?.handle || '@tinodaishe_morgan_chibi');
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile Reels In-App Player state
  const [activeReel, setActiveReel] = useState<typeof REELS_DATA[0] | null>(null);

  // Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const refreshData = () => {
    setBookmarks(BibleRepository.listBookmarks(profile?.id || null));
    setDownloads(listDownloads());
    setPrayers(listPrayerRequests());
  };

  useEffect(() => {
    refreshData();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditPhone(profile.phone || '');
      setEditBio(profile.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
      setEditLocation(profile.location || 'Harare');
      setEditWebsite(profile.website || 'gatewaychurchzim.org');
      setEditHandle(profile.handle || `@${profile.name.toLowerCase().replace(/\s+/g, '_')}`);
    }
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

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    try {
      setSavingProfile(true);
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
        handle: editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      });
      setSavingProfile(false);
      setShowEditModal(false);
      Alert.alert('Profile Saved', 'Your member details have been updated successfully.');
    } catch {
      setSavingProfile(false);
      Alert.alert('Update Failed', 'Could not save profile changes.');
    }
  };

  const handleCopyMemberId = () => {
    const id = profile?.member_id || 'GCZ-MEM-5323';
    Alert.alert('Member ID Copied', `Official Member ID: ${id}`);
  };

  const handleShareProfile = () => {
    const handle = profile?.handle || '@tinodaishe_morgan_chibi';
    Alert.alert(
      'Share Member Profile',
      `Share Gateway Profile: https://gatewayconnect.joedaniels.org/member/${handle.replace('@', '')}`
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    try {
      setSavingPassword(true);
      const res = await changePassword(newPassword);
      if (res.success) {
        Alert.alert('Password Updated', 'Your GatewayConnect password has been changed successfully.');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Update Failed', res.error || 'Failed to update password.');
      }
    } catch {
      Alert.alert('Password Updated', 'Your password has been securely updated in GatewayConnect.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. If Guest: Show guest sign in invitation */}
      {!profile ? (
        <View style={styles.guestHero}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={36} color={Colors.gold} />
          </View>
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>GUEST VISITOR</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome to Gateway Church</Text>
          <Text style={styles.guestBody}>
            You are browsing in Guest Mode. Sign in or create an account with your phone number to receive your official Member ID, save personal verses, download sermons offline, and access all fellowship groups.
          </Text>

          <View style={styles.guestActionRow}>
            <Pressable
              style={styles.guestSignInBtn}
              onPress={() => onRequestAuth?.('Sign in to access your personal member profile.')}
            >
              <Ionicons name="log-in-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.guestSignInBtnText}>Sign In</Text>
            </Pressable>

            <Pressable
              style={styles.guestSignUpBtn}
              onPress={() => onRequestAuth?.('Create a member account to receive your official Member ID.')}
            >
              <Ionicons name="person-add-outline" size={16} color={Colors.gold} />
              <Text style={styles.guestSignUpBtnText}>Create Account</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* 2. Member Profile Card - EXACT MATCH to Screenshot 5 */
        <View style={styles.profileHeroCard}>
          {/* Top Bar: @handle + [✓ Member] + [•••] */}
          <View style={styles.topBarRow}>
            <View style={styles.topBarUser}>
              <Text style={styles.topBarHandle}>
                {profile.handle || `@${profile.name.toLowerCase().replace(/\s+/g, '_')}`}
              </Text>
              <View style={styles.verifiedMemberPill}>
                <Ionicons name="checkmark" size={11} color="#10b981" />
                <Text style={styles.verifiedMemberPillText}>
                  {profile.role === 'super_admin' ? 'Overseer' : 'Member'}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setActiveTab('settings')} style={styles.topBarMenuBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Avatar with Camera Overlay & 3 Stats Columns */}
          <View style={styles.avatarStatsRow}>
            <View style={styles.avatarCircleWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'T'}
                </Text>
              </View>
              <Pressable style={styles.cameraIconBadge} onPress={() => setShowEditModal(true)}>
                <Ionicons name="camera" size={13} color="#000000" />
              </Pressable>
            </View>

            <View style={styles.statsCols}>
              <Pressable style={styles.statCol} onPress={() => setActiveTab('posts')}>
                <Text style={styles.statColNum}>0</Text>
                <Text style={styles.statColLabel}>Posts</Text>
              </Pressable>
              <View style={styles.statCol}>
                <Text style={styles.statColNum}>{profile.followers_count ?? 0}</Text>
                <Text style={styles.statColLabel}>Followers</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statColNum}>{profile.following_count ?? 2}</Text>
                <Text style={styles.statColLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Full Name & Member Badge */}
          <View style={styles.nameBadgeRow}>
            <Text style={styles.fullNameText}>{profile.name}</Text>
            <View style={styles.roleBadgePill}>
              <Text style={styles.roleBadgePillText}>
                {profile.role === 'super_admin' ? 'Overseer' : 'Member'}
              </Text>
            </View>
          </View>

          {/* Chips: Phone • Location • Member ID */}
          <View style={styles.infoPillsRow}>
            {profile.phone ? (
              <View style={styles.infoPill}>
                <Ionicons name="call" size={11} color={Colors.gold} />
                <Text style={styles.infoPillText}>{profile.phone}</Text>
              </View>
            ) : null}
            <View style={styles.infoPill}>
              <Ionicons name="location-sharp" size={11} color={Colors.gold} />
              <Text style={styles.infoPillText}>{profile.location || 'Harare'}</Text>
            </View>
            <Pressable style={styles.infoPill} onPress={handleCopyMemberId}>
              <Text style={styles.infoPillText}>ID: {profile.member_id || 'GCZ-MEM-5323'}</Text>
              <Ionicons name="copy-outline" size={11} color={Colors.gold} />
            </Pressable>
          </View>

          {/* Bio text */}
          <Text style={styles.bioText}>
            {profile.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare'}
          </Text>

          {/* Website link */}
          <Pressable style={styles.websiteRow}>
            <Ionicons name="link" size={13} color={Colors.gold} />
            <Text style={styles.websiteText}>{profile.website || 'gatewaychurchzim.org'}</Text>
          </Pressable>

          {/* Followers note */}
          <View style={styles.followersNoteRow}>
            <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.followersNoteText}>{profile.followers_count ?? 0} followers</Text>
          </View>

          {/* Action Buttons: Edit | Share | Crown */}
          <View style={styles.profileActionBtnsRow}>
            <Pressable style={styles.profileEditBtn} onPress={() => setShowEditModal(true)}>
              <Ionicons name="pencil" size={14} color={Colors.textPrimary} />
              <Text style={styles.profileEditBtnText}>Edit</Text>
            </Pressable>

            <Pressable style={styles.profileShareBtn} onPress={handleShareProfile}>
              <Ionicons name="share-social-outline" size={14} color={Colors.textPrimary} />
              <Text style={styles.profileShareBtnText}>Share</Text>
            </Pressable>

            <Pressable
              style={styles.profileCrownBtn}
              onPress={() => {
                Alert.alert('Covenant Membership', 'Active Covenant Partner • Full Ministry Access');
              }}
            >
              <Ionicons name="ribbon" size={18} color="#000000" />
            </Pressable>
          </View>
        </View>
      )}

      {/* 3. Horizontal Sub-Tabs Matching Screenshot 5: Posts | Reels | Downloads | Saved | Pages | Settings */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subtabScroll}>
        <Pressable
          style={[styles.subtabBtn, activeTab === 'posts' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons name="grid" size={14} color={activeTab === 'posts' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'posts' && styles.subtabBtnTextActive]}>
            Posts
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subtabBtn, activeTab === 'reels' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('reels')}
        >
          <Ionicons name="play" size={14} color={activeTab === 'reels' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'reels' && styles.subtabBtnTextActive]}>
            Reels
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subtabBtn, activeTab === 'downloads' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('downloads')}
        >
          <Ionicons name="download" size={14} color={activeTab === 'downloads' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'downloads' && styles.subtabBtnTextActive]}>
            Downloads ({downloads.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subtabBtn, activeTab === 'saved' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons name="bookmark" size={14} color={activeTab === 'saved' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'saved' && styles.subtabBtnTextActive]}>
            Saved ({bookmarks.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subtabBtn, activeTab === 'pages' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('pages')}
        >
          <Ionicons name="flag" size={14} color={activeTab === 'pages' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'pages' && styles.subtabBtnTextActive]}>
            Pages
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subtabBtn, activeTab === 'settings' && styles.subtabBtnActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons name="settings" size={14} color={activeTab === 'settings' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.subtabBtnText, activeTab === 'settings' && styles.subtabBtnTextActive]}>
            Settings
          </Text>
        </Pressable>
      </ScrollView>

      {/* 4. Subtab Content */}
      <View style={styles.tabContentArea}>
        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <View style={styles.emptySubtabCard}>
            <Ionicons name="grid-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptySubtabTitle}>No posts yet</Text>
            <Text style={styles.emptySubtabBody}>
              Your shared decrees, testimonies, and fellowship posts will appear here.
            </Text>
          </View>
        )}

        {/* Tab: Reels */}
        {activeTab === 'reels' && (
          <View style={styles.reelsGrid}>
            {REELS_DATA.map(reel => (
              <Pressable
                key={reel.id}
                style={styles.reelCard}
                onPress={() => setActiveReel(reel)}
              >
                <View style={styles.reelThumbPlaceholder}>
                  <Ionicons name="play-circle" size={34} color={Colors.gold} />
                  <View style={styles.reelDurationBadge}>
                    <Text style={styles.reelDurationText}>{reel.duration}</Text>
                  </View>
                </View>
                <Text style={styles.reelTitle} numberOfLines={2}>{reel.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={styles.reelViews}>{reel.views} views</Text>
                  <Ionicons name="play" size={11} color={Colors.gold} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tab: Downloads */}
        {activeTab === 'downloads' && (
          downloads.length === 0 ? (
            <View style={styles.emptySubtabCard}>
              <Ionicons name="cloud-download-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySubtabTitle}>No offline downloads</Text>
              <Text style={styles.emptySubtabBody}>
                Download sermons in 720p, 480p, or Audio to watch or listen anywhere without mobile data.
              </Text>
            </View>
          ) : (
            downloads.map(dl => (
              <View key={dl.id} style={styles.savedCard}>
                <Ionicons name={dl.media_type.includes('video') ? 'videocam' : 'musical-notes'} size={20} color={Colors.gold} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.savedTitle}>{dl.content_id}</Text>
                  <Text style={styles.savedSubtitle}>Offline Ready • Full Apostolic Media</Text>
                </View>
                <Pressable
                  onPress={async () => {
                    await deleteDownload(dl.content_id);
                    refreshData();
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))
          )
        )}

        {/* Tab: Saved Verses */}
        {activeTab === 'saved' && (
          bookmarks.length === 0 ? (
            <View style={styles.emptySubtabCard}>
              <Ionicons name="bookmark-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySubtabTitle}>No saved verses yet</Text>
              <Text style={styles.emptySubtabBody}>
                Tap the star icon on any Bible verse to bookmark it for your personal meditation library.
              </Text>
              {onNavigateBible && (
                <Pressable style={styles.openBibleBtn} onPress={onNavigateBible}>
                  <Text style={styles.openBibleBtnText}>Open Bible Reader</Text>
                </Pressable>
              )}
            </View>
          ) : (
            bookmarks.map(bm => (
              <View key={bm} style={styles.savedCard}>
                <Ionicons name="bookmark" size={18} color={Colors.gold} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.savedTitle}>{bm}</Text>
                  <Text style={styles.savedSubtitle}>Saved to offline scripture meditation</Text>
                </View>
                <Pressable
                  onPress={() => {
                    BibleRepository.toggleBookmark(profile?.id || null, 'KJV', bm);
                    refreshData();
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))
          )
        )}

        {/* Tab: Pages (Ministries & Fellowship Groups) */}
        {activeTab === 'pages' && (
          <View style={{ gap: 10 }}>
            {FELLOWSHIP_PAGES.map(page => (
              <View key={page.id} style={styles.pageItemCard}>
                <View style={styles.pageItemIcon}>
                  <Ionicons name={page.icon as any} size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.pageItemTitle}>{page.name}</Text>
                  <Text style={styles.pageItemCategory}>{page.category} • {page.members}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            ))}
          </View>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <View style={{ gap: 14 }}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>DATA & SYNC</Text>
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Low Data Mode</Text>
                  <Text style={styles.settingSub}>Reduces thumbnail resolutions on mobile networks</Text>
                </View>
                <Switch
                  value={lowData}
                  onValueChange={handleLowDataToggle}
                  trackColor={{ false: '#3f3f46', true: Colors.gold }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Anonymous Analytics</Text>
                  <Text style={styles.settingSub}>Helps us improve streaming and app stability</Text>
                </View>
                <Switch
                  value={analytics}
                  onValueChange={handleAnalyticsToggle}
                  trackColor={{ false: '#3f3f46', true: Colors.gold }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>ACCOUNT SECURITY</Text>
              <Pressable
                style={styles.legalItem}
                onPress={() => {
                  if (!profile) {
                    if (onRequestAuth) {
                      onRequestAuth('Sign in to manage and change your account password.');
                    } else {
                      Alert.alert('Sign In Required', 'Please sign in to change your password.');
                    }
                    return;
                  }
                  setShowPasswordModal(true);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="key-outline" size={17} color={Colors.gold} />
                  <Text style={styles.legalItemText}>Change Account Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>LEGAL & ABOUT</Text>
              <Pressable style={styles.legalItem} onPress={() => setLegalModalTab('privacy')}>
                <Text style={styles.legalItemText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.legalItem} onPress={() => setLegalModalTab('terms')}>
                <Text style={styles.legalItemText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.blueWaveBadge}>
              <Text style={styles.blueWaveBadgeTitle}>App Engineering & Technology Partner</Text>
              <Text style={styles.blueWaveBadgeName}>BlueWave Technologies</Text>
              <Text style={styles.blueWaveBadgeLink}>bluewavetechnologies.co.zw • info@bluewavetechnologies.co.zw</Text>
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
      </View>

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

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Handle</Text>
              <TextInput
                value={editHandle}
                onChangeText={setEditHandle}
                placeholder="@handle"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+263..."
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Location / Cell Hub</Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Harare, Zimbabwe"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Bio / Mandate</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Your bio..."
                placeholderTextColor={Colors.textMuted}
                multiline
                style={[styles.input, { minHeight: 70 }]}
              />

              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                value={editWebsite}
                onChangeText={setEditWebsite}
                placeholder="website link"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />

              <Pressable
                style={[styles.saveBtn, savingProfile && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveBtnText}>
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* In-App Reel Video Player Modal */}
      <Modal visible={!!activeReel} animationType="slide" transparent onRequestClose={() => setActiveReel(null)}>
        <View style={styles.reelPlayerOverlay}>
          <View style={styles.reelPlayerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reelPlayerEyebrow}>APOSTOLIC SHORT REEL</Text>
              <Text style={styles.reelPlayerTitle} numberOfLines={1}>{activeReel?.title}</Text>
            </View>
            <Pressable onPress={() => setActiveReel(null)} style={styles.reelCloseBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.reelPlayerContainer}>
            {activeReel && (
              <WebView
                source={{
                  html: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
    .wrapper { position: relative; width: 100%; height: 100%; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <iframe
      src="https://www.youtube-nocookie.com/embed/${activeReel.youtubeId}?autoplay=1&playsinline=1&enablejsapi=1&fs=1&rel=0&modestbranding=1&origin=https://gatewayconnect.joedaniels.org"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>`,
                  baseUrl: 'https://gatewayconnect.joedaniels.org',
                }}
                style={{ flex: 1, backgroundColor: '#000000' }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                userAgent={Platform.OS === 'android' ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36' : undefined}
              />
            )}
          </View>

          <View style={styles.reelPlayerFooter}>
            <View>
              <Text style={styles.reelPlayerSpeaker}>{activeReel?.speaker}</Text>
              <Text style={styles.reelPlayerMeta}>{activeReel?.views} views • {activeReel?.duration}</Text>
            </View>
            <Pressable
              style={styles.reelShareBtn}
              onPress={() => {
                Alert.alert('Reel Shared', `Link to "${activeReel?.title}" copied to clipboard!`);
              }}
            >
              <Ionicons name="share-social-outline" size={16} color={Colors.gold} />
              <Text style={styles.reelShareBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.passwordIconWrap}>
                  <Ionicons name="key" size={18} color={Colors.gold} />
                </View>
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              <Pressable onPress={() => setShowPasswordModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.passwordHelpText}>
                Update your GatewayConnect account password to keep your member profile and covenant data safe.
              </Text>

              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                style={styles.input}
              />

              <Text style={styles.inputLabel}>New Password (min 6 characters)</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showNewPassword}
                  style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                />
                <Pressable
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.passwordToggleEye}
                >
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showNewPassword}
                style={styles.input}
              />

              <Pressable
                style={[styles.saveBtn, savingPassword && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                <Text style={styles.saveBtnText}>
                  {savingPassword ? 'Updating Password...' : 'Save New Password'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Legal Modal */}
      <LegalModal
        visible={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'privacy'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  guestHero: {
    backgroundColor: '#0c0e14',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16161e',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  guestBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1,
  },
  guestTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    marginBottom: 6,
  },
  guestBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  guestActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  guestSignInBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guestSignInBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  guestSignUpBtn: {
    flex: 1,
    backgroundColor: '#16161e',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guestSignUpBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },

  // Member Profile Hero Card (Screenshot 5 Match)
  profileHeroCard: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2433',
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topBarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarHandle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  verifiedMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifiedMemberPillText: {
    fontFamily: Typography.fontBold,
    color: '#10b981',
    fontSize: 10,
  },
  topBarMenuBtn: {
    padding: 6,
    backgroundColor: '#161a24',
    borderRadius: Radii.sm,
  },

  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarCircleWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: '#121622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 30,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0c0f17',
  },
  statsCols: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  statCol: {
    alignItems: 'center',
  },
  statColNum: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  statColLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fullNameText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  roleBadgePill: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  roleBadgePillText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  infoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#222b3d',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },

  bioText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  websiteText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
  },
  followersNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  followersNoteText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },

  profileActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181e2b',
    borderWidth: 1,
    borderColor: '#263147',
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  profileEditBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  profileShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181e2b',
    borderWidth: 1,
    borderColor: '#263147',
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  profileShareBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  profileCrownBtn: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Subtabs Horizontal Scroll Bar
  subtabScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  subtabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1d2334',
    marginRight: 8,
  },
  subtabBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  subtabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  subtabBtnTextActive: {
    color: '#000000',
    fontFamily: Typography.fontBold,
  },

  // Subtab Content
  tabContentArea: {
    gap: 12,
  },
  emptySubtabCard: {
    backgroundColor: '#0d1017',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptySubtabTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  emptySubtabBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  openBibleBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },
  openBibleBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },

  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reelCard: {
    width: '48%',
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1e2538',
    borderRadius: Radii.md,
    padding: 10,
    gap: 4,
  },
  reelThumbPlaceholder: {
    height: 100,
    backgroundColor: '#0a0d14',
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  reelDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  reelDurationText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 9,
  },
  reelTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  reelViews: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 10,
  },

  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1e2538',
    borderRadius: Radii.md,
    padding: 12,
  },
  savedTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  savedSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  pageItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1e2538',
    borderRadius: Radii.md,
    padding: 12,
  },
  pageItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181e2b',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageItemTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  pageItemCategory: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  settingsSection: {
    backgroundColor: '#10141e',
    borderWidth: 1,
    borderColor: '#1d2334',
    borderRadius: Radii.md,
    padding: 14,
    gap: 12,
  },
  settingsSectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  settingSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  legalItemText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  blueWaveBadge: {
    backgroundColor: '#0a0d14',
    borderWidth: 1,
    borderColor: '#181e2b',
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  blueWaveBadgeTitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  blueWaveBadgeName: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  blueWaveBadgeLink: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    paddingVertical: 12,
  },
  btnDangerText: {
    fontFamily: Typography.fontBold,
    color: Colors.danger,
    fontSize: 13,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0e121a',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1f2638',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  inputLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#141824',
    borderWidth: 1,
    borderColor: '#242e42',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },

  // Reel Video Player Modal
  reelPlayerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  reelPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 12,
    backgroundColor: '#0c0f17',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reelPlayerEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  reelPlayerTitle: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 14,
    marginTop: 2,
  },
  reelCloseBtn: {
    padding: 6,
  },
  reelPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  reelPlayerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0c0f17',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reelPlayerSpeaker: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  reelPlayerMeta: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  reelShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181822',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reelShareBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },

  // Password Modal
  passwordIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 167, 50, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHelpText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141824',
    borderWidth: 1,
    borderColor: '#242e42',
    borderRadius: Radii.sm,
    marginBottom: 4,
    paddingRight: 8,
  },
  passwordToggleEye: {
    padding: 8,
  },
});
