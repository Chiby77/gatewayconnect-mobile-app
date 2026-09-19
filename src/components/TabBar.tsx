import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

export type Screen = 'home' | 'bible' | 'community' | 'prayer' | 'store' | 'profile';

interface TabBarProps {
  screen: Screen;
  onPress: (screen: Screen) => void;
  isLoggedIn: boolean;
}

const TABS: { key: Screen; label: string; icon: string; iconActive: string }[] = [
  { key: 'home',      label: 'Home',      icon: 'home-outline',     iconActive: 'home' },
  { key: 'bible',     label: 'Bible',     icon: 'book-outline',     iconActive: 'book' },
  { key: 'community', label: 'Community', icon: 'people-outline',   iconActive: 'people' },
  { key: 'store',     label: 'Store',     icon: 'bag-outline',      iconActive: 'bag' },
  { key: 'profile',   label: 'Account',   icon: 'person-outline',   iconActive: 'person' },
];

export function TabBar({ screen, onPress, isLoggedIn }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = screen === tab.key;
        const label = tab.key === 'profile' ? (isLoggedIn ? 'Me' : 'Sign In') : tab.label;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onPress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive && <View style={styles.indicator} />}
            <Ionicons
              name={(isActive ? tab.iconActive : tab.icon) as any}
              size={22}
              color={isActive ? Colors.gold : Colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    position: 'relative',
    paddingTop: 6,
  },
  label: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
  },
  labelActive: {
    color: Colors.gold,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.gold,
  },
});
