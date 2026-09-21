import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, Image } from 'react-native';
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
import { LiveScreen } from './src/screens/LiveScreen';
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
  const [communityFabAction, setCommunityFabAction] = useState<(() => void) | null>(null);

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

  // Welcome / Auth wall (matches Screenshot 1)
  if (showAuthWall) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#070a0f" translucent={false} />
        <View style={styles.authInner}>
          <View style={styles.authEmblemContainer}>
            <Image
              source={require('./assets/gateway_logo.png')}
              style={styles.authEmblem}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeGatewayText}>GATEWAY</Text>
          <View style={styles.welcomeConnectRow}>
            <View style={styles.welcomeGoldLine} />
            <Text style={styles.welcomeConnectText}>CONNECT</Text>
            <View style={styles.welcomeGoldLine} />
          </View>
          <Text style={styles.welcomeSloganText}>
            CONNECTING PEOPLE{'\n'}TO A BRIGHTER FUTURE
          </Text>

          <Pressable
            style={styles.welcomeContinueBtn}
            onPress={() => {
              setAuthModalPrompt(undefined);
              setAuthModalMode('signin');
              setAuthModalVisible(true);
            }}
          >
            <Text style={styles.welcomeContinueText}>CONTINUE   →</Text>
          </Pressable>
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
          onContinueAsGuest={() => {
            setShowAuthWall(false);
            setScreen('home');
          }}
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

  // Full Screen Live Stream Screen
  if (screen === 'live') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
        <LiveScreen onBack={() => setScreen('home')} />
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
            profile={profile}
            onRequestAuth={handleRequestAuth}
            onNavigateBible={() => setScreen('bible')}
            onNavigateStore={() => setScreen('store')}
            onNavigateSermons={() => setScreen('sermons')}
            onNavigateLive={() => setScreen('live')}
          />
        )}
        {screen === 'sermons' && (
          <SermonScreen
            profile={profile}
            onRequestAuth={handleRequestAuth}
            onNavigateHome={() => setScreen('home')}
          />
        )}
        {screen === 'bible' && <BibleScreen profile={profile} />}
        {screen === 'community' && (
          <CommunityScreen
            profile={profile}
            onRequestAuth={handleRequestAuth}
            onRegisterFabTrigger={setCommunityFabAction}
          />
        )}
        {screen === 'prayer' && <PrayerScreen profile={profile} onRequestAuth={handleRequestAuth} />}
        {screen === 'store' && <StoreScreen profile={profile} />}
        {screen === 'profile' && (
          <ProfileScreen
            profile={profile}
            onGuest={() => { setScreen('home'); }}
            onNavigateBible={() => setScreen('bible')}
            onNavigateCommunity={() => setScreen('community')}
            onRequestAuth={handleRequestAuth}
          />
        )}
      </ScrollView>

      {/* WhatsApp Fixed Floating Action Button (FAB) on Community Screen */}
      {screen === 'community' && communityFabAction && (
        <Pressable
          style={styles.floatingWhatsappFab}
          onPress={communityFabAction}
          accessibilityLabel="Open WhatsApp Chat Menu"
        >
          <Ionicons name="chatbubbles" size={24} color="#ffffff" />
          <View style={styles.floatingFabBadge}>
            <Text style={styles.floatingFabBadgeText}>3</Text>
          </View>
        </Pressable>
      )}

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
    backgroundColor: '#070a0f',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  authInner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authEmblemContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  authEmblem: {
    width: '100%',
    height: '100%',
  },
  welcomeGatewayText: {
    fontFamily: Typography.fontBold,
    color: '#dfa732',
    fontSize: 34,
    letterSpacing: 6,
    textAlign: 'center',
  },
  welcomeConnectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 24,
  },
  welcomeGoldLine: {
    width: 32,
    height: 1.5,
    backgroundColor: '#dfa732',
    opacity: 0.8,
  },
  welcomeConnectText: {
    fontFamily: Typography.fontBold,
    color: '#dfa732',
    fontSize: 16,
    letterSpacing: 6,
  },
  welcomeSloganText: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 48,
  },
  welcomeContinueBtn: {
    width: '82%',
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: Radii.full,
    backgroundColor: '#f1be48',
    borderWidth: 2,
    borderColor: '#ffd875',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dfa732',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeContinueText: {
    fontFamily: Typography.fontBold,
    color: '#070a0f',
    fontSize: 15,
    letterSpacing: 2,
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
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 96 : 74,
    gap: 12,
  },
  floatingWhatsappFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 84 : 68,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 9999,
  },
  floatingFabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  floatingFabBadgeText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 9,
  },
});
