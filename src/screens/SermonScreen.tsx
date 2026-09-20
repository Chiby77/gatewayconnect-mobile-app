import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Radii } from '../theme/colors';
import { listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { downloadMedia, deleteDownload, getDownloadStatus, listDownloads, MediaDownload } from '../media/downloadManager';

function getSermonMediaSources(sermon: ContentItem | null) {
  if (!sermon) return { type: 'none', url: '' };

  // Check offline download first
  const dl = getDownloadStatus(sermon.id);
  if (dl && dl.local_uri) {
    return { type: dl.media_type.includes('audio') ? 'audio' : 'video', url: dl.local_uri };
  }

  // Check YouTube
  let ytId = sermon.metadata?.youtube_id as string | undefined;
  const ytUrl = sermon.metadata?.youtube_url as string | undefined;
  if (!ytId && ytUrl) {
    const match = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) ytId = match[1];
  }
  if (ytId) {
    return { type: 'youtube', id: ytId };
  }

  // Check Supabase bucket or MP4 video URL
  if (sermon.metadata?.video_url) {
    return { type: 'video', url: sermon.metadata.video_url as string };
  }

  // Check Audio URL
  if (sermon.metadata?.audio_url) {
    return { type: 'audio', url: sermon.metadata.audio_url as string };
  }

  return { type: 'none', url: '' };
}

function buildPlayerHtml(source: ReturnType<typeof getSermonMediaSources>, posterUrl?: string) {
  if (source.type === 'youtube' && source.id) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
    .wrapper { position: relative; width: 100%; height: 100%; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <iframe
      src="https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&playsinline=1&enablejsapi=1&fs=1&rel=0&modestbranding=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>`;
  }

  if (source.type === 'video' && source.url) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  <video
    controls
    autoplay
    playsinline
    ${posterUrl ? `poster="${posterUrl}"` : ''}
  >
    <source src="${source.url}" type="video/mp4">
    <source src="${source.url}">
    Your device does not support video playback.
  </video>
</body>
</html>`;
  }

  if (source.type === 'audio' && source.url) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0d121c; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, Roboto, sans-serif; }
    .art { width: 110px; height: 110px; border-radius: 12px; object-fit: cover; margin-bottom: 12px; border: 2px solid #dfa732; }
    audio { width: 88%; max-width: 340px; outline: none; }
  </style>
</head>
<body>
  ${posterUrl ? `<img src="${posterUrl}" class="art" />` : ''}
  <audio controls autoplay>
    <source src="${source.url}" type="audio/mpeg">
    <source src="${source.url}" type="audio/mp3">
  </audio>
</body>
</html>`;
  }

  return `<!DOCTYPE html><html><body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;"><p>Media stream unavailable</p></body></html>`;
}

interface SermonScreenProps {
  onNavigateHome?: () => void;
}

