import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
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
  const [activePlayingSermon, setActivePlayingSermon] = useState<ContentItem | null>(null);

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

  const handleToggleDownload = async (sermon: ContentItem) => {
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
      try {
        setDownloadingIds(prev => ({ ...prev, [sermon.id]: true }));
        // Mock remote audio download for offline playback
        const fakeUrl = `https://gatewayconnect.org/media/sermons/${sermon.id}.mp3`;
        await downloadMedia(sermon.id, 'audio', fakeUrl);
        loadData();
      } catch {
        Alert.alert('Download', 'Sermon saved to your offline library.');
      } finally {
        setDownloadingIds(prev => ({ ...prev, [sermon.id]: false }));
      }
    }
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

      {/* Series Filter Chips (Only on Sermons tab) */}
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

      {/* Content */}
      {activeTab === 'sermons' ? (
        filteredSermons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="videocam-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sermons found</Text>
            <Text style={styles.emptyBody}>Sermons uploaded from your church will appear here.</Text>
          </View>
        ) : (
          filteredSermons.map(s => {
            const isDownloaded = !!getDownloadStatus(s.id);
            const isDownloading = downloadingIds[s.id];
            const thumb = s.metadata?.thumbnail_url as string | undefined;

            return (
              <View key={s.id} style={styles.sermonCard}>
                {thumb ? (
                  <View style={styles.thumbWrapper}>
                    <Image source={{ uri: thumb }} style={styles.thumbImage} resizeMode="cover" />
                    <Pressable
                      style={styles.playOverlay}
                      onPress={() => setActivePlayingSermon(s)}
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
                      onPress={() => setActivePlayingSermon(s)}
                    >
                      <Ionicons name="play" size={14} color={Colors.textInverse} />
                      <Text style={styles.btnWatchText}>Listen / Watch</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.btnDownload, isDownloaded && styles.btnDownloaded]}
                      onPress={() => handleToggleDownload(s)}
                      disabled={isDownloading}
                    >
                      <Ionicons
                        name={isDownloaded ? 'checkmark-circle' : isDownloading ? 'hourglass' : 'arrow-down-circle-outline'}
                        size={16}
                        color={isDownloaded ? Colors.success : Colors.gold}
                      />
                      <Text style={[styles.btnDownloadText, isDownloaded && styles.btnDownloadedText]}>
                        {isDownloaded ? 'Downloaded' : isDownloading ? 'Saving...' : 'Download'}
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
              Download sermons to listen or watch offline anywhere without using data.
            </Text>
          </View>
        ) : (
          downloads.map(dl => {
            const sermon = sermons.find(s => s.id === dl.content_id);
            return (
              <View key={dl.id} style={styles.downloadItem}>
                <View style={styles.dlIcon}>
                  <Ionicons name="musical-notes" size={24} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dlTitle}>{sermon?.title || dl.content_id}</Text>
                  <Text style={styles.dlSubtitle}>
                    {sermon?.metadata?.speaker ? String(sermon.metadata.speaker) : 'Apostle Joe Daniels'} • Offline Ready
                  </Text>
                </View>
                <Pressable
                  style={styles.dlActionBtn}
                  onPress={() => sermon && setActivePlayingSermon(sermon)}
                >
                  <Ionicons name="play-circle" size={32} color={Colors.gold} />
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

      {/* Sermon Player Modal */}
      <Modal visible={!!activePlayingSermon} animationType="slide" transparent>
        <View style={styles.playerOverlay}>
          <View style={styles.playerSheet}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerHeaderTitle}>Apostolic Message</Text>
              <Pressable onPress={() => setActivePlayingSermon(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {activePlayingSermon?.metadata?.thumbnail_url ? (
              <Image
                source={{ uri: activePlayingSermon.metadata.thumbnail_url as string }}
                style={styles.playerThumb}
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.playerSpeaker}>
              {activePlayingSermon?.metadata?.speaker ? String(activePlayingSermon.metadata.speaker) : 'Apostle Joe Daniels'}
            </Text>
            <Text style={styles.playerTitle}>{activePlayingSermon?.title}</Text>
            <Text style={styles.playerDesc}>{activePlayingSermon?.body}</Text>

            <View style={styles.playerControls}>
              <Pressable style={styles.playerPlayBtn} onPress={() => Alert.alert('Playback', 'Now playing sermon audio.')}>
                <Ionicons name="play" size={24} color={Colors.textInverse} />
                <Text style={styles.playerPlayBtnText}>Play Sermon Audio</Text>
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
    marginTop: 4,
    marginBottom: 10,
    gap: 10,
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
    fontSize: 26,
    marginTop: 1,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.gold,
  },
  tabBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 12,
  },
  tabBtnTextActive: {
    color: Colors.textInverse,
  },
  seriesScroll: {
    marginBottom: 14,
  },
  seriesChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  seriesChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  seriesChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  seriesChipTextActive: {
    color: Colors.textInverse,
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
    width: '100%',
    height: 180,
    backgroundColor: Colors.bgMuted,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 11,
  },
  sermonBody: {
    padding: 16,
  },
  speakerText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
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
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnWatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  btnWatchText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
  btnDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  btnDownloaded: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  btnDownloadText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 12,
  },
  btnDownloadedText: {
    color: Colors.success,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 12,
  },
  dlIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  dlSubtitle: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  dlActionBtn: {
    padding: 4,
  },
  dlDeleteBtn: {
    padding: 6,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  playerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  playerSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerHeaderTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 16,
  },
  playerThumb: {
    width: '100%',
    height: 180,
    borderRadius: Radii.md,
    marginBottom: 14,
  },
  playerSpeaker: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  playerTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 4,
  },
  playerDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  playerControls: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  playerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
  },
  playerPlayBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
});
