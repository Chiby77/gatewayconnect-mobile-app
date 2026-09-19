import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, Switch } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { initializeDatabase } from './src/db/database';
import { getNetworkStatus, initializeNetworkStatus, NetworkStatus, subscribeToNetworkStatus } from './src/network/networkStatus';
import { countPendingMutations } from './src/sync/outbox';
import { startSyncEngine } from './src/sync/syncEngine';
import { getSyncState, subscribeToSyncState, SyncState } from './src/sync/syncStatus';
import { BibleRepository } from './src/bible/bibleRepository';
import { ReadingPlanRepository, ActiveReadingPlan, ReadingPlan } from './src/bible/readingPlanRepository';
import { getCachedProfile, MobileUser, signIn, signUp, subscribeToAuth, signOut } from './src/auth/authService';
import { startRealtimePersistence } from './src/remote/realtimeService';
import { savePrayerRequest, saveTestimony, listContent, listPrayerRequests, PrayerRequest, listComments, Comment, saveComment } from './src/data/contentRepository';
import { ContentItem, BibleColor } from './src/types/domain';
import { trackEvent } from './src/analytics/analyticsService';
import { SettingsRepository } from './src/settings/settingsRepository';
import { registerBackgroundSync } from './src/sync/backgroundSync';
import * as DocumentPicker from 'expo-document-picker';
import { getSuppliedChapter, indexSuppliedTranslation, installSuppliedBibleDatabase, isSuppliedBibleInstalled, listSuppliedTranslations, searchSuppliedBible } from './src/bible/suppliedBibleDatabase';
import { getGroups, Group, isGroupMember, joinGroup, leaveGroup } from './src/data/groupRepository';
import { getEvents, Event } from './src/data/eventRepository';
import { downloadMedia, getDownloadStatus, deleteDownload, enforceExpiration } from './src/media/downloadManager';
import { Alert } from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Screen = 'home' | 'bible' | 'community' | 'prayer' | 'profile';

