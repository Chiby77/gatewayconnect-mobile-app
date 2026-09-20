import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';

import { initializeDatabase } from './src/db/database';
import { getNetworkStatus, initializeNetworkStatus, NetworkStatus, subscribeToNetworkStatus } from './src/network/networkStatus';
import { countPendingMutations } from './src/sync/outbox';
import { startSyncEngine } from './src/sync/syncEngine';
import { getSyncState, subscribeToSyncState, SyncState } from './src/sync/syncStatus';
import { BibleRepository } from './src/bible/bibleRepository';
import { getCachedProfile, MobileUser, subscribeToAuth } from './src/auth/authService';
import { startRealtimePersistence } from './src/remote/realtimeService';
import { registerBackgroundSync } from './src/sync/backgroundSync';
import { enforceExpiration } from './src/media/downloadManager';

import { Colors, Typography, Radii } from './src/theme/colors';
import { AppHeader } from './src/components/AppHeader';
import { TabBar, Screen } from './src/components/TabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { SermonScreen } from './src/screens/SermonScreen';
import { BibleScreen } from './src/screens/BibleScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { PrayerScreen } from './src/screens/PrayerScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { Ionicons } from '@expo/vector-icons';

import { AuthModal } from './src/components/AuthModal';
import { LegalModal } from './src/components/LegalModal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [pendingMutations, setPendingMutations] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<MobileUser | null>(null);
  // showAuthWall: true = show the welcome/auth splash; false = inside the app
  const [showAuthWall, setShowAuthWall] = useState(true);

  // Global Auth & Legal Modals
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);

  const handleRequestAuth = (prompt?: string) => {
    setAuthModalPrompt(prompt);
    setAuthModalMode('signin');
    setAuthModalVisible(true);
  };

  useEffect(() => {
    initializeDatabase();
    BibleRepository.ensureCorePack();
    const unsubscribeNetwork = initializeNetworkStatus();
    const stopSync = startSyncEngine();
    void registerBackgroundSync();
    const stopRealtime = startRealtimePersistence();
    setNetworkStatus(getNetworkStatus());
    setPendingMutations(countPendingMutations());
    setSyncState(getSyncState());
    void getCachedProfile().then(p => {
      setProfile(p);
      // If user was previously signed in, skip the auth wall
      if (p) setShowAuthWall(false);
    });
    const unsubAuth = subscribeToAuth(p => {
      setProfile(p);
      if (p) setShowAuthWall(false);
    });
    const unsubNetwork = subscribeToNetworkStatus(s => {
      setNetworkStatus(s);
      setPendingMutations(countPendingMutations());
    });
    const unsubSync = subscribeToSyncState(s => {
      setSyncState(s);
      setPendingMutations(countPendingMutations());
    });
    void enforceExpiration();
    return () => {
      unsubAuth();
      unsubNetwork();
      unsubscribeNetwork();
      stopSync();
      stopRealtime();
      unsubSync();
    };
  }, []);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_800ExtraBold });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} translucent={false} />
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>G</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Welcome / Auth wall
  if (showAuthWall) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.forestGreen} translucent={false} />
        <View style={styles.authInner}>
          <View style={styles.authMark}>
            <Text style={styles.authMarkText}>G</Text>
          </View>
          <Text style={styles.authEyebrow}>GATEWAY CHURCH</Text>
          <Text style={styles.authTitle}>GatewayConnect</Text>
          <Text style={styles.authSubtitle}>Your faith, available anywhere.</Text>

          <View style={styles.authButtons}>
            {/* Sign In / Create Account opens AuthModal directly */}
            <Pressable
              style={styles.authBtnPrimary}
              onPress={() => {
                setAuthModalPrompt(undefined);
                setAuthModalMode('signin');
                setAuthModalVisible(true);
              }}
            >
              <Ionicons name="log-in-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.authBtnPrimaryText}>Sign In / Create Account</Text>
            </Pressable>
            {/* Guest → continue as guest */}
            <Pressable
              style={styles.authBtnSecondary}
              onPress={() => {
                setShowAuthWall(false);
                setScreen('home');
              }}
            >
              <Text style={styles.authBtnSecondaryText}>Continue as Guest →</Text>
            </Pressable>
          </View>
        </View>

        {/* AuthModal on Welcome screen */}
        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onSuccess={(u) => {
            setProfile(u);
            setShowAuthWall(false);
            setAuthModalVisible(false);
          }}
          initialMode={authModalMode}
          promptMessage={authModalPrompt}
          onOpenLegal={(tab) => setLegalModalTab(tab)}
        />

        {/* LegalModal on Welcome screen */}
        <LegalModal
          visible={!!legalModalTab}
          onClose={() => setLegalModalTab(null)}
          initialTab={legalModalTab || 'privacy'}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} translucent={false} />
      <AppHeader networkStatus={networkStatus} syncState={syncState} pendingCount={pendingMutations} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {screen === 'home' && (
          <HomeScreen
            networkStatus={networkStatus}
            pendingMutations={pendingMutations}
            syncState={syncState}
            onNavigateBible={() => setScreen('bible')}
            onNavigateStore={() => setScreen('store')}
            onNavigateSermons={() => setScreen('sermons')}
          />
        )}
        {screen === 'sermons' && <SermonScreen onNavigateHome={() => setScreen('home')} />}
        {screen === 'bible' && <BibleScreen profile={profile} />}
        {screen === 'community' && <CommunityScreen profile={profile} onRequestAuth={handleRequestAuth} />}
        {screen === 'prayer' && <PrayerScreen profile={profile} onRequestAuth={handleRequestAuth} />}
        {screen === 'store' && <StoreScreen profile={profile} />}
        {screen === 'profile' && (
          <ProfileScreen
            profile={profile}
            onGuest={() => { setScreen('home'); }}
            onNavigateBible={() => setScreen('bible')}
            onRequestAuth={handleRequestAuth}
          />
        )}
      </ScrollView>

      <TabBar
        screen={screen}
        onPress={(key) => setScreen(key)}
        isLoggedIn={!!profile}
      />

      {/* Global AuthModal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={(u) => {
          setProfile(u);
          setAuthModalVisible(false);
        }}
        initialMode={authModalMode}
        promptMessage={authModalPrompt}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
      />

      {/* Global LegalModal */}
      <LegalModal
        visible={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'privacy'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    gap: 8,
  },
  loadingMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMarkText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 42,
  },
  loadingText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  authScreen: {
    flex: 1,
    backgroundColor: Colors.forestGreen,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  authInner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    alignItems: 'center',
  },
  authMark: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  authMarkText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 52,
  },
  authEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  authTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 36,
    textAlign: 'center',
  },
  authSubtitle: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 48,
  },
  authButtons: {
    width: '100%',
    gap: 14,
  },
  authBtnPrimary: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  authBtnPrimaryText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 15,
  },
  authBtnSecondary: {
    borderWidth: 1.5,
    borderColor: 'rgba(242,211,153,0.5)',
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  authBtnSecondaryText: {
    fontFamily: Typography.fontSemiBold,
    color: 'rgba(242,211,153,0.85)',
    fontSize: 15,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 16,
  },
});
