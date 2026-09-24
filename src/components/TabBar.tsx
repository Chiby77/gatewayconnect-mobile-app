import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

export type Screen = 'home' | 'sermons' | 'bible' | 'community' | 'prayer' | 'store' | 'profile' | 'live' | 'chat';

interface TabBarProps {
  screen: Screen;
  onPress: (screen: Screen) => void;
  isLoggedIn: boolean;
  onDonateTap?: () => void;
}

const LEFT_TABS: { key: Screen; label: string; icon: string; iconActive: string }[] = [
  { key: 'home',      label: 'Home',      icon: 'home-outline',     iconActive: 'home' },
  { key: 'sermons',   label: 'Sermons',   icon: 'videocam-outline', iconActive: 'videocam' },
  { key: 'bible',     label: 'Bible',     icon: 'book-outline',     iconActive: 'book' },
];

const RIGHT_TABS: { key: Screen; label: string; icon: string; iconActive: string }[] = [
  { key: 'community', label: 'Community', icon: 'people-outline',   iconActive: 'people' },
  { key: 'store',     label: 'Store',     icon: 'bag-outline',      iconActive: 'bag' },
  { key: 'profile',   label: 'Me',        icon: 'person-outline',   iconActive: 'person' },
];

export function TabBar({ screen, onPress, isLoggedIn, onDonateTap }: TabBarProps) {
  const renderTab = (tab: typeof LEFT_TABS[0]) => {
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
          size={20}
          color={isActive ? Colors.gold : Colors.textMuted}
        />
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left tabs */}
      <View style={styles.tabGroup}>
        {LEFT_TABS.map(renderTab)}
      </View>

      {/* Center Donate FAB */}
      <View style={styles.fabWrap}>
        <Pressable
          style={styles.fab}
          onPress={onDonateTap}
          accessibilityLabel="Give / Tithe"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="hand-coin" size={28} color="#09090c" />
        </Pressable>
        <Text style={styles.fabLabel}>Give</Text>
      </View>

      {/* Right tabs */}
      <View style={styles.tabGroup}>
        {RIGHT_TABS.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090c',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a20',
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 3,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    position: 'relative',
    paddingTop: 4,
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
    width: 24,
    height: 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.gold,
  },
  fabWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    width: 64,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    // Pulls the FAB up out of the tab bar
    marginTop: -28,
  },
  fabLabel: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 10,
  },
});

