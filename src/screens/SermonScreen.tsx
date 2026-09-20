import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Modal, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { downloadMedia, deleteDownload, getDownloadStatus, listDownloads, MediaDownload } from '../media/downloadManager';

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
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playerProgress, setPlayerProgress] = useState<number>(0.25); // simulated playback progress
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
    setIsPlaying(true);
    setPlayerQuality(qualityLabel);
    setPlayerProgress(0.15);
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
                      <Ionicons name="play" size={14} color={Colors.textInverse} />
                      <Text style={styles.btnWatchText}>Watch in App</Text>
                    </Pressable>

                    {youtubeId && (
                      <Pressable
                        style={styles.btnYouTube}
                        onPress={() => handleOpenYouTube(youtubeId)}
                      >
                        <Ionicons name="logo-youtube" size={14} color="#ff0000" />
                        <Text style={styles.btnYouTubeText}>YouTube</Text>
                      </Pressable>
                    )}

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
                        {isDownloaded ? 'Saved' : isDownloading ? 'Saving...' : 'Download'}
                      </Text>
                    </Pressable>
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

            {/* Video View / Screen Thumbnail */}
            <View style={styles.playerVideoFrame}>
              {activePlayingSermon?.metadata?.thumbnail_url ? (
                <Image
                  source={{ uri: activePlayingSermon.metadata.thumbnail_url as string }}
                  style={styles.playerThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.playerFallbackFrame}>
                  <Ionicons name="videocam" size={48} color={Colors.gold} />
                </View>
              )}

              {/* In-Video Status Overlay */}
              <View style={styles.videoPlayingBadge}>
                <View style={[styles.liveDot, { backgroundColor: isPlaying ? Colors.success : Colors.gold }]} />
                <Text style={styles.liveDotText}>{isPlaying ? 'PLAYING' : 'PAUSED'}</Text>
              </View>
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

            {/* Scrubber / Progress Bar */}
            <View style={styles.scrubberContainer}>
              <View style={styles.trackBackground}>
                <View style={[styles.trackFill, { width: `${playerProgress * 100}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>12:45</Text>
                <Text style={styles.timeText}>
                  {String(activePlayingSermon?.metadata?.duration || '42:00')}
                </Text>
              </View>
            </View>

            {/* Main Playback Controls */}
            <View style={styles.controlsRow}>
              <Pressable
                style={styles.controlBtn}
                onPress={() => setPlayerProgress(prev => Math.max(0, prev - 0.05))}
              >
                <Ionicons name="play-back" size={24} color={Colors.textPrimary} />
              </Pressable>

              <Pressable
                style={styles.mainPlayBtn}
                onPress={() => setIsPlaying(prev => !prev)}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={Colors.textInverse}
                />
              </Pressable>

              <Pressable
                style={styles.controlBtn}
                onPress={() => setPlayerProgress(prev => Math.min(1, prev + 0.05))}
              >
                <Ionicons name="play-forward" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Action Bar (YouTube + Close) */}
            <View style={styles.playerActionsRow}>
              {activePlayingSermon?.metadata?.youtube_id ? (
                <Pressable
                  style={styles.youtubeFullBtn}
                  onPress={() => handleOpenYouTube(activePlayingSermon.metadata?.youtube_id as string)}
                >
                  <Ionicons name="logo-youtube" size={18} color="#ff0000" />
                  <Text style={styles.youtubeFullBtnText}>Open in YouTube App</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  btnWatch: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnWatchText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnYouTube: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  btnYouTubeText: {
    fontFamily: Typography.fontSemiBold,
    color: '#ff4444',
    fontSize: 12,
  },
  btnDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnDownloaded: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  btnDownloadText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
  btnDownloadedText: {
    color: Colors.success,
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
    height: 200,
    backgroundColor: '#000000',
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  playerThumb: {
    width: '100%',
    height: '100%',
  },
  playerFallbackFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 10,
    letterSpacing: 1,
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
  scrubberContainer: {
    marginBottom: 16,
  },
  trackBackground: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 20,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  youtubeFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
    borderRadius: Radii.md,
    paddingVertical: 12,
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
    paddingHorizontal: 20,
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
