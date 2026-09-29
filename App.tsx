import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { registerForPushNotificationsAsync } from './src/remote/pushService';
import { StreamRoot } from './src/stream/StreamRoot';
import { OwnFeedsProvider } from './src/screens/feed/OwnFeeds';

import { Colors, Typography, Radii } from './src/theme/colors';
import { AppHeader } from './src/components/AppHeader';
import { TabBar, Screen } from './src/components/TabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { SermonScreen } from './src/screens/SermonScreen';
import { BibleScreen } from './src/screens/BibleScreen';
import { PrayerScreen } from './src/screens/PrayerScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { ChatFeatureScreen } from './src/screens/ChatFeatureScreen';
import { CommunityFeedScreen } from './src/screens/feed/CommunityFeedScreen';
import { Ionicons } from '@expo/vector-icons';

import { AuthModal } from './src/components/AuthModal';
import { LegalModal } from './src/components/LegalModal';
import { DonateModal } from './src/components/DonateModal';

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
  const [showDonateModal, setShowDonateModal] = useState(false);

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
      if (p) {
        setShowAuthWall(false);
        registerForPushNotificationsAsync(p.id);
      }
    });
    const unsubAuth = subscribeToAuth(p => {
      setProfile(p);
      if (p) {
        setShowAuthWall(false);
        registerForPushNotificationsAsync(p.id);
      }
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
        <Image
          source={require('./assets/gateway_logo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Gateway Connect</Text>
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

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Sign In primary CTA */}
          <Pressable
            style={styles.welcomeContinueBtn}
            onPress={() => {
              setAuthModalPrompt(undefined);
              setAuthModalMode('signin');
              setAuthModalVisible(true);
            }}
          >
            <Text style={styles.welcomeContinueText}>SIGN IN  →</Text>
          </Pressable>

          {/* Sign Up secondary CTA */}
          <Pressable
            style={styles.welcomeSignUpBtn}
            onPress={() => {
              setAuthModalPrompt(undefined);
              setAuthModalMode('signup');
              setAuthModalVisible(true);
            }}
          >
            <Text style={styles.welcomeSignUpText}>CREATE ACCOUNT</Text>
          </Pressable>

          {/* Guest link */}
          <Pressable
            style={styles.welcomeGuestBtn}
            onPress={() => {
              setShowAuthWall(false);
              setScreen('home');
            }}
          >
            <Text style={styles.welcomeGuestText}>Browse as Guest</Text>
          </Pressable>

          <View style={{ height: 20 }} />
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

  // Everything past the auth wall shares one Stream connection (mounted here, once) so switching
  // between Home / Community / Chat / Live never reconnects Chat & Feeds mid-session.
  return (
    <StreamRoot profile={profile}>
      <OwnFeedsProvider>
        {screen === 'live' ? (
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
            <LiveScreen onBack={() => setScreen('home')} />
          </SafeAreaView>
        ) : screen === 'chat' ? (
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} translucent={false} />
            <ChatFeatureScreen onBack={() => setScreen('home')} />
          </SafeAreaView>
        ) : (
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} translucent={false} />
            {screen === 'community' ? (
              // Community is now a full-screen social feed (its own header/tabs), not a ScrollView section.
              <CommunityFeedScreen />
            ) : (
              <>
                <AppHeader
                  networkStatus={networkStatus}
                  syncState={syncState}
                  pendingCount={pendingMutations}
                  onOpenChat={() => setScreen('chat')}
                />
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
                      onNavigateProfile={() => setScreen('profile')}
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
              </>
            )}

            <TabBar
              screen={screen}
              onPress={(key) => setScreen(key)}
              isLoggedIn={!!profile}
              onDonateTap={() => setShowDonateModal(true)}
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

            {/* Global Donate/Give Modal */}
            <DonateModal
              visible={showDonateModal}
              onClose={() => setShowDonateModal(false)}
              profile={profile}
              onRequestAuth={handleRequestAuth}
            />
          </SafeAreaView>
        )}
      </OwnFeedsProvider>
    </StreamRoot>
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
    paddingTop: 60,
    justifyContent: 'flex-start',
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
    marginBottom: 8,
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
  welcomeSignUpBtn: {
    width: '82%',
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: Radii.full,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#dfa732',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  welcomeSignUpText: {
    fontFamily: Typography.fontBold,
    color: '#dfa732',
    fontSize: 14,
    letterSpacing: 2,
  },
  welcomeGuestBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  welcomeGuestText: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textDecorationLine: 'underline',
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
    backgroundColor: '#dfa732',
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

