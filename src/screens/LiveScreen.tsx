import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

interface LiveScreenProps {
  onBack?: () => void;
}

const FACEBOOK_LIVE_URL = 'https://m.facebook.com/profile.php?id=61559752510434&v=live';
const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36';

export function LiveScreen({ onBack }: LiveScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE BROADCAST</Text>
          </View>
          <Text style={styles.headerTitle}>Gateway Church International</Text>
        </View>

        <Pressable onPress={handleReload} style={styles.reloadBtn}>
          <Ionicons name="refresh" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      {/* Embedded Facebook Live Stream WebView */}
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: FACEBOOK_LIVE_URL }}
          userAgent={MOBILE_USER_AGENT}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          startInLoadingState={true}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gold} />
              <Text style={styles.loadingText}>Connecting to Gateway Sanctuary Live Feed...</Text>
            </View>
          )}
          style={styles.webView}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0c',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontFamily: Typography.fontBold,
    color: '#ef4444',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
    marginTop: 1,
  },
  reloadBtn: {
    padding: 6,
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
