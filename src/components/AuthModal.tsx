import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser, signIn, signUp } from '../auth/authService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: MobileUser) => void;
  initialMode?: 'signin' | 'signup';
  promptMessage?: string;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export function AuthModal({
  visible,
  onClose,
  onSuccess,
  initialMode = 'signin',
  promptMessage,
  onOpenLegal,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('Harare Main Campus');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
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

    try {
      setLoading(true);
      const user = mode === 'signup'
        ? await signUp(cleanEmail, cleanPass, name.trim())
        : await signIn(cleanEmail, cleanPass);
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      if (msg.includes('Invalid login')) {
        setError('Incorrect email or password. Please check your credentials.');
      } else if (msg.includes('already registered')) {
        setError('This email is already registered. Try signing in.');
      } else {
        setError(msg);
      }
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
                <Text style={styles.logoBadgeText}>G</Text>
              </View>
              <View>
                <Text style={styles.eyebrow}>GATEWAY CHURCH</Text>
                <Text style={styles.title}>
                  {mode === 'signin' ? 'Sign In to Gateway' : 'Join the Fellowship'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {promptMessage ? (
            <View style={styles.promptBanner}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.gold} />
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
                  placeholder="e.g. Tinodaishe Chibi"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                secureTextEntry
              />
            </View>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Home Campus</Text>
                <TextInput
                  value={campus}
                  onChangeText={setCampus}
                  placeholder="Harare Main / Bulawayo / Online"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={mode === 'signin' ? 'log-in-outline' : 'person-add-outline'}
                    size={18}
                    color={Colors.textInverse}
                  />
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Member Account'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Legal Notice */}
            <View style={styles.legalRow}>
              <Text style={styles.legalText}>
                By continuing, you agree to our{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => onOpenLegal && onOpenLegal('terms')}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => onOpenLegal && onOpenLegal('privacy')}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
              <Text style={styles.techCredit}>Developed by BlueWave Technologies</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  logoBadgeText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 20,
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
    fontSize: 16,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 12,
  },
  promptBannerText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: Radii.lg,
    padding: 4,
    marginTop: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
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
  form: {
    paddingTop: 16,
    gap: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    padding: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: Colors.danger,
    fontSize: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
  legalRow: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    paddingBottom: 8,
  },
  legalText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.gold,
    textDecorationLine: 'underline',
  },
  techCredit: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    opacity: 0.7,
  },
});