export default function App() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [pendingMutations, setPendingMutations] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<MobileUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    initializeDatabase();
    BibleRepository.ensureCorePack();
    const unsubscribe = initializeNetworkStatus();
    const stopSync = startSyncEngine();
    void registerBackgroundSync();
    const stopRealtime = startRealtimePersistence();
    setNetworkStatus(getNetworkStatus());
    setPendingMutations(countPendingMutations());
    setSyncState(getSyncState());
    void getCachedProfile().then(setProfile);
    const unsubscribeFromAuth = subscribeToAuth(setProfile);
    const unsubscribeFromStatus = subscribeToNetworkStatus(setNetworkStatus);
    const unsubscribeFromSync = subscribeToSyncState(setSyncState);
    void enforceExpiration();
    return () => {
      unsubscribeFromAuth();
      unsubscribeFromStatus();
      unsubscribe();
      stopSync();
      stopRealtime();
      unsubscribeFromSync();
    };
  }, []);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {!profile && !isGuest ? (
          <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2B4C47' }]}>
            <View style={[styles.mark, { width: 80, height: 80, borderRadius: 24, marginBottom: 20 }]}><Text style={[styles.markText, { fontSize: 42 }]}>G</Text></View>
            <Text style={[styles.heroTitle, { textAlign: 'center', marginBottom: 10 }]}>GatewayConnect</Text>
            <Text style={[styles.heroBody, { textAlign: 'center', marginBottom: 40 }]}>Your faith, available anywhere.</Text>
            
            <View style={{ width: '100%', gap: 16 }}>
              <Pressable style={[styles.primaryButton, { width: '100%', alignItems: 'center', backgroundColor: '#B0713C' }]} onPress={() => setScreen('profile')}>
                <Text style={styles.primaryButtonText}>Sign In / Create Account</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { width: '100%', alignItems: 'center', borderColor: '#F2D399' }]} onPress={() => setIsGuest(true)}>
                <Text style={[styles.secondaryButtonText, { color: '#F2D399' }]}>Continue as Guest</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.container}>
              <View style={styles.brandRow}>
                <View style={styles.mark}><Text style={styles.markText}>G</Text></View>
                <View><Text style={styles.eyebrow}>GATEWAY CHURCH</Text><Text style={styles.title}>GatewayConnect</Text></View>
              </View>
              {screen === 'home' && <HomeScreen networkStatus={networkStatus} pendingMutations={pendingMutations} syncState={syncState} />}
              {screen === 'bible' && <BibleScreen profile={profile} />}
              {screen === 'community' && <CommunityScreen profile={profile} />}
              {screen === 'prayer' && <PrayerScreen />}
              {screen === 'profile' && <ProfileScreen profile={profile} onGuest={() => setIsGuest(true)} />}
            </ScrollView>
            <View style={styles.tabBar}>
              {([['home', 'Home'], ['bible', 'Bible'], ['community', 'Community'], ['prayer', 'Prayer'], ['profile', profile ? 'Me' : 'Sign In']] as const).map(([key, label]) => (
                <Pressable key={key} style={styles.tab} onPress={() => { setScreen(key); if (key === 'profile') setIsGuest(false); }}>
                  <Text style={[styles.tabLabel, screen === key && styles.activeTab]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ networkStatus, pendingMutations, syncState }: { networkStatus: NetworkStatus; pendingMutations: number; syncState: SyncState }) {
  const [devotionals, setDevotionals] = useState<ContentItem[]>([]);
  useEffect(() => {
    setDevotionals(listContent('devotional'));
  }, []);
  
  return <>
    <View style={styles.hero}>
      <Text style={styles.heroLabel}>YOUR FAITH, AVAILABLE ANYWHERE</Text>
      <Text style={styles.heroTitle}>Read. Reflect. Connect.</Text>
      <Text style={styles.heroBody}>Your church library, Bible, community, and prayer life in one calm mobile space.</Text>
    </View>
    <View style={styles.statusCard}>
      <View style={[styles.statusDot, networkStatus === 'online' ? styles.online : styles.offline]} />
      <View style={styles.statusCopy}><Text style={styles.cardTitle}>{networkStatus === 'online' ? 'Connected' : 'Offline mode'}</Text><Text style={styles.cardBody}>{networkStatus === 'online' ? 'Your changes will sync automatically.' : 'Bible content and saved work remain available.'}</Text></View>
    </View>
    <Text style={styles.sectionTitle}>Today at Gateway</Text><Text style={styles.cardBody}>Sync status: {syncState}{pendingMutations ? ` • ${pendingMutations} queued` : ''}</Text>
    
    {devotionals.length > 0 ? (
      devotionals.map(devotional => (
        <View key={devotional.id} style={styles.featureCard}>
          <Text style={styles.featureIcon}>DEVOTIONAL</Text>
          <Text style={styles.cardTitle}>{devotional.title}</Text>
          <Text style={styles.cardBody}>{devotional.body}</Text>
          <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Read devotional</Text></Pressable>
        </View>
      ))
    ) : (
      <View style={styles.featureCard}><Text style={styles.featureIcon}>DEVOTIONAL</Text><Text style={styles.cardTitle}>No devotionals yet</Text><Text style={styles.cardBody}>Connect to sync the latest devotionals.</Text></View>
    )}
    
    <View style={styles.grid}><View style={styles.featureCard}><Text style={styles.featureIcon}>SYNC</Text><Text style={styles.cardTitle}>{pendingMutations} queued</Text><Text style={styles.cardBody}>Offline actions waiting for connection.</Text></View><View style={styles.featureCard}><Text style={styles.featureIcon}>LIVE</Text><Text style={styles.cardTitle}>Sunday service</Text><Text style={styles.cardBody}>Live stream available when connected.</Text></View></View>
  </>;
}

function BibleScreen({ profile }: { profile: MobileUser | null }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof BibleRepository.search>>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Record<string, BibleColor>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActiveReadingPlan[]>([]);
  
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  
  const [suppliedBibleReady, setSuppliedBibleReady] = useState(false);
  const [suppliedTranslation, setSuppliedTranslation] = useState('eng_kjv');
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  
  const chapter = BibleRepository.getChapter('kjv-core', 19, 23);
  const [suppliedChapter, setSuppliedChapter] = useState<ReturnType<typeof getSuppliedChapter>>([]);
  
  const activeVersion = suppliedBibleReady ? suppliedTranslation : 'kjv-core';
  const activeChapter = suppliedBibleReady && suppliedChapter.length > 0 ? suppliedChapter : chapter;
  
  useEffect(() => {
    void isSuppliedBibleInstalled().then(ready => {
      setSuppliedBibleReady(ready);
      if (ready) {
        const translations = listSuppliedTranslations();
        const preferred = translations.find(item => item.id === 'eng_kjv') || translations[0];
        if (preferred) {
          setSuppliedTranslation(preferred.id);
          indexSuppliedTranslation(preferred.id);
          setSuppliedChapter(getSuppliedChapter(preferred.id, 'PSA', 23));
        }
      }
    });
  }, []);

  useEffect(() => {
    setBookmarks(BibleRepository.listBookmarks(profile?.id || null));
    setHighlights(BibleRepository.getHighlights(profile?.id || null, activeVersion));
    setNotes(BibleRepository.getNotes(profile?.id || null, activeVersion));
    setReadingPlans(ReadingPlanRepository.getAvailablePlans());
    setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
  }, [profile, activeVersion]);

  const importSuppliedBible = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/octet-stream', copyToCacheDirectory: false });
    if (result.canceled || !result.assets[0]) return;
    setInstallProgress(0);
    await installSuppliedBibleDatabase(result.assets[0].uri, setInstallProgress);
    setSuppliedBibleReady(true);
    setInstallProgress(null);
    const translations = listSuppliedTranslations();
    const preferred = translations.find(item => item.id === 'eng_kjv') || translations[0];
    if (preferred) { setSuppliedTranslation(preferred.id); indexSuppliedTranslation(preferred.id); setSuppliedChapter(getSuppliedChapter(preferred.id, 'PSA', 23)); }
  };

  const search = (value: string) => { setQuery(value); setResults(suppliedBibleReady ? searchSuppliedBible(suppliedTranslation, value) : BibleRepository.search('kjv-core', value)); };

  const handleVersePress = (reference: string) => {
    Alert.alert('Verse Options', reference, [
      { text: 'Cancel', style: 'cancel' },
      { text: bookmarks.includes(reference) ? 'Remove Bookmark' : 'Bookmark', onPress: () => {
        const isBookmarked = BibleRepository.toggleBookmark(profile?.id || null, activeVersion, reference);
        setBookmarks(isBookmarked ? [...bookmarks, reference] : bookmarks.filter(b => b !== reference));
      }},
      { text: 'Highlight', onPress: () => {
        Alert.alert('Select Color', '', [
          { text: 'Gold', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'gold'); setHighlights({...highlights, [reference]: 'gold'}); } },
          { text: 'Emerald', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'emerald'); setHighlights({...highlights, [reference]: 'emerald'}); } },
          { text: 'Blue', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'blue'); setHighlights({...highlights, [reference]: 'blue'}); } },
          { text: 'Rose', onPress: () => { BibleRepository.setHighlight(profile?.id || null, activeVersion, reference, 'rose'); setHighlights({...highlights, [reference]: 'rose'}); } },
          { text: 'Remove', style: 'destructive', onPress: () => { BibleRepository.deleteHighlight(profile?.id || null, activeVersion, reference); const h = {...highlights}; delete h[reference]; setHighlights(h); } }
        ]);
      }},
      { text: 'Note', onPress: () => {
        setSelectedVerse(reference);
        setNoteText(notes[reference] || '');
      }}
    ]);
  };

  const saveNoteForSelected = () => {
    if (selectedVerse) {
      if (noteText.trim() === '') {
        BibleRepository.deleteNote(profile?.id || null, activeVersion, selectedVerse);
        const newNotes = {...notes}; delete newNotes[selectedVerse]; setNotes(newNotes);
      } else {
        BibleRepository.saveNote(profile?.id || null, activeVersion, selectedVerse, noteText);
        setNotes({...notes, [selectedVerse]: noteText});
      }
      setSelectedVerse(null);
      setNoteText('');
    }
  };

  const startPlan = (planId: string) => {
    ReadingPlanRepository.startPlan(planId, profile?.id || null);
    setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
  };
  
  const completePlanDay = (plan: ActiveReadingPlan) => {
    if (plan.current_day < plan.days_total) {
      ReadingPlanRepository.markDayComplete(plan.id, profile?.id || null, plan.current_day + 1);
      setActivePlans(ReadingPlanRepository.getActivePlans(profile?.id || null));
    }
  };

  const getHighlightColor = (color: BibleColor) => {
    switch (color) {
      case 'gold': return '#fef08a';
      case 'emerald': return '#a7f3d0';
      case 'blue': return '#bfdbfe';
      case 'rose': return '#fecdd3';
      default: return 'transparent';
    }
  };

  return <>
    <View style={styles.pageHeading}><Text style={styles.sectionTitle}>Bible</Text><Text style={styles.offlinePill}>{suppliedBibleReady ? `${suppliedTranslation} • OFFLINE` : 'CORE • OFFLINE'}</Text></View>
    
    <View><Text style={styles.sectionTitle}>Reading Plans</Text></View>
    {activePlans.length > 0 ? activePlans.map(plan => (
      <View key={plan.id} style={styles.featureCard}>
        <Text style={styles.featureIcon}>READING PLAN</Text>
        <Text style={styles.cardTitle}>{plan.title}</Text>
        <Text style={styles.cardBody}>Day {plan.current_day} of {plan.days_total}</Text>
        <Text style={styles.cardBody}>{plan.description}</Text>
        {plan.current_day < plan.days_total ? (
           <Pressable style={styles.primaryButton} onPress={() => completePlanDay(plan)}><Text style={styles.primaryButtonText}>Complete Day {plan.current_day + 1}</Text></Pressable>
        ) : (
           <Text style={styles.cardBody}>Plan Complete! 🎉</Text>
        )}
      </View>
    )) : (
      <View style={styles.featureCard}>
        <Text style={styles.featureIcon}>NO ACTIVE PLANS</Text>
        {readingPlans.map(plan => (
          <View key={plan.id} style={{marginBottom: 16}}>
            <Text style={styles.cardTitle}>{plan.title}</Text>
            <Text style={styles.cardBody}>{plan.description} ({plan.days_total} days)</Text>
            <Pressable style={styles.secondaryButton} onPress={() => startPlan(plan.id)}><Text style={styles.secondaryButtonText}>Start Plan</Text></Pressable>
          </View>
        ))}
      </View>
    )}

    {!suppliedBibleReady && <Pressable style={styles.secondaryButton} onPress={() => void importSuppliedBible()}><Text style={styles.secondaryButtonText}>{installProgress === null ? 'Install 2.8 GB Bible database' : `Installing ${installProgress}%`}</Text></Pressable>}
    <TextInput value={query} onChangeText={search} placeholder="Search the Bible" placeholderTextColor="#8A918B" style={styles.input} />
    {query ? results.map(result => <View key={`${result.reference}-${result.text}`} style={styles.resultCard}><Text style={styles.featureIcon}>{result.reference}</Text><Text style={styles.cardBody}>{result.text}</Text></View>) : <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>PSALMS 23</Text>
      {activeChapter.map(verse => {
        const reference = `${verse.bookName} ${verse.chapter}:${verse.verse}`;
        const isBookmarked = bookmarks.includes(reference);
        const highlightColor = highlights[reference] ? getHighlightColor(highlights[reference]) : 'transparent';
        const hasNote = !!notes[reference];
        return (
          <View key={verse.verse} style={{ backgroundColor: highlightColor, borderRadius: 8, paddingHorizontal: 4 }}>
            <Pressable onPress={() => handleVersePress(reference)} style={styles.verseRow}>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
              <Text style={styles.verseText}>{verse.text}</Text>
              {isBookmarked && <Text style={{color: '#B0713C', fontSize: 16}}>★</Text>}
            </Pressable>
            {hasNote && <Text style={[styles.cardBody, { fontStyle: 'italic', marginLeft: 36, marginBottom: 12, marginTop: -6 }]}>Note: {notes[reference]}</Text>}
          </View>
        );
      })}
      {selectedVerse && (
        <View style={{marginTop: 16}}>
          <Text style={styles.cardTitle}>Note for {selectedVerse}</Text>
          <TextInput value={noteText} onChangeText={setNoteText} placeholder="Add your note here..." placeholderTextColor="#8A918B" style={[styles.input, styles.multiline]} multiline />
          <Pressable style={styles.primaryButton} onPress={saveNoteForSelected}><Text style={styles.primaryButtonText}>Save Note</Text></Pressable>
        </View>
      )}
    </View>}
  </>;
}

