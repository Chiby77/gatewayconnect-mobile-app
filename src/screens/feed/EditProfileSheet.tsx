import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MobileUser, updateProfile } from '../../auth/authService';
import { Colors, Radii, Typography } from '../../theme/colors';
import { Avatar } from './Avatar';
import { pickAndUploadAvatar } from './avatarUpload';

interface Props {
  visible: boolean;
  profile: MobileUser;
  onClose: () => void;
  onSaved: (updated: MobileUser) => void;
}

export function EditProfileSheet({ visible, profile, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState((profile.handle ?? '').replace(/^@/, ''));
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const changeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(profile.id);
      if (url) setAvatarUrl(url);
    } catch {
      Alert.alert('Could not update photo', 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Add your name', 'Your name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        handle: handle.trim() ? `@${handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_')}` : profile.handle,
        bio: bio.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
      });
      onSaved(updated);
      onClose();
    } catch {
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit profile</Text>
          <Pressable onPress={save} disabled={saving} hitSlop={10} accessibilityLabel="Save">
            {saving ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.save}>Save</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.avatarWrap} onPress={changeAvatar} disabled={uploadingAvatar}>
            <Avatar name={name} image={avatarUrl} size={90} />
            <View style={styles.avatarBadge}>
              {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
            </View>
          </Pressable>
          <Pressable onPress={changeAvatar} disabled={uploadingAvatar}>
            <Text style={styles.changePhoto}>Change profile photo</Text>
          </Pressable>

          <Field label="Name" value={name} onChangeText={setName} maxLength={60} />
          <Field label="Username" value={handle} onChangeText={setHandle} autoCapitalize="none" prefix="@" maxLength={30} />
          <Field label="Bio" value={bio} onChangeText={setBio} multiline maxLength={150} />
          <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" maxLength={100} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; multiline?: boolean; autoCapitalize?: 'none' | 'sentences'; keyboardType?: 'default' | 'url'; maxLength?: number; prefix?: string }) {
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.inputRow}>
        {props.prefix ? <Text style={styles.prefix}>{props.prefix}</Text> : null}
        <TextInput
          style={[styles.input, props.multiline && styles.inputMultiline]}
          value={props.value}
          onChangeText={props.onChangeText}
          multiline={props.multiline}
          autoCapitalize={props.autoCapitalize ?? 'sentences'}
          keyboardType={props.keyboardType}
          maxLength={props.maxLength}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.fontBold, fontSize: 16, color: Colors.textPrimary },
  cancel: { fontFamily: Typography.fontRegular, fontSize: 15, color: Colors.textSecondary },
  save: { fontFamily: Typography.fontBold, fontSize: 15, color: Colors.primary },
  avatarWrap: { alignSelf: 'center' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  changePhoto: { alignSelf: 'center', color: Colors.primary, fontFamily: Typography.fontSemiBold, fontSize: 14, marginTop: -8 },
  label: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: Radii.md, paddingHorizontal: 14 },
  prefix: { color: Colors.textMuted, fontFamily: Typography.fontSemiBold, fontSize: 15 },
  input: { flex: 1, paddingVertical: 12, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingTop: 12 },
});
