import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, StatusBar, Linking, ScrollView, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

interface LiveScreenProps {
  onBack?: () => void;
}

const PAST_SERVICES = [
  { id: '1', title: 'Sunday Glorious Service: Divine Acceleration & Open Heavens', date: 'Sunday Broadcast', duration: '2h 15m', youtubeId: '-CibsaxijIk' },
  { id: '2', title: 'Wednesday Midweek Dominion: Breaking Foundational Limitations', date: 'Midweek Dominion', duration: '1h 48m', youtubeId: 'upeY03DKvTo' },
  { id: '3', title: 'Apostolic Impartation: Kingdom Governance & Territorial Grace', date: 'Special Summit', duration: '2h 02m', youtubeId: 'Im5BmoPwSHI' },
];

export function LiveScreen({ onBack }: LiveScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [streamSource, setStreamSource] = useState<'sanctuary' | 'facebook' | 'archive'>('sanctuary');
  const [selectedPastService, setSelectedPastService] = useState(PAST_SERVICES[0]);
  const [likesCount, setLikesCount] = useState(158);
  const [hasLiked, setHasLiked] = useState(false);

  const handleOpenFacebookApp = () => {
    const fbAppUrl = 'fb://page/61559752510434';
    const fbWebUrl = 'https://www.facebook.com/61559752510434/live';

    Linking.canOpenURL(fbAppUrl).then(supported => {
      if (supported) {
        void Linking.openURL(fbAppUrl);
      } else {
        void Linking.openURL(fbWebUrl);
      }
    }).catch(() => {
      void Linking.openURL(fbWebUrl);
    });
  };

  const currentYoutubeId = streamSource === 'archive' ? selectedPastService.youtubeId : '-CibsaxijIk';

  const streamHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000000; overflow:hidden; }
    iframe { width:100%; height:100%; border:0; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube-nocookie.com/embed/${currentYoutubeId}?autoplay=1&playsinline=1&enablejsapi=1&fs=1&rel=0&modestbranding=1&origin=https://gatewayconnect.joedaniels.org"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</body>
</html>`;

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
            <Text style={styles.liveText}>
              {streamSource === 'archive' ? 'RECORDED SERVICE' : 'LIVE BROADCAST'}
            </Text>
          </View>
          <Text style={styles.headerTitle}>Gateway Sanctuary Live Feed</Text>
        </View>

        <Pressable onPress={() => webViewRef.current?.reload()} style={styles.reloadBtn}>
          <Ionicons name="refresh" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      {/* Stream Source Selector Pills */}
      <View style={styles.sourceSelectorRow}>
        <Pressable
          style={[styles.sourcePill, streamSource === 'sanctuary' && styles.sourcePillActive]}
          onPress={() => setStreamSource('sanctuary')}
        >
          <Ionicons name="videocam" size={13} color={streamSource === 'sanctuary' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.sourcePillText, streamSource === 'sanctuary' && styles.sourcePillTextActive]}>
            Sanctuary HD Live
          </Text>
        </Pressable>

        <Pressable
          style={[styles.sourcePill, streamSource === 'facebook' && styles.sourcePillActive]}
          onPress={() => setStreamSource('facebook')}
        >
          <Ionicons name="logo-facebook" size={13} color={streamSource === 'facebook' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.sourcePillText, streamSource === 'facebook' && styles.sourcePillTextActive]}>
            Facebook Live
          </Text>
        </Pressable>

        <Pressable
          style={[styles.sourcePill, streamSource === 'archive' && styles.sourcePillActive]}
          onPress={() => setStreamSource('archive')}
        >
          <Ionicons name="time" size={13} color={streamSource === 'archive' ? '#000000' : Colors.textMuted} />
          <Text style={[styles.sourcePillText, streamSource === 'archive' && styles.sourcePillTextActive]}>
            Past Feeds
          </Text>
        </Pressable>
      </View>

      {/* Main Video Player */}
      <View style={styles.videoPlayerContainer}>
        {streamSource === 'facebook' ? (
          <View style={styles.facebookEmbedContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: 'https://m.facebook.com/profile.php?id=61559752510434&v=live' }}
              userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              mediaPlaybackRequiresUserAction={false}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.gold} />
                  <Text style={styles.loadingText}>Loading Facebook Live Feed...</Text>
                </View>
              )}
              style={{ flex: 1 }}
            />
            <View style={styles.facebookAppBanner}>
              <Text style={styles.facebookBannerText}>Open directly in Facebook App for full screen & chat:</Text>
              <Pressable style={styles.openFbBtn} onPress={handleOpenFacebookApp}>
                <Ionicons name="logo-facebook" size={14} color="#ffffff" />
                <Text style={styles.openFbBtnText}>Open App</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            key={currentYoutubeId}
            source={{
              html: streamHtml,
              baseUrl: 'https://gatewayconnect.joedaniels.org',
            }}
            originWhitelist={['*']}
            userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.gold} />
                <Text style={styles.loadingText}>Connecting to Gateway Sanctuary Live Stream...</Text>
              </View>
            )}
            style={{ flex: 1, backgroundColor: '#000000' }}
          />
        )}
      </View>

      {/* Live Stream Information & Interaction Row */}
      <View style={styles.streamInfoBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.streamTitle}>
            {streamSource === 'archive' ? selectedPastService.title : 'Sunday Glorious Service • Apostle Joe Daniels'}
          </Text>
          <Text style={styles.streamSub}>
            Main Sanctuary, Harare • 1,420 Believers Connected Globally
          </Text>
        </View>

        <Pressable
          style={[styles.streamLikeBtn, hasLiked && styles.streamLikeBtnActive]}
          onPress={() => {
            setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);
            setHasLiked(!hasLiked);
          }}
        >
          <Ionicons name={hasLiked ? 'heart' : 'heart-outline'} size={18} color={hasLiked ? '#ef4444' : Colors.gold} />
          <Text style={styles.streamLikeCount}>{likesCount}</Text>
        </Pressable>
      </View>

      {/* Past Services List (when Archive tab is active) */}
      {streamSource === 'archive' && (
        <ScrollView style={styles.archiveList} showsVerticalScrollIndicator={false}>
          <Text style={styles.archiveSectionTitle}>PAST BROADCAST FEEDS</Text>
          {PAST_SERVICES.map(svc => (
            <Pressable
              key={svc.id}
              style={[styles.archiveItem, selectedPastService.id === svc.id && styles.archiveItemActive]}
              onPress={() => setSelectedPastService(svc)}
            >
              <View style={styles.archiveItemIcon}>
                <Ionicons
                  name={selectedPastService.id === svc.id ? 'play' : 'videocam-outline'}
                  size={18}
                  color={selectedPastService.id === svc.id ? '#000000' : Colors.gold}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.archiveItemTitle}>{svc.title}</Text>
                <Text style={styles.archiveItemMeta}>{svc.date} • {svc.duration}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0e',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontFamily: Typography.fontBold,
    color: '#ef4444',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
    marginTop: 1,
  },
  reloadBtn: {
    padding: 6,
  },

  sourceSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#0f131a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a202c',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161b26',
    borderWidth: 1,
    borderColor: '#222a3b',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourcePillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  sourcePillText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  sourcePillTextActive: {
    color: '#000000',
    fontFamily: Typography.fontBold,
  },

  videoPlayerContainer: {
    height: 250,
    backgroundColor: '#000000',
    position: 'relative',
  },
  facebookEmbedContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  facebookAppBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1877f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  facebookBannerText: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    color: '#ffffff',
    fontSize: 11,
  },
  openFbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  openFbBtnText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 11,
  },

  streamInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#0c0f16',
    borderBottomWidth: 1,
    borderBottomColor: '#1a202c',
    gap: 10,
  },
  streamTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  streamSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  streamLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161c28',
    borderWidth: 1,
    borderColor: '#263147',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streamLikeBtnActive: {
    borderColor: '#ef4444',
  },
  streamLikeCount: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },

  archiveList: {
    flex: 1,
    padding: 12,
  },
  archiveSectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  archiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0e121a',
    borderWidth: 1,
    borderColor: '#1e2536',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  archiveItemActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  archiveItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#181e2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveItemTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  archiveItemMeta: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 12,
  },
});