function TestimonyCard({ testimony, profile }: { testimony: ContentItem; profile: MobileUser | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) setComments(listComments(testimony.id));
  }, [showComments, testimony.id]);

  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>TESTIMONY</Text>
      <Text style={styles.cardTitle}>{testimony.title}</Text>
      <Text style={styles.cardBody}>{testimony.body}</Text>
      <Pressable onPress={() => setShowComments(!showComments)}>
        <Text style={styles.cardBody}>{showComments ? 'Hide Comments' : 'View Comments'}</Text>
      </Pressable>
      
      {showComments && (
        <View style={{ marginTop: 10 }}>
          {comments.map(c => (
            <Text key={c.id} style={styles.cardBody}>• {c.body}</Text>
          ))}
          {profile ? (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." style={[styles.input, { flex: 1 }]} />
              <Pressable style={[styles.primaryButton, { marginLeft: 10 }]} onPress={() => { if (newComment.trim()) { saveComment(testimony.id, profile.id, newComment.trim()); setNewComment(''); setComments(listComments(testimony.id)); } }}>
                <Text style={styles.primaryButtonText}>Post</Text>
              </Pressable>
            </View>
          ) : <Text style={styles.cardBody}>Sign in to comment.</Text>}
        </View>
      )}
    </View>
  );
}

