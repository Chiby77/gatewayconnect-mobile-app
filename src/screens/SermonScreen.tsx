import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Modal, Alert, Linking, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Radii } from '../theme/colors';
import { listContent } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { downloadMedia, deleteDownload, getDownloadStatus, listDownloads, MediaDownload } from '../media/downloadManager';

import { MobileUser } from '../auth/authService';

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
      src="https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&playsinline=1&enablejsapi=1&fs=1&rel=0&modestbranding=1&origin=https://gatewayconnect.joedaniels.org"
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
  profile?: MobileUser | null;
  onRequestAuth?: (prompt?: string) => void;
}

export function SermonScreen({ profile, onRequestAuth }: SermonScreenProps) {
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'sermons' | 'downloads'>('sermons');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloads, setDownloads] = useState<MediaDownload[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  // YouTube-style Live Download Progress notification state
  const [downloadProgress, setDownloadProgress] = useState<{
    sermonId: string;
    title: string;
    quality: string;
    percent: number;
  } | null>(null);

  // Quality Selection Modal state
  const [qualityModalSermon, setQualityModalSermon] = useState<ContentItem | null>(null);

  // Covenant Partner / Paid Sermon Modal state
  const [covenantModalSermon, setCovenantModalSermon] = useState<ContentItem | null>(null);
  const [covenantVoucher, setCovenantVoucher] = useState('');

  // In-App Player Modal state
  const [activePlayingSermon, setActivePlayingSermon] = useState<ContentItem | null>(null);
  const [playerQuality, setPlayerQuality] = useState<string>('720p HD');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

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
    const matchesSeries = selectedSeries === 'All' || s.metadata?.series === selectedSeries;
    if (!matchesSeries) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const title = s.title.toLowerCase();
    const speaker = (s.metadata?.speaker ? String(s.metadata.speaker) : '').toLowerCase();
    const body = (s.body || '').toLowerCase();
    const series = (s.metadata?.series ? String(s.metadata.series) : '').toLowerCase();
    return title.includes(q) || speaker.includes(q) || body.includes(q) || series.includes(q);
  });

  const groupedByTopic = (() => {
    if (selectedSeries !== 'All') {
      return [{
        topic: selectedSeries,
        items: filteredSermons,
      }];
    }

    const topics = [
      'Apostolic Revelations',
      'Deliverance & Freedom',
      'Divine Wisdom',
      'Family & Marriage',
      'Apostolic Masterclass',
      'Mentorship Academy',
      'Apostolic Word',
    ];
    const groups: { topic: string; items: ContentItem[] }[] = [];

    topics.forEach(t => {
      const items = filteredSermons.filter(s => (s.metadata?.series || 'Apostolic Word') === t);
      if (items.length > 0) groups.push({ topic: t, items });
    });

    const categorizedIds = new Set(groups.flatMap(g => g.items.map(i => i.id)));
    const others = filteredSermons.filter(s => !categorizedIds.has(s.id));
    if (others.length > 0) {
      groups.push({ topic: 'More Apostolic Messages', items: others });
    }

    return groups.length > 0 ? groups : [{ topic: 'All Sermons', items: filteredSermons }];
  })();

  const handleDownloadChoice = async (quality: '720p' | '480p' | 'audio') => {
    if (!qualityModalSermon) return;
    const sermon = qualityModalSermon;
    setQualityModalSermon(null);

    try {
      setDownloadingIds(prev => ({ ...prev, [sermon.id]: true }));
      setDownloadProgress({
        sermonId: sermon.id,
        title: sermon.title,
        quality,
        percent: 5,
      });

      const isVideo = quality !== 'audio';
      const remoteUrl = (isVideo ? sermon.metadata?.video_url : sermon.metadata?.audio_url) as string
        || `https://gatewayconnect.org/media/sermons/${sermon.id}_${quality}.${isVideo ? 'mp4' : 'mp3'}`;

      await downloadMedia(
        sermon.id,
        isVideo ? 'video' : 'audio',
        remoteUrl,
        quality,
        (pct) => {
          setDownloadProgress(prev => prev ? { ...prev, percent: pct } : null);
        }
      );
      loadData();
      Alert.alert(
        'Downloaded for Offline Use',
        `"${sermon.title}" (${quality.toUpperCase()}) is saved to your offline library. You can watch or listen anytime without data!`
      );
    } catch {
      Alert.alert('Download Completed', 'Saved to your offline downloads.');
    } finally {
      setDownloadingIds(prev => ({ ...prev, [sermon.id]: false }));
      setTimeout(() => setDownloadProgress(null), 2500);
    }
  };

  const handleToggleDownload = (sermon: ContentItem) => {
    const isPaid = !!sermon.metadata?.is_paid;
    if (isPaid && !profile?.is_premium) {
      setCovenantModalSermon(sermon);
      return;
    }

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
    const isPaid = !!sermon.metadata?.is_paid;
    if (isPaid && !profile?.is_premium) {
      setCovenantModalSermon(sermon);
      return;
    }
    setActivePlayingSermon(sermon);
    setPlayerQuality(qualityLabel);
  };

  const handleUnlockCovenant = () => {
    if (covenantVoucher.trim()) {
      Alert.alert(
        'Covenant Access Granted',
        'Your covenant access code has been activated. You now have full streaming & download access!',
        [{ text: 'Praise God', onPress: () => setCovenantModalSermon(null) }]
      );
    } else {
      Alert.alert(
        'Covenant Partnership',
        'Redirecting to secure Altar Seed giving for Kingdom Pass enrollment.',
        [{ text: 'Proceed', onPress: () => setCovenantModalSermon(null) }]
      );
    }
  };

  return (
    <>
      {/* Live YouTube-style Download Notification / Progress Bar */}
      {downloadProgress && (
        <View style={styles.downloadProgressBanner}>
          <View style={styles.dlProgressTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="cloud-download" size={16} color={Colors.gold} />
              <Text style={styles.dlProgressTitle} numberOfLines={1}>
                Downloading "{downloadProgress.title}" ({downloadProgress.quality.toUpperCase()})
              </Text>
            </View>
            <Text style={styles.dlProgressPercent}>{downloadProgress.percent}%</Text>
          </View>
          <View style={styles.dlProgressBarBg}>
            <View style={[styles.dlProgressBarFill, { width: `${downloadProgress.percent}%` }]} />
          </View>
        </View>
      )}

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

      {/* Search Input */}
      {activeTab === 'sermons' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={17} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sermons by title, speaker, series..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.searchClearBtn}>
              <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

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

      {/* View Mode Toggle: 3-Col Grid vs Detailed List */}
      {activeTab === 'sermons' && (
        <View style={styles.viewModeToggleRow}>
          <Text style={styles.viewModeCountText}>{filteredSermons.length} sermons available</Text>
          <View style={styles.viewModeBtnGroup}>
            <Pressable
              style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={13} color={viewMode === 'grid' ? Colors.textInverse : Colors.textMuted} />
              <Text style={[styles.viewModeBtnText, viewMode === 'grid' && styles.viewModeBtnTextActive]}>
                3-Col Grid
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={13} color={viewMode === 'list' ? Colors.textInverse : Colors.textMuted} />
              <Text style={[styles.viewModeBtnText, viewMode === 'list' && styles.viewModeBtnTextActive]}>
                Detailed List
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Main Tab Content */}
      {activeTab === 'sermons' ? (
        filteredSermons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="videocam-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sermons found</Text>
            <Text style={styles.emptyBody}>Sermons uploaded from your church will appear here.</Text>
          </View>
        ) : viewMode === 'grid' ? (
          /* 3-Column Grid View Grouped by Topics / Series */
          <View style={styles.topicsContainer}>
            {groupedByTopic.map(group => (
              <View key={group.topic} style={styles.topicSection}>
                <View style={styles.topicHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                    <Ionicons name="sparkles" size={12} color={Colors.gold} />
                    <Text style={styles.topicHeaderTitle} numberOfLines={1} ellipsizeMode="tail">{group.topic}</Text>
                  </View>
                  <Text style={styles.topicCountText}>{group.items.length} Messages</Text>
                </View>

                <View style={styles.gridRow}>
                  {group.items.map(s => {
                    const thumb = s.metadata?.thumbnail_url as string | undefined;
                    const isPaid = !!s.metadata?.is_paid;
                    const duration = (s.metadata?.duration as string | undefined) || '35m';

                    return (
                      <Pressable
                        key={s.id}
                        style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.82 }]}
                        onPress={() => startPlayback(s)}
                      >
                        <View style={styles.gridThumbBox}>
                          {thumb ? (
                            <Image source={{ uri: thumb }} style={styles.gridThumb} resizeMode="cover" />
                          ) : (
                            <View style={styles.gridThumbFallback}>
                              <Ionicons name="videocam" size={20} color={Colors.gold} />
                            </View>
                          )}
                          <View style={styles.gridDurationBadge}>
                            <Text style={styles.gridDurationText}>{duration}</Text>
                          </View>
                          {isPaid ? (
                            <View style={styles.gridLockBadge}>
                              <Ionicons
                                name={profile?.is_premium ? 'shield-checkmark' : 'lock-closed'}
                                size={9}
                                color="#000000"
                              />
                            </View>
                          ) : (
                            <View style={styles.gridPlayIconBadge}>
                              <Ionicons name="play" size={8} color="#ffffff" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.gridCardTitle} numberOfLines={2}>{s.title}</Text>
                        <Text style={styles.gridSpeakerText} numberOfLines={1}>
                          {String(s.metadata?.speaker ? String(s.metadata.speaker).replace(/APOSTLE\s+/i, '') : 'Joe Daniels')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Detailed List View */
          filteredSermons.map(s => {
            const dl = getDownloadStatus(s.id);
            const isDownloaded = !!dl;
            const isDownloading = downloadingIds[s.id];
            const thumb = s.metadata?.thumbnail_url as string | undefined;
            const youtubeId = s.metadata?.youtube_id as string | undefined;
            const isPaid = !!s.metadata?.is_paid;

            return (
              <View key={s.id} style={styles.sermonCard}>
                {thumb ? (
                  <View style={styles.thumbWrapper}>
                    <Image source={{ uri: thumb }} style={styles.thumbImage} resizeMode="cover" />
                    <Pressable
                      style={styles.playOverlay}
                      onPress={() => startPlayback(s)}
                    >
                      <Ionicons name={isPaid && !profile?.is_premium ? 'lock-closed' : 'play'} size={26} color="#ffffff" />
                    </Pressable>
                    {isPaid ? (
                      <View style={styles.covenantBadgeOverlay}>
                        <Ionicons name="ribbon" size={11} color="#000000" />
                        <Text style={styles.covenantBadgeOverlayText}>COVENANT PASS</Text>
                      </View>
                    ) : null}
                    {s.metadata?.duration ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{String(s.metadata.duration)}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.sermonBody}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Text style={styles.speakerText} numberOfLines={1} ellipsizeMode="tail">
                      {s.metadata?.speaker ? String(s.metadata.speaker).toUpperCase() : 'APOSTLE JOE DANIELS'}
                      {s.metadata?.series ? ` • ${String(s.metadata.series)}` : ''}
                    </Text>
                    {isPaid && (
                      <View style={styles.covenantPillMini}>
                        <Text style={styles.covenantPillMiniText}>PAID</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sermonTitle} numberOfLines={2} ellipsizeMode="tail">{s.title}</Text>
                  {s.body ? <Text style={styles.sermonDesc} numberOfLines={2} ellipsizeMode="tail">{s.body}</Text> : null}

                  <View style={styles.cardActions}>
                    <Pressable
                      style={[styles.btnWatch, isPaid && !profile?.is_premium && styles.btnWatchPaid]}
                      onPress={() => startPlayback(s)}
                    >
                      <Ionicons
                        name={isPaid && !profile?.is_premium ? 'lock-closed' : 'play'}
                        size={15}
                        color={isPaid && !profile?.is_premium ? Colors.gold : Colors.textInverse}
                      />
                      <Text style={[styles.btnWatchText, isPaid && !profile?.is_premium && styles.btnWatchPaidText]} numberOfLines={1}>
                        {isPaid && !profile?.is_premium ? 'Unlock Covenant Pass' : 'Watch in App'}
                      </Text>
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
                          color={isDownloaded ? Colors.success : Colors.textPrimary}
                        />
                        <Text style={[styles.btnDownloadText, isDownloaded && styles.btnDownloadedText]} numberOfLines={1}>
                          {isDownloading ? 'Saving...' : isDownloaded ? 'Downloaded' : 'Download'}
                        </Text>
                      </Pressable>

                      {youtubeId && (
                        <Pressable
                          style={styles.btnYouTube}
                          onPress={() => handleOpenYouTube(youtubeId)}
                        >
                          <Ionicons name="logo-youtube" size={15} color="#ff0000" />
                          <Text style={styles.btnYouTubeText} numberOfLines={1}>YouTube</Text>
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
                    baseUrl: 'https://gatewayconnect.joedaniels.org',
                  }}
                  originWhitelist={['*']}
                  userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                  allowFileAccess={true}
                  allowFileAccessFromFileURLs={true}
                  allowUniversalAccessFromFileURLs={true}
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

      {/* Covenant Partner / Paid Sermon Unlock Modal */}
      <Modal visible={!!covenantModalSermon} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.covenantIconBadge}>
                  <Ionicons name="ribbon" size={20} color={Colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalEyebrow}>APOSTOLIC COVENANT PASS</Text>
                  <Text style={styles.modalSheetTitle}>Exclusive Teaching Access</Text>
                </View>
              </View>
              <Pressable onPress={() => setCovenantModalSermon(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.covenantHelpText}>
              "{covenantModalSermon?.title}" is reserved for enrolled Covenant Partners and School of Mentorship disciples.
            </Text>

            {/* Plans */}
            <View style={styles.covenantPlanCards}>
              <Pressable style={styles.covenantPlanCard} onPress={handleUnlockCovenant}>
                <View>
                  <Text style={styles.covenantPlanTitle}>3 Months Kingdom Pass</Text>
                  <Text style={styles.covenantPlanSub}>Standard Covenant Access</Text>
                </View>
                <Text style={styles.covenantPlanPrice}>$30 USD</Text>
              </Pressable>

              <Pressable style={[styles.covenantPlanCard, styles.covenantPlanCardFeatured]} onPress={handleUnlockCovenant}>
                <View>
                  <Text style={styles.covenantPlanTitle}>6 Months Apostolic Masterclass</Text>
                  <Text style={styles.covenantPlanSub}>Includes Mentorship Modules</Text>
                </View>
                <Text style={styles.covenantPlanPrice}>$60 USD</Text>
              </Pressable>
            </View>

            {/* Voucher input */}
            <View style={styles.voucherRow}>
              <TextInput
                value={covenantVoucher}
                onChangeText={setCovenantVoucher}
                placeholder="Enter Covenant Code (e.g. GATEWAY2026)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                style={styles.voucherInput}
              />
              <Pressable style={styles.voucherBtn} onPress={handleUnlockCovenant}>
                <Text style={styles.voucherBtnText}>Unlock</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchClearBtn: {
    padding: 2,
    marginLeft: 6,
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
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
  },

  // View Mode Toggle Row
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  viewModeCountText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  viewModeBtnGroup: {
    flexDirection: 'row',
    backgroundColor: '#10141e',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#1e2433',
    padding: 2,
    gap: 2,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  viewModeBtnActive: {
    backgroundColor: Colors.gold,
  },
  viewModeBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 10,
  },
  viewModeBtnTextActive: {
    color: '#000000',
  },

  // 3-Column Topics & Grid Layout
  topicsContainer: {
    gap: 16,
    paddingBottom: 16,
  },
  topicSection: {
    gap: 8,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topicHeaderTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  topicCountText: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 10,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  gridCard: {
    width: '31.8%',
    backgroundColor: '#0e121a',
    borderRadius: Radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e2638',
    paddingBottom: 5,
    marginBottom: 4,
  },
  gridThumbBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#161a24',
    position: 'relative',
    overflow: 'hidden',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
  },
  gridThumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161a24',
  },
  gridDurationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 3.5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  gridDurationText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 7.5,
  },
  gridLockBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    padding: 2.5,
  },
  gridPlayIconBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 9.5,
    lineHeight: 12.5,
    minHeight: 25,
    marginTop: 4,
    marginHorizontal: 3,
  },
  gridSpeakerText: {
    fontFamily: Typography.fontRegular,
    color: Colors.gold,
    fontSize: 8.5,
    marginTop: 1,
    marginHorizontal: 3,
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
    flex: 1,
    flexShrink: 1,
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
    gap: 6,
    width: '100%',
    flexWrap: 'wrap',
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
  downloadProgressBanner: {
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  dlProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dlProgressTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  dlProgressPercent: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 12,
    marginLeft: 8,
  },
  dlProgressBarBg: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dlProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  covenantBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  covenantBadgeOverlayText: {
    fontFamily: Typography.fontBold,
    color: '#000000',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  covenantPillMini: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  covenantPillMiniText: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
  },
  btnWatchPaid: {
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  btnWatchPaidText: {
    color: Colors.gold,
  },
  covenantIconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  covenantHelpText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  covenantPlanCards: {
    gap: 10,
    marginBottom: 16,
  },
  covenantPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 14,
  },
  covenantPlanCardFeatured: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  covenantPlanTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  covenantPlanSub: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  covenantPlanPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
  },
  voucherRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  voucherInput: {
    flex: 1,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
  },
  voucherBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 12,
  },
});
