import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../theme/colors';

export function Avatar({ name, image, size = 40 }: { name?: string; image?: string | null; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (image) return <Image source={{ uri: image }} style={[styles.img, box]} />;
  return (
    <View style={[styles.fallback, box]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: Colors.bgSecondary },
  fallback: { backgroundColor: Colors.forestGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(223,167,50,0.35)' },
  initial: { fontFamily: Typography.fontBold, color: Colors.gold },
});
