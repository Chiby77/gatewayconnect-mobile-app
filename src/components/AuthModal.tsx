import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser, signIn, signUp, DEMO_USERS } from '../auth/authService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: MobileUser) => void;
  initialMode?: 'signin' | 'signup';
  promptMessage?: string;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
  onContinueAsGuest?: () => void;
}

const COUNTRY_CODES = [
  { code: '+263', label: 'ZW (+263)' },
  { code: '+27',  label: 'ZA (+27)' },
  { code: '+44',  label: 'UK (+44)' },
  { code: '+1',   label: 'US (+1)' },
];

const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Gweru', 'Mutare', 'Diaspora'];

export function AuthModal({
  visible,
  onClose,
  onSuccess,
  initialMode = 'signin',
  promptMessage,
  onOpenLegal,
  onContinueAsGuest,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+263');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState('Harare');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatFullPhone = (rawPhone: string, code: string) => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('@') || /[a-zA-Z]/.test(trimmed)) return trimmed;
    if (trimmed.startsWith('+')) return trimmed;
    const cleanLocal = trimmed.replace(/^0+/, '');
    return `${code}${cleanLocal}`;
  };

  const handleSubmit = async () => {
    setError('');
    const rawPhone = phone.trim();
    const cleanPass = password.trim();

    if (!rawPhone) {
      setError('Please enter your mobile phone number.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your account password.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const fullPhone = formatFullPhone(rawPhone, countryCode);

    try {
      setLoading(true);
      const user = mode === 'signup'
        ? await signUp(name.trim(), fullPhone, cleanPass, `${location}, Zimbabwe`, dob.trim() || undefined, gender)
        : await signIn(fullPhone, cleanPass);
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setError(msg);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.gold} />
              </View>
              <View>
                <Text style={styles.eyebrow}>GATEWAY CHURCH INTERNATIONAL</Text>
                <Text style={styles.title}>
                  {mode === 'signin' ? 'Sign In to Gateway' : 'Create Believer Account'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {promptMessage ? (
            <View style={styles.promptBanner}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
              <Text style={styles.promptBannerText}>{promptMessage}</Text>
            </View>
          ) : null}

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabBtn, mode === 'signin' && styles.tabBtnActive]}
              onPress={() => { setMode('signin'); setError(''); }}
            >
              <Text style={[styles.tabBtnText, mode === 'signin' && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
              onPress={() => { setMode('signup'); setError(''); }}
            >
              <Text style={[styles.tabBtnText, mode === 'signup' && styles.tabBtnTextActive]}>
                Create Account
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Decide Mkwanda"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Phone Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="077... or 078... (or @handle)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
              <Text style={styles.hintText}>Strictly 1 account per mobile number for security</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter secret password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {mode === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sex / Gender</Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      style={[styles.genderPill, gender === 'male' && styles.genderPillActive]}
                      onPress={() => setGender('male')}
                    >
                      <Ionicons
                        name="male-outline"
                        size={15}
                        color={gender === 'male' ? Colors.textInverse : Colors.gold}
                      />
                      <Text style={[styles.genderPillText, gender === 'male' && styles.genderPillTextActive]}>
                        Male (Brother)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.genderPill, gender === 'female' && styles.genderPillActive]}
                      onPress={() => setGender('female')}
                    >
                      <Ionicons
                        name="female-outline"
                        size={15}
                        color={gender === 'female' ? Colors.textInverse : Colors.gold}
                      />
                      <Text style={[styles.genderPillText, gender === 'female' && styles.genderPillTextActive]}>
                        Female (Sister)
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <View style={styles.dobInputRow}>
                    <Ionicons name="calendar-outline" size={17} color={Colors.gold} style={{ marginLeft: 12 }} />
                    <TextInput
                      value={dob}
                      onChangeText={setDob}
                      placeholder="e.g. 1995-08-24 (YYYY-MM-DD)"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                    />
                  </View>
                  <Text style={styles.hintText}>For ministry discipleship, birthday blessings & age fellowship</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City / Campus Location</Text>
                  <View style={styles.cityPillRow}>
                    {CITIES.map(c => (
                      <Pressable
                        key={c}
                        style={[styles.cityPill, location === c && styles.cityPillActive]}
                        onPress={() => setLocation(c)}
                      >
                        <Text style={[styles.cityPillText, location === c && styles.cityPillTextActive]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Pressable
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <>
                  <Ionicons name={mode === 'signin' ? 'log-in-outline' : 'person-add-outline'} size={18} color={Colors.textInverse} />
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Join Fellowship'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Quick Demo Test Accounts */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Or tap to test with web demo accounts:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoScroll}>
                {DEMO_USERS.map(u => (
                  <Pressable
                    key={u.id}
                    style={styles.demoChip}
                    onPress={async () => {
                      try {
                        setLoading(true);
                        const user = await signIn(u.phone || u.handle || u.name);
                        setLoading(false);
                        onSuccess(user);
                        onClose();
                      } catch {
                        setLoading(false);
                      }
                    }}
                  >
                    <Ionicons name="person-circle" size={14} color={Colors.gold} />
                    <Text style={styles.demoChipText}>{u.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {onContinueAsGuest ? (
              <Pressable style={styles.guestBtn} onPress={onContinueAsGuest}>
                <Text style={styles.guestBtnText}>Continue as Guest</Text>
              </Pressable>
            ) : null}

            {onOpenLegal && (
              <View style={styles.legalLinks}>
                <Pressable onPress={() => onOpenLegal('privacy')}>
                  <Text style={styles.legalText}>Privacy Policy</Text>
                </Pressable>
                <Text style={styles.legalDot}>•</Text>
                <Pressable onPress={() => onOpenLegal('terms')}>
                  <Text style={styles.legalText}>Terms of Service</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: '#16161e',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 12,
  },
  promptBannerText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.gold,
  },
  tabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  tabBtnTextActive: {
    color: Colors.textInverse,
  },
  form: {
    gap: 12,
    paddingBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Radii.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.danger,
    fontSize: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
  },
  hintText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  dobInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181f',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  genderPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  genderPillTextActive: {
    color: Colors.textInverse,
  },
  cityPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cityPill: {
    backgroundColor: '#18181f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  cityPillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  cityPillTextActive: {
    color: Colors.textInverse,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 13,
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
  demoSection: {
    marginTop: 8,
    gap: 6,
  },
  demoLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  demoScroll: {
    flexDirection: 'row',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16161e',
    borderWidth: 1,
    borderColor: '#2a2a35',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  demoChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  guestBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  legalText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  legalDot: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
