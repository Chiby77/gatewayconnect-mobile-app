import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { NetworkStatus } from '../network/networkStatus';
import { SyncState } from '../sync/syncStatus';

interface AppHeaderProps {
  networkStatus: NetworkStatus;
  syncState?: SyncState;
  pendingCount?: number;
  onOpenChat?: () => void;
}

export function AppHeader({ networkStatus, onOpenChat }: AppHeaderProps) {
  const isOnline = networkStatus === 'online';

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/gateway_logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.titleCol}>
          <View style={styles.brandRow}>
            <Text style={styles.brandGold}>GATEWAY</Text>
            <Text style={styles.brandWhite}>CONNECT</Text>
          </View>
          <Text style={styles.eyebrow}>HARARE • GLOBAL FELLOWSHIP</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {onOpenChat && (
          <Pressable
            style={styles.headerChatBtn}
            onPress={onOpenChat}
            accessibilityLabel="Open Gateway Chat"
            accessibilityRole="button"
          >
            <Ionicons name="chatbubbles" size={17} color={Colors.gold} />
            <View style={styles.chatBadgeDot} />
          </Pressable>
        )}
        {!isOnline ? (
          <View style={styles.offlinePill}>
            <Ionicons name="cloud-offline" size={12} color={Colors.warning} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        ) : (
          <View style={styles.liveIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Connected</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  titleCol: {
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandGold: {
    fontFamily: Typography.fontBold,
    color: '#dfa732',
    fontSize: 16,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  brandWhite: {
    fontFamily: Typography.fontBold,
    color: '#fafafa',
    fontSize: 16,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: '#a1a1aa',
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  offlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.warning,
    fontSize: 11,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontFamily: Typography.fontRegular,
    color: '#a1a1aa',
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 167, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
});
