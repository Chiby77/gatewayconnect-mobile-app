import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { ContentItem } from '../types/domain';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
import { useState } from 'react';
import { downloadMedia, getDownloadStatus, deleteDownload } from '../media/downloadManager';
import { Alert } from 'react-native';

export function SermonCard({ sermon }: { sermon: ContentItem }) {
  const [downloadUri, setDownloadUri] = useState<string | null>(() => {
    const status = getDownloadStatus(sermon.id);
    return status?.status === 'complete' ? status.local_uri : null;
  });

  const videoUrl = sermon.metadata?.video_url as string | undefined;
  const audioUrl = sermon.metadata?.audio_url as string | undefined;

  const videoPlayer = useVideoPlayer(videoUrl || null, player => { player.loop = false; });
  const audioPlayer = useAudioPlayer(downloadUri || null);

  const handleDownload = async () => {
    const remoteUrl = audioUrl || 'https://example.com/dummy_sermon.mp3';
    try {
      const uri = await downloadMedia(sermon.id, 'audio', remoteUrl);
      setDownloadUri(uri);
      Alert.alert('Download Complete', 'Sermon is now available offline.');
    } catch {
      Alert.alert('Download Failed', 'Could not download the sermon.');
    }
  };

  const handleDelete = async () => {
    if (audioPlayer?.playing) audioPlayer.pause();
    await deleteDownload(sermon.id);
    setDownloadUri(null);
    Alert.alert('Deleted', 'Sermon removed from local storage.');
  };

  const togglePlay = () => {
    if (!downloadUri || !audioPlayer) return;
    if (audioPlayer.playing) audioPlayer.pause();
    else audioPlayer.play();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>SERMON</Text>
      <Text style={styles.cardTitle}>{sermon.title}</Text>
      <Text style={styles.cardBody}>{sermon.body}</Text>

      {videoUrl ? (
        <View style={{ marginTop: 12 }}>
          <VideoView
            player={videoPlayer}
            allowsPictureInPicture
            style={{ width: '100%', height: 200, borderRadius: Radii.md }}
          />
        </View>
      ) : null}

      {(!videoUrl || audioUrl) && (
        <View style={{ marginTop: 12 }}>
          {downloadUri ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.btn, { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' }]} onPress={togglePlay}>
                <Ionicons name={audioPlayer?.playing ? 'pause' : 'play'} size={14} color={Colors.textInverse} />
                <Text style={styles.btnText}>{audioPlayer?.playing ? 'Pause' : 'Play'}</Text>
              </Pressable>
              <Pressable style={[styles.btnOutlineDanger, { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' }]} onPress={() => void handleDelete()}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={[styles.btnOutlineDangerText]}>Delete</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.btnOutline, { flexDirection: 'row', gap: 8, alignItems: 'center' }]} onPress={() => void handleDownload()}>
              <Ionicons name="download-outline" size={14} color={Colors.gold} />
              <Text style={styles.btnOutlineText}>Download Audio</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  btnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  btnOutlineText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
  },
  btnOutlineDanger: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: Colors.dangerMuted,
  },
  btnOutlineDangerText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.danger,
    fontSize: 13,
  },
});