function SermonCard({ sermon }: { sermon: ContentItem }) {
  const [downloadUri, setDownloadUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = sermon.metadata?.video_url as string | undefined;
  const audioUrl = sermon.metadata?.audio_url as string | undefined;

  useEffect(() => {
    const status = getDownloadStatus(sermon.id);
    if (status && status.status === 'complete') {
      setDownloadUri(status.local_uri);
    }
  }, [sermon.id]);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const handleDownload = async () => {
    const remoteUrl = audioUrl || 'https://example.com/dummy_sermon.mp3';
    try {
      const uri = await downloadMedia(sermon.id, 'audio', remoteUrl);
      setDownloadUri(uri);
      Alert.alert('Download Complete', 'Sermon is now available offline.');
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download the sermon.');
    }
  };

  const handleDelete = async () => {
    if (sound) { await sound.unloadAsync(); setSound(null); setIsPlaying(false); }
    await deleteDownload(sermon.id);
    setDownloadUri(null);
    Alert.alert('Deleted', 'Sermon removed from local storage.');
  };

  const togglePlay = async () => {
    if (!downloadUri) return;
    try {
      if (sound) {
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
        else { await sound.playAsync(); setIsPlaying(true); }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: downloadUri });
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
        });
        await newSound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn("Could not play audio", err);
    }
  };

  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>SERMON</Text>
      <Text style={styles.cardTitle}>{sermon.title}</Text>
      <Text style={styles.cardBody}>{sermon.body}</Text>
      
      {videoUrl ? (
        <View style={{ marginTop: 10 }}>
          <Video
            source={{ uri: videoUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={{ width: '100%', height: 200, borderRadius: 8 }}
          />
        </View>
      ) : null}
      
      {(!videoUrl || audioUrl) && (
        <View style={{ marginTop: 10 }}>
          {downloadUri ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => void togglePlay()}>
                <Text style={styles.secondaryButtonText}>{isPlaying ? 'Pause Audio' : 'Play Audio'}</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { flex: 1, backgroundColor: '#fde8e8' }]} onPress={() => void handleDelete()}>
                <Text style={[styles.secondaryButtonText, { color: '#c53030' }]}>Delete Audio</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={() => void handleDownload()}>
              <Text style={styles.primaryButtonText}>Download Audio</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function CommunityScreen({ profile }: { profile: MobileUser | null }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [sermons, setSermons] = useState<ContentItem[]>([]);
  const [testimonies, setTestimonies] = useState<ContentItem[]>([]);

  useEffect(() => {
    const loadedGroups = getGroups();
    setGroups(loadedGroups);
    setSermons(listContent('sermon'));
    if (profile) {
      const statuses: Record<string, boolean> = {};
      for (const group of loadedGroups) {
        statuses[group.id] = isGroupMember(group.id, profile.id);
      }
      setJoinedGroups(statuses);
    }
  }, [profile]);

  const toggleMembership = (groupId: string) => {
    if (!profile) return;
    const isJoined = joinedGroups[groupId];
    if (isJoined) {
      leaveGroup(groupId, profile.id);
      setJoinedGroups(prev => ({ ...prev, [groupId]: false }));
    } else {
      joinGroup(groupId, profile.id);
      setJoinedGroups(prev => ({ ...prev, [groupId]: true }));
    }
  };

  return <><Text style={styles.sectionTitle}>Community</Text><View style={styles.featureCard}><Text style={styles.featureIcon}>CHURCH FEED</Text><Text style={styles.cardTitle}>Share your testimony</Text><Text style={styles.cardBody}>Your story is saved locally and synced when you reconnect.</Text><TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#8A918B" style={styles.input} /><TextInput value={body} onChangeText={setBody} multiline placeholder="Share a testimony or encouragement" placeholderTextColor="#8A918B" style={[styles.input, styles.multiline]} /><Pressable style={styles.primaryButton} onPress={() => { if (title.trim() && body.trim()) saveTestimony(null, title.trim(), body.trim()); setSaved(true); setTitle(''); setBody(''); setTestimonies(listContent('post')); }}><Text style={styles.primaryButtonText}>Save testimony</Text></Pressable>{saved ? <Text style={styles.cardBody}>Saved locally. It will sync when online.</Text> : null}</View><View><Text style={styles.sectionTitle}>Fellowship Groups</Text></View>{groups.map(group => <View key={group.id} style={styles.featureCard}><Text style={styles.featureIcon}>FELLOWSHIP GROUP</Text><Text style={styles.cardTitle}>{group.name}</Text><Text style={styles.cardBody}>{group.description}</Text>{group.location ? <Text style={styles.cardBody}>Location: {group.location}</Text> : null}{profile ? <Pressable style={joinedGroups[group.id] ? styles.secondaryButton : styles.primaryButton} onPress={() => toggleMembership(group.id)}><Text style={joinedGroups[group.id] ? styles.secondaryButtonText : styles.primaryButtonText}>{joinedGroups[group.id] ? 'Leave Group' : 'Join Group'}</Text></Pressable> : <Text style={styles.cardBody}>Sign in to join groups.</Text>}</View>)}{groups.length === 0 ? <Text style={styles.cardBody}>No groups found. Please connect to sync.</Text> : null}
  <View><Text style={styles.sectionTitle}>Testimonies</Text></View>
  {testimonies.map(testimony => <TestimonyCard key={testimony.id} testimony={testimony} profile={profile} />)}
  
  <View><Text style={styles.sectionTitle}>Sermons</Text></View>
  {sermons.length > 0 ? sermons.map(sermon => (
    <SermonCard key={sermon.id} sermon={sermon} />
  )) : <Text style={styles.cardBody}>No sermons found. Please connect to sync.</Text>}
  </>;
}

function PrayerScreen() {
  const [request, setRequest] = useState('');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    setPrayers(listPrayerRequests());
    setEvents(getEvents());
  }, []);

  return <><Text style={styles.sectionTitle}>Prayer</Text><View style={styles.featureCard}><Text style={styles.cardTitle}>Share a prayer request</Text><Text style={styles.cardBody}>Your request is saved locally first and sent when you reconnect.</Text><TextInput value={request} onChangeText={setRequest} multiline placeholder="What would you like the church to pray for?" placeholderTextColor="#8A918B" style={[styles.input, styles.multiline]} /><Pressable style={styles.primaryButton} onPress={() => { if (request.trim()) savePrayerRequest(null, 'Prayer request', request.trim()); setRequest(''); setPrayers(listPrayerRequests()); }}><Text style={styles.primaryButtonText}>Save prayer request</Text></Pressable></View>
  <View><Text style={styles.sectionTitle}>Recent Prayers</Text></View>
  {prayers.length > 0 ? prayers.map(prayer => (
    <View key={prayer.id} style={styles.featureCard}>
      <Text style={styles.featureIcon}>{prayer.is_anonymous ? 'ANONYMOUS' : 'MEMBER'}</Text>
      <Text style={styles.cardTitle}>{prayer.title}</Text>
      <Text style={styles.cardBody}>{prayer.body}</Text>
    </View>
  )) : <Text style={styles.cardBody}>No prayers found. Please connect to sync.</Text>}
  <View><Text style={styles.sectionTitle}>Upcoming Events</Text></View>
  {events.length > 0 ? events.map(evt => (
    <View key={evt.id} style={styles.featureCard}>
      <Text style={styles.featureIcon}>{evt.category?.toUpperCase() || 'EVENT'}</Text>
      <Text style={styles.cardTitle}>{evt.title}</Text>
      <Text style={styles.cardBody}>{evt.event_date} at {evt.event_time}</Text>
      <Text style={styles.cardBody}>{evt.location}</Text>
      {evt.description ? <Text style={styles.cardBody}>{evt.description}</Text> : null}
    </View>
  )) : (
    <View style={styles.featureCard}><Text style={styles.featureIcon}>EVENTS</Text><Text style={styles.cardTitle}>Upcoming gatherings</Text><Text style={styles.cardBody}>Sunday service, cell groups, youth gatherings, and conferences appear here when synced.</Text></View>
  )}
  </>;
}

