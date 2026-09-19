import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { NetworkStatus } from '../network/networkStatus';
import { SyncState } from '../sync/syncStatus';

interface AppHeaderProps {
  networkStatus: NetworkStatus;
  syncState?: SyncState;
  pendingCount?: number;
}

export function AppHeader({ networkStatus }: AppHeaderProps) {
  const isOnline = networkStatus === 'online';

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>G</Text>
        </View>
        <View>
          <Text style={styles.eyebrow}>GATEWAY CHURCH</Text>
          <Text style={styles.title}>GatewayConnect</Text>
        </View>
      </View>

      {!isOnline && (
        <View style={styles.offlinePill}>
          <Ionicons name="cloud-offline" size={13} color={Colors.warning} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.forestGreen,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  markText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 24,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 1,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  offlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.warning,
    fontSize: 12,
  },
});
