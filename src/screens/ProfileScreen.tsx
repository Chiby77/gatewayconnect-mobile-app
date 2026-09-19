import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser, signIn, signUp, signOut } from '../auth/authService';
import { SettingsRepository } from '../settings/settingsRepository';
import { trackEvent } from '../analytics/analyticsService';

interface ProfileScreenProps {
  profile: MobileUser | null;
  onGuest: () => void;
}

export function ProfileScreen({ profile, onGuest }: ProfileScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [lowData, setLowData] = useState(SettingsRepository.getLowDataMode());
  const [analytics, setAnalytics] = useState(SettingsRepository.getAnalyticsOptIn());

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
      // Make Supabase errors more friendly
      if (msg.includes('Invalid login')) setError('Incorrect email or password. Please try again.');
      else if (msg.includes('already registered')) setError('This email is already registered. Try signing in instead.');
      else if (msg.includes('not configured')) setError('Authentication is not available in this build.');
      else setError(msg);
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Account</Text>

      {/* Profile card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{profile ? 'GATEWAY MEMBER' : 'GUEST'}</Text>
            <Text style={styles.cardTitle}>{profile?.name || 'Welcome to GatewayConnect'}</Text>
            <Text style={styles.cardBody}>
              {profile
                ? 'Your secure session is active on this device.'
                : 'Sign in to sync your Bible notes, prayers, and saved content.'}
            </Text>
          </View>
        </View>

        {profile ? (
          <Pressable
            style={styles.btnDanger}
            onPress={() => { void signOut(); trackEvent('sign_out'); }}
          >
            <Ionicons name="log-out-outline" size={14} color={Colors.danger} />
            <Text style={styles.btnDangerText}>Sign out</Text>
          </Pressable>
        ) : (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name (for new accounts)"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <View style={styles.authBtnRow}>
              <Pressable style={[styles.btn, { flex: 1 }]} onPress={() => void authenticate(false)}>
                <Ionicons name="log-in-outline" size={14} color={Colors.textInverse} />
                <Text style={styles.btnText}>Sign In</Text>
              </Pressable>
              <Pressable style={[styles.btnOutline, { flex: 1 }]} onPress={() => void authenticate(true)}>
                <Ionicons name="person-add-outline" size={14} color={Colors.gold} />
                <Text style={styles.btnOutlineText}>Create Account</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.guestBtn}
              onPress={() => { trackEvent('guest_browsing'); onGuest(); }}
            >
              <Text style={styles.guestBtnText}>Continue as Guest →</Text>
            </Pressable>
          </>
        )}

        {error ? (
          <Text style={[styles.cardBody, { color: error.startsWith('Welcome') ? Colors.success : Colors.danger, marginTop: 12 }]}>
            {error}
          </Text>
        ) : null}
      </View>

      {/* Settings */}
      <Text style={styles.subTitle}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>DATA & PRIVACY</Text>

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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
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
  authBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnOutlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
  },
  btnDanger: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerMuted,
  },
  btnDangerText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.danger,
    fontSize: 13,
  },
  guestBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  guestBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
});