function ProfileScreen({ profile, onGuest }: { profile: MobileUser | null, onGuest: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const [lowData, setLowData] = useState(SettingsRepository.getLowDataMode());
  const [analytics, setAnalytics] = useState(SettingsRepository.getAnalyticsOptIn());

  const handleLowDataToggle = () => {
    const next = !lowData;
    SettingsRepository.setLowDataMode(next);
    setLowData(next);
    trackEvent('toggled_low_data_mode', { enabled: next });
  };

  const handleAnalyticsToggle = () => {
    const next = !analytics;
    SettingsRepository.setAnalyticsOptIn(next);
    setAnalytics(next);
    if (next) trackEvent('analytics_enabled');
  };

  const authenticate = async (create: boolean) => {
    try { setError(''); const next = create ? await signUp(email, password, name || 'Gateway Member') : await signIn(email, password); setError(`Welcome, ${next.name}`); trackEvent('auth_success', { isNewUser: create }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Authentication failed'); trackEvent('auth_error'); }
  };
  return <><Text style={styles.sectionTitle}>Account</Text><View style={styles.featureCard}><Text style={styles.featureIcon}>{profile ? 'GENERAL MEMBER' : 'GUEST'}</Text><Text style={styles.cardTitle}>{profile?.name || 'Welcome to GatewayConnect'}</Text><Text style={styles.cardBody}>{profile ? 'Your secure session is available on this device.' : 'Sign in to sync your Bible notes, prayers, messages, and saved content across devices.'}</Text>{profile ? <Pressable style={styles.secondaryButton} onPress={() => { void signOut(); trackEvent('sign_out'); }}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable> : <><TextInput value={name} onChangeText={setName} placeholder="Your name (for new account)" placeholderTextColor="#8A918B" style={styles.input} /><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="#8A918B" style={styles.input} /><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#8A918B" style={styles.input} /><View style={styles.buttonRow}><Pressable style={styles.primaryButton} onPress={() => void authenticate(false)}><Text style={styles.primaryButtonText}>Sign in</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => void authenticate(true)}><Text style={styles.secondaryButtonText}>Create Account</Text></Pressable></View><Pressable style={[styles.secondaryButton, { borderWidth: 0, marginTop: 24, alignSelf: 'center' }]} onPress={() => { trackEvent('guest_browsing'); onGuest(); }}><Text style={styles.secondaryButtonText}>Continue Browsing as Guest</Text></Pressable></>}{error ? <Text style={[styles.cardBody, { color: '#c53030' }]}>{error}</Text> : null}</View>
  <View style={styles.featureCard}>
    <Text style={styles.featureIcon}>SETTINGS</Text>
    <Text style={styles.cardTitle}>Downloads and data</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.cardTitle}>Low-Data Mode</Text>
        <Text style={styles.cardBody}>Disable automatic media downloads when syncing.</Text>
      </View>
      <Switch value={lowData} onValueChange={handleLowDataToggle} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.cardTitle}>Analytics</Text>
        <Text style={styles.cardBody}>Share anonymous usage data to help us improve the app.</Text>
      </View>
      <Switch value={analytics} onValueChange={handleAnalyticsToggle} />
    </View>
  </View></>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  appShell: { flex: 1 },
  container: { padding: 24, paddingBottom: 100, gap: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  mark: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2B4C47', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  markText: { fontFamily: 'Inter_800ExtraBold', color: '#F2D399', fontSize: 24 },
  eyebrow: { fontFamily: 'Inter_800ExtraBold', color: '#B0713C', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter_800ExtraBold', color: '#1B312E', fontSize: 22, marginTop: 2 },
  hero: { backgroundColor: '#2B4C47', borderRadius: 24, padding: 28, marginTop: 18, shadowColor: '#2B4C47', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  heroLabel: { fontFamily: 'Inter_800ExtraBold', color: '#F2D399', fontSize: 11, letterSpacing: 1.4, marginBottom: 16, textTransform: 'uppercase' },
  heroTitle: { fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', fontSize: 32, lineHeight: 38 },
  heroBody: { fontFamily: 'Inter_400Regular', color: '#D8E0D8', fontSize: 16, lineHeight: 24, marginTop: 14 },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E9ECEF', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 14 },
  online: { backgroundColor: '#38A169' },
  offline: { backgroundColor: '#DD6B20' },
  statusCopy: { flex: 1 },
  cardTitle: { fontFamily: 'Inter_800ExtraBold', color: '#1B312E', fontSize: 18 },
  cardBody: { fontFamily: 'Inter_400Regular', color: '#4A5568', fontSize: 15, lineHeight: 22, marginTop: 6 },
  grid: { flexDirection: 'row', gap: 16 },
  featureCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E9ECEF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, minHeight: 180 },
  featureIcon: { fontFamily: 'Inter_800ExtraBold', color: '#B0713C', fontSize: 12, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', color: '#1B312E', fontSize: 26, marginTop: 16 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offlinePill: { fontFamily: 'Inter_800ExtraBold', color: '#38A169', fontSize: 11, letterSpacing: 1 },
  input: { fontFamily: 'Inter_400Regular', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 14, color: '#1B312E', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  multiline: { minHeight: 120, textAlignVertical: 'top', marginTop: 16 },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E9ECEF', gap: 10 },
  verseRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  verseNumber: { fontFamily: 'Inter_800ExtraBold', color: '#B0713C', width: 24, fontSize: 14 },
  verseText: { fontFamily: 'Inter_400Regular', color: '#2D3748', flex: 1, fontSize: 17, lineHeight: 26 },
  primaryButton: { backgroundColor: '#B0713C', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 16 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 14 },
  secondaryButton: { borderWidth: 1.5, borderColor: '#B0713C', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 16, backgroundColor: 'transparent' },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', color: '#B0713C', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#E9ECEF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
  tab: { alignItems: 'center', flex: 1 },
  tabLabel: { fontFamily: 'Inter_600SemiBold', color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  activeTab: { color: '#2B4C47' }
});