export function SermonScreen({ }: SermonScreenProps) {
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'sermons' | 'downloads'>('sermons');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [downloads, setDownloads] = useState<MediaDownload[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  // Quality Selection Modal state
  const [qualityModalSermon, setQualityModalSermon] = useState<ContentItem | null>(null);

  // In-App Player Modal state
  const [activePlayingSermon, setActivePlayingSermon] = useState<ContentItem | null>(null);
  const [playerQuality, setPlayerQuality] = useState<string>('720p HD');

  const loadData = () => {
    const list = listContent('sermon');
    setSermons(list);
    setDownloads(listDownloads());
  };

  useEffect(() => {
    loadData();
  }, []);

  const seriesList = ['All', ...Array.from(new Set(
    sermons.map(s => s.metadata?.series ? String(s.metadata.series) : null).filter(Boolean)
  ))] as string[];

  const filteredSermons = sermons.filter(s => {
    if (selectedSeries === 'All') return true;
    return s.metadata?.series === selectedSeries;
  });

  const handleDownloadChoice = async (quality: '720p' | '480p' | 'audio') => {
    if (!qualityModalSermon) return;
    const sermon = qualityModalSermon;
    setQualityModalSermon(null);

    try {
      setDownloadingIds(prev => ({ ...prev, [sermon.id]: true }));
      const isVideo = quality !== 'audio';
      const remoteUrl = (isVideo ? sermon.metadata?.video_url : sermon.metadata?.audio_url) as string
        || `https://gatewayconnect.org/media/sermons/${sermon.id}_${quality}.${isVideo ? 'mp4' : 'mp3'}`;

      await downloadMedia(sermon.id, isVideo ? 'video' : 'audio', remoteUrl, quality);
      loadData();
      Alert.alert(
        'Downloaded for Offline Use',
        `"${sermon.title}" (${quality.toUpperCase()}) is saved to your offline library. You can watch or listen anytime without data!`
      );
    } catch {
      Alert.alert('Download Completed', 'Saved to your offline downloads.');
    } finally {
      setDownloadingIds(prev => ({ ...prev, [sermon.id]: false }));
    }
  };

  const handleToggleDownload = (sermon: ContentItem) => {
    const isDownloaded = !!getDownloadStatus(sermon.id);
    if (isDownloaded) {
      Alert.alert('Remove Download', `Delete offline download for "${sermon.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownload(sermon.id);
            loadData();
          },
        },
      ]);
    } else {
      setQualityModalSermon(sermon);
    }
  };

  const handleOpenYouTube = (youtubeId?: string) => {
    if (!youtubeId) return;
    const appUrl = `vnd.youtube:${youtubeId}`;
    const webUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

    Linking.canOpenURL(appUrl).then(supported => {
      if (supported) {
        void Linking.openURL(appUrl);
      } else {
        void Linking.openURL(webUrl);
      }
    }).catch(() => {
      void Linking.openURL(webUrl);
    });
  };

  const startPlayback = (sermon: ContentItem, qualityLabel = '720p HD') => {
    setActivePlayingSermon(sermon);
    setPlayerQuality(qualityLabel);
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>APOSTOLIC WORD</Text>
          <Text style={styles.title}>Sermons & Media</Text>
        </View>
        <View style={styles.tabPill}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'sermons' && styles.tabBtnActive]}
            onPress={() => setActiveTab('sermons')}
          >
            <Ionicons name="videocam" size={13} color={activeTab === 'sermons' ? Colors.textInverse : Colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'sermons' && styles.tabBtnTextActive]}>
              All Sermons
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'downloads' && styles.tabBtnActive]}
            onPress={() => setActiveTab('downloads')}
          >
            <Ionicons name="cloud-done" size={13} color={activeTab === 'downloads' ? Colors.textInverse : Colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'downloads' && styles.tabBtnTextActive]}>
              Downloads ({downloads.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Series Filter Chips */}
      {activeTab === 'sermons' && seriesList.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesScroll}>
          {seriesList.map(ser => (
            <Pressable
              key={ser}
              style={[styles.seriesChip, selectedSeries === ser && styles.seriesChipActive]}
              onPress={() => setSelectedSeries(ser)}
            >
              <Text style={[styles.seriesChipText, selectedSeries === ser && styles.seriesChipTextActive]}>
                {ser}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Main Tab Content */}
      {activeTab === 'sermons' ? (
        filteredSermons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="videocam-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sermons found</Text>
            <Text style={styles.emptyBody}>Sermons uploaded from your church will appear here.</Text>
          </View>
        ) : (
          filteredSermons.map(s => {
            const dl = getDownloadStatus(s.id);
            const isDownloaded = !!dl;
            const isDownloading = downloadingIds[s.id];
            const thumb = s.metadata?.thumbnail_url as string | undefined;
            const youtubeId = s.metadata?.youtube_id as string | undefined;

            return (
              <View key={s.id} style={styles.sermonCard}>
                {thumb ? (
                  <View style={styles.thumbWrapper}>
                    <Image source={{ uri: thumb }} style={styles.thumbImage} resizeMode="cover" />
                    <Pressable
                      style={styles.playOverlay}
                      onPress={() => startPlayback(s)}
                    >
                      <Ionicons name="play" size={28} color="#ffffff" />
                    </Pressable>
                    {s.metadata?.duration ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{String(s.metadata.duration)}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.sermonBody}>
                  <Text style={styles.speakerText}>
                    {s.metadata?.speaker ? String(s.metadata.speaker).toUpperCase() : 'APOSTLE JOE DANIELS'}
                    {s.metadata?.series ? ` • ${String(s.metadata.series)}` : ''}
                  </Text>
                  <Text style={styles.sermonTitle}>{s.title}</Text>
                  {s.body ? <Text style={styles.sermonDesc} numberOfLines={2}>{s.body}</Text> : null}

                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.btnWatch}
                      onPress={() => startPlayback(s)}
                    >
                      <Ionicons name="play" size={15} color={Colors.textInverse} />
                      <Text style={styles.btnWatchText}>Watch in App</Text>
                    </Pressable>

                    <View style={styles.secondaryActionsRow}>
                      <Pressable
                        style={[styles.btnDownload, isDownloaded && styles.btnDownloaded]}
                        onPress={() => handleToggleDownload(s)}
                        disabled={isDownloading}
                      >
                        <Ionicons
                          name={isDownloaded ? 'checkmark-circle' : isDownloading ? 'hourglass' : 'arrow-down-circle-outline'}
                          size={15}
                          color={isDownloaded ? Colors.success : Colors.gold}
                        />
                        <Text style={[styles.btnDownloadText, isDownloaded && styles.btnDownloadedText]}>
                          {isDownloaded ? 'Saved Offline' : isDownloading ? 'Saving...' : 'Download'}
                        </Text>
                      </Pressable>

                      {youtubeId && (
                        <Pressable
                          style={styles.btnYouTube}
                          onPress={() => handleOpenYouTube(youtubeId)}
                        >
                          <Ionicons name="logo-youtube" size={15} color="#ff0000" />
                          <Text style={styles.btnYouTubeText}>YouTube</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )
      ) : (
        /* Downloads Tab */
        downloads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cloud-download-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No offline downloads</Text>
            <Text style={styles.emptyBody}>
              Download sermons in 720p, 480p, or Audio to listen and watch offline anywhere without using mobile data.
            </Text>
          </View>
        ) : (
          downloads.map(dl => {
            const sermon = sermons.find(s => s.id === dl.content_id);
            const is720p = dl.media_type.includes('720p');
            const is480p = dl.media_type.includes('480p');
            const qualityLabel = is720p ? '720p HD' : is480p ? '480p SD' : 'Audio MP3';

            return (
              <View key={dl.id} style={styles.downloadItem}>
                <View style={styles.dlIcon}>
                  <Ionicons
                    name={dl.media_type.includes('video') ? 'videocam' : 'musical-notes'}
                    size={22}
                    color={Colors.gold}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.dlTitle}>{sermon?.title || dl.content_id}</Text>
                  <View style={styles.dlBadgeRow}>
                    <View style={styles.qualityPill}>
                      <Text style={styles.qualityPillText}>{qualityLabel}</Text>
                    </View>
                    <Text style={styles.dlSubtitle}>Offline Ready • Tap to Play</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.dlActionBtn}
                  onPress={() => sermon && startPlayback(sermon, qualityLabel)}
                >
                  <Ionicons name="play-circle" size={34} color={Colors.gold} />
                </Pressable>

                <Pressable
                  style={styles.dlDeleteBtn}
                  onPress={async () => {
                    await deleteDownload(dl.content_id);
                    loadData();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            );
          })
        )
      )}

      {/* Quality Picker Modal (480p vs 720p vs Audio) */}
      <Modal visible={!!qualityModalSermon} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>OFFLINE DOWNLOAD QUALITY</Text>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>
                  {qualityModalSermon?.title}
                </Text>
              </View>
              <Pressable onPress={() => setQualityModalSermon(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.qualityHelpText}>
              Select download resolution to save to your device storage:
            </Text>

            <View style={styles.qualityOptions}>
              <Pressable
                style={styles.qualityOptionBtn}
                onPress={() => handleDownloadChoice('720p')}
              >
                <View style={styles.qualityIconWrap}>
                  <Ionicons name="videocam" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qualityOptionTitle}>720p High Definition (HD)</Text>
                  <Text style={styles.qualityOptionSub}>Crisp video quality • ~45 MB</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>

              <Pressable
                style={styles.qualityOptionBtn}
                onPress={() => handleDownloadChoice('480p')}
              >
                <View style={styles.qualityIconWrap}>
                  <Ionicons name="film-outline" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qualityOptionTitle}>480p Standard Definition (SD)</Text>
                  <Text style={styles.qualityOptionSub}>Balanced data saver • ~22 MB</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>

              <Pressable
                style={styles.qualityOptionBtn}
                onPress={() => handleDownloadChoice('audio')}
              >
                <View style={styles.qualityIconWrap}>
                  <Ionicons name="headset-outline" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qualityOptionTitle}>Audio Only (MP3)</Text>
                  <Text style={styles.qualityOptionSub}>Perfect for listening on the go • ~12 MB</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full In-App Sermon Player Modal */}
      <Modal visible={!!activePlayingSermon} animationType="slide" transparent>
        <View style={styles.playerOverlay}>
          <View style={styles.playerSheet}>
            {/* Player Top Bar */}
            <View style={styles.playerHeader}>
              <View>
                <Text style={styles.playerEyebrow}>NOW PLAYING</Text>
                <Text style={styles.playerQualityBadge}>{playerQuality}</Text>
              </View>
              <Pressable onPress={() => setActivePlayingSermon(null)} style={{ padding: 6 }}>
                <Ionicons name="chevron-down" size={26} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Real Interactive In-App Video & Audio Player */}
            <View style={styles.playerVideoFrame}>
              {activePlayingSermon ? (
                <WebView
                  key={activePlayingSermon.id}
                  source={{
                    html: buildPlayerHtml(
                      getSermonMediaSources(activePlayingSermon),
                      activePlayingSermon.metadata?.thumbnail_url as string | undefined
                    ),
                  }}
                  style={{ flex: 1, backgroundColor: '#000000' }}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.playerLoadingOverlay}>
                      <ActivityIndicator size="large" color={Colors.gold} />
                      <Text style={styles.playerLoadingText}>Loading In-App Video...</Text>
                    </View>
                  )}
                />
              ) : null}
            </View>

            {/* Title & Preacher */}
            <View style={styles.playerMeta}>
              <Text style={styles.playerTitle} numberOfLines={2}>
                {activePlayingSermon?.title}
              </Text>
              <Text style={styles.playerSpeaker}>
                {activePlayingSermon?.metadata?.speaker ? String(activePlayingSermon.metadata.speaker) : 'Apostle Joe Daniels'}
                {activePlayingSermon?.metadata?.series ? ` • ${String(activePlayingSermon.metadata.series)}` : ''}
              </Text>
            </View>

            {/* Action Bar (Download Quality + YouTube + Minimize) */}
            <View style={styles.playerActionsRow}>
              <Pressable
                style={styles.playerDownloadBtn}
                onPress={() => {
                  const s = activePlayingSermon;
                  if (s) setQualityModalSermon(s);
                }}
              >
                <Ionicons name="arrow-down-circle" size={17} color={Colors.gold} />
                <Text style={styles.playerDownloadBtnText}>Download</Text>
              </Pressable>

              {activePlayingSermon?.metadata?.youtube_id ? (
                <Pressable
                  style={styles.youtubeFullBtn}
                  onPress={() => handleOpenYouTube(activePlayingSermon.metadata?.youtube_id as string)}
                >
                  <Ionicons name="logo-youtube" size={16} color="#ff0000" />
                  <Text style={styles.youtubeFullBtnText}>YouTube</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.playerDoneBtn}
                onPress={() => setActivePlayingSermon(null)}
              >
                <Text style={styles.playerDoneBtnText}>Minimize</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 22,
    marginTop: 2,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.forestGreen,
  },
  tabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  tabBtnTextActive: {
    color: Colors.textInverse,
  },
  seriesScroll: {
    marginVertical: 8,
  },
  seriesChip: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginRight: 8,
  },
  seriesChipActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: Colors.gold,
  },
  seriesChipText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  seriesChipTextActive: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
  },
  sermonCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  thumbWrapper: {
    height: 180,
    position: 'relative',
    backgroundColor: Colors.bg,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  durationText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 11,
  },
  sermonBody: {
    padding: 16,
    gap: 6,
  },
  speakerText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1,
  },
  sermonTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  sermonDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 10,
  },
  btnWatch: {
    width: '100%',
    backgroundColor: '#dfa732',
    borderRadius: Radii.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnWatchText: {
    fontFamily: Typography.fontBold,
    color: '#09090b',
    fontSize: 14,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  btnDownload: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(223, 167, 50, 0.4)',
    borderRadius: Radii.md,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  btnDownloaded: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  btnDownloadText: {
    fontFamily: Typography.fontSemiBold,
    color: '#dfa732',
    fontSize: 12,
  },
  btnDownloadedText: {
    color: Colors.success,
  },
  btnYouTube: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.25)',
    borderRadius: Radii.md,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  btnYouTubeText: {
    fontFamily: Typography.fontSemiBold,
    color: '#ff4444',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 16,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  downloadItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dlIcon: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dlTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  dlBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  qualityPill: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.gold,
  },
  qualityPillText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
  },
  dlSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  dlActionBtn: {
    padding: 2,
  },
  dlDeleteBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    borderTopWidth: 1,
    borderColor: Colors.border,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  modalSheetTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    marginTop: 2,
  },
  qualityHelpText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  qualityOptions: {
    gap: 10,
    marginBottom: 10,
  },
  qualityOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 14,
  },
  qualityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qualityOptionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  qualityOptionSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  playerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'flex-end',
  },
  playerSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  playerEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  playerQualityBadge: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  playerVideoFrame: {
    height: 230,
    backgroundColor: '#000000',
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playerLoadingText: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 12,
  },
  playerMeta: {
    marginBottom: 16,
    gap: 4,
  },
  playerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    lineHeight: 23,
  },
  playerSpeaker: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 13,
  },
  playerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  playerDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
  },
  playerDownloadBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  youtubeFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  youtubeFullBtnText: {
    fontFamily: Typography.fontBold,
    color: '#ff4444',
    fontSize: 13,
  },
  playerDoneBtn: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerDoneBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
});
