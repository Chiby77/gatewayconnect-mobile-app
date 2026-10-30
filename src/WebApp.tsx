import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  MessageCircle,
  Users,
  HeartHandshake,
  UserCheck,
  BookOpen,
  Search,
  CheckCircle2,
  Heart,
  Share2,
  Send,
  Calendar,
  MapPin,
  Lock,
  Plus,
  LogIn,
  LogOut,
  Bell,
  Image as ImageIcon,
  Repeat2,
  Bookmark,
  CheckCheck,
  ArrowLeft,
  Phone,
  Video,
  Smile,
  X,
  Download,
  Wifi,
  BatteryCharging,
  Smartphone,
  Sun,
  Moon,
  Upload,
  Play,
  Trash2,
  Code2,
  Copy,
} from 'lucide-react';
import { BIBLE_BOOKS, getChapterVerses } from './data/bibleData';
import { GATEWAY_LOGO_URL, STORE_IMAGE_MAP, COMMUNITY_PHOTOS } from './lib/assets';
import {
  CurrencyCode,
  AppTheme,
  GIVING_FUNDS,
  SEED_PRODUCTS,
  SEED_SERMONS,
  SEED_GROUPS,
  SEED_EVENTS,
  SEED_PRAYERS,
  SEED_PROFILES,
  SEED_STORIES,
  SEED_SOCIAL_POSTS,
  SEED_CHAT_THREADS,
  SEED_MINISTRY_PAGES,
  SermonItem,
  PrayerItem,
  SocialPost,
  StoryItem,
  ChatThread,
  MemberProfile,
  PrayerAlertNotification,
  formatCurrencyAmount,
  filterSermons,
  filterBibleBooks,
  validateGivingInput,
  createGivingReceipt,
  detectPrayerCountIncreases,
  markThreadMessagesAsRead,
  resolveStoredTheme,
  SermonDownloadTask,
  SEED_DOWNLOAD_TASKS,
  startOrResumeDownloadTask,
  pauseDownloadTask,
  resumeDownloadTask,
  cancelDownloadTask,
  advanceActiveDownloadTasks,
} from './lib/domainLogic';
import {
  BibleVerseShareCard,
  HighlightedVerseChoice,
} from './components/BibleVerseShareCard';
import { SermonDownloadsManager } from './components/SermonDownloadsManager';
import {
  StoredGivingReceipt,
  saveReceiptToIndexedDB,
  loadReceiptsFromIndexedDB,
  syncOfflineReceiptsToFirestore,
  registerGivingNetworkSync,
  saveOfflineSermonToIndexedDB,
  removeOfflineSermonFromIndexedDB,
  loadOfflineSermonsFromIndexedDB,
} from './lib/givingStorage';
import { useOnlineStatus } from './lib/usePWAInstall';
import {
  db,
  auth,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  onAuthStateChanged,
  ensureFirebaseMemberProfile,
  signInWithGooglePopup,
  signOutFirebase,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from './remote/firebase';

type NavTab = 'feed' | 'chat' | 'sermons' | 'groups' | 'prayer' | 'bible' | 'store' | 'profile';

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

const STORY_REACTION_EMOJIS = ['❤️', '🔥', '🙌', '🙏', '💙', '✨'] as const;

const KOTLIN_PREVIEW_SNIPPET = `package org.joedaniels.gatewayconnect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.*

/**
 * Gateway Connect — Native Kotlin + Jetpack Compose Android Application
 * Source Path: /android-kotlin/app/src/main/java/org/joedaniels/gatewayconnect/MainActivity.kt
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GatewayConnectMobileApp()
        }
    }
}`;

const PHOTO_PRESETS: Array<{ key: keyof typeof COMMUNITY_PHOTOS; label: string }> = [
  { key: 'apostlePreaching', label: '📸 Sunday Word' },
  { key: 'sanctuaryWorship', label: '🎶 Sanctuary Worship' },
  { key: 'choirPraise', label: '🎤 Ignite Choir' },
  { key: 'altarCall', label: '🙏 Altar Moment' },
  { key: 'fellowshipGathering', label: '🤝 Fellowship' },
  { key: 'youthIgnition', label: '🔥 Youth Arena' },
  { key: 'sundayGlory', label: '✨ Miracles & Glory' },
];

export function WebApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User-accessible Theme Toggle persisted in localStorage ('dark' | 'light')
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      return resolveStoredTheme(
        typeof window !== 'undefined' ? window.localStorage.getItem('gateway_theme') : null
      );
    } catch {
      return 'dark';
    }
  });
  const isLight = theme === 'light';

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('gateway_theme', next);
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Online Status & Native Kotlin Android Project Modal
  const isOnline = useOnlineStatus();
  const [showKotlinModal, setShowKotlinModal] = useState(false);

  // Auth & Member Profile State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('Brother Farai Moyo');
  const [userHandle, setUserHandle] = useState('@faraimoyo_zw');
  const [userBio, setUserBio] = useState(
    'Grateful believer in Harare 🌍 | Walking by faith (2 Cor 5:7) ✨ | Ignite Worship & Pride of Lions 💙🙏'
  );
  const [userPhone, setUserPhone] = useState('0772 891 402');
  const [userLocation, setUserLocation] = useState('Harare, Zimbabwe');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Viewing another member's profile modal
  const [viewedProfile, setViewedProfile] = useState<MemberProfile | null>(null);
  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'media' | 'saved' | 'receipts'>('posts');

  // Following state (for members & pages)
  const [followedIds, setFollowedIds] = useState<string[]>([
    'usr_apostle_joe',
    'usr_melinda',
    'usr_ignite',
    'page_apostle_jd',
  ]);

  // Stories State + Floating Live Reactions State
  const [stories, setStories] = useState<StoryItem[]>(SEED_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyReplyText, setStoryReplyText] = useState('');
  const [floatingStoryReactions, setFloatingStoryReactions] = useState<FloatingReaction[]>([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryPhotoKey, setNewStoryPhotoKey] = useState<keyof typeof COMMUNITY_PHOTOS>('sanctuaryWorship');

  // Feed State (X + Instagram hybrid)
  const [feedFilter, setFeedFilter] = useState<'foryou' | 'following'>('foryou');
  const [posts, setPosts] = useState<SocialPost[]>(SEED_SOCIAL_POSTS);
  const [composerText, setComposerText] = useState('');
  const [composerPhotoKey, setComposerPhotoKey] = useState<keyof typeof COMMUNITY_PHOTOS | ''>('');
  const [composerScripture, setComposerScripture] = useState('');
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>('post_1');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // WhatsApp-Style Chat State with Read Receipts
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(SEED_CHAT_THREADS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'group' | 'direct'>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatPhotoKey, setChatPhotoKey] = useState<keyof typeof COMMUNITY_PHOTOS | ''>('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('group');

  // Groups & Pages State
  const [groupsSubTab, setGroupsSubTab] = useState<'groups' | 'pages' | 'events'>('groups');
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([
    'group_ignite_worship',
    'group_pride_of_lions',
  ]);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<string[]>(['evt_sunday']);

  // Prayer Altar & Real-Time Prayer Notification Listener State
  const [prayers, setPrayers] = useState<PrayerItem[]>(SEED_PRAYERS);
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerBody, setPrayerBody] = useState('');
  const [prayedIds, setPrayedIds] = useState<string[]>([]);
  const [prayerNotifications, setPrayerNotifications] = useState<PrayerAlertNotification[]>([
    {
      id: 'notif_seed_1',
      prayerId: 'pray_1',
      prayerTitle: 'Family Restoration & Peace',
      authorName: 'Sister Rutendo (Harare)',
      newPrayingCount: 18,
      delta: 1,
      timestamp: 'Just now',
      read: false,
    },
  ]);
  const [livePrayerBanner, setLivePrayerBanner] = useState<PrayerAlertNotification | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const prevPrayerCountsRef = useRef<Record<string, number>>({
    pray_1: 18,
    pray_2: 14,
  });

  // Sermons State (YouTube, Facebook Live, Uploaded Videos & Global Offline Downloads Manager)
  const [sermons, setSermons] = useState<SermonItem[]>(SEED_SERMONS);
  const [sermonSourceFilter, setSermonSourceFilter] = useState<
    'all' | 'youtube' | 'facebook' | 'uploaded' | 'offline' | 'downloads'
  >('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [sermonSearch, setSermonSearch] = useState('');
  const [activeVideoSermonId, setActiveVideoSermonId] = useState<string>(SEED_SERMONS[0].id);
  const [unlockedSermonIds, setUnlockedSermonIds] = useState<string[]>([]);
  const [offlineSermons, setOfflineSermons] = useState<SermonItem[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<SermonDownloadTask[]>(SEED_DOWNLOAD_TASKS);
  const [showDownloadsManager, setShowDownloadsManager] = useState<boolean>(true);
  const [useDirectStreamPlayer, setUseDirectStreamPlayer] = useState(false);
  const [showUploadSermonModal, setShowUploadSermonModal] = useState(false);
  const [uploadSermonTitle, setUploadSermonTitle] = useState('');
  const [uploadSermonSpeaker, setUploadSermonSpeaker] = useState('Apostle Joe & Pastor Melinda');
  const [uploadSermonSeries, setUploadSermonSeries] = useState('Sunday Sanctuary Uploads');
  const [uploadSermonSource, setUploadSermonSource] = useState<'uploaded' | 'youtube' | 'facebook'>(
    'uploaded'
  );
  const [uploadSermonUrl, setUploadSermonUrl] = useState('');
  const [uploadSermonBody, setUploadSermonBody] = useState('');

  // Bible State & Highlighted Verse Share Card Studio
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [bibleSearch, setBibleSearch] = useState('');
  const [selectedBookName, setSelectedBookName] = useState('Psalms');
  const [selectedChapter, setSelectedChapter] = useState(23);
  const [highlightedVerses, setHighlightedVerses] = useState<Record<string, boolean>>({
    'Psalms:23:1': true,
    'Psalms:23:4': true,
    'John:3:16': true,
  });
  const [activeShareVerseKey, setActiveShareVerseKey] = useState<string>('Psalms:23:1');

  // Store & Giving State (backed by LocalForage IndexedDB + Firestore sync)
  const [storeSubTab, setStoreSubTab] = useState<'give' | 'merch'>('give');
  const [selectedFundId, setSelectedFundId] = useState('tithe');
  const [givingAmountInput, setGivingAmountInput] = useState('50');
  const [givingMethod, setGivingMethod] = useState<'EcoCash' | 'Innbucks' | 'OneMoney' | 'Card'>('EcoCash');
  const [givingPhone, setGivingPhone] = useState('0772 891 402');
  const [receipts, setReceipts] = useState<StoredGivingReceipt[]>([]);
  const [cartProductIds, setCartProductIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  // Load initial receipts from browser IndexedDB via localforage and register online sync listener
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const existing = await loadReceiptsFromIndexedDB();
        if (existing.length === 0) {
          const initialReceipt = createGivingReceipt({
            amount: 50,
            currency: 'USD',
            fundId: 'tithe',
            method: 'EcoCash',
            phone: '0772 891 402',
            nowMs: 1711800000000,
          });
          const saved = await saveReceiptToIndexedDB(initialReceipt, true);
          if (mounted) setReceipts([saved]);
        } else if (mounted) {
          setReceipts(existing);
        }

        // Load offline downloaded sermons from IndexedDB
        const savedSermons = await loadOfflineSermonsFromIndexedDB();
        if (savedSermons.length === 0) {
          const defaultOffline = SEED_SERMONS.find((s) => s.id === 'sermon_uploaded_1');
          if (defaultOffline) {
            await saveOfflineSermonToIndexedDB(defaultOffline);
            if (mounted) setOfflineSermons([defaultOffline]);
          }
        } else if (mounted) {
          setOfflineSermons(savedSermons);
        }
      } catch {
        // Fallback if IndexedDB is restricted
      }
    })();

    const cleanupNetworkSync = registerGivingNetworkSync(
      () => auth.currentUser?.uid ?? null,
      (syncedCount, updatedReceipts) => {
        if (!mounted) return;
        setReceipts(updatedReceipts);
        if (syncedCount > 0) {
          showToast(`✨ ${syncedCount} giving receipt(s) synchronized with your account!`);
        }
      }
    );

    return () => {
      mounted = false;
      cleanupNetworkSync();
    };
  }, []);

  // Auth listener & automatic sync of offline IndexedDB receipts when user signs in
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.displayName) setUserName(user.displayName);
        const cleanHandle = `@${(user.displayName || user.email?.split('@')[0] || 'believer')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 24)}`;
        setUserHandle(cleanHandle);

        try {
          await ensureFirebaseMemberProfile(user);
        } catch {
          // Profile check completed
        }

        setFbUser(user);

        try {
          const result = await syncOfflineReceiptsToFirestore(user.uid);
          setReceipts(result.receipts);
          if (result.syncedCount > 0) {
            showToast(`✨ Synced ${result.syncedCount} saved giving receipt(s)!`);
          }
        } catch {
          // Ignore transient network errors
        }
      } else {
        setFbUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for 'prayerRequests' collection with live prayer alert notifications
  useEffect(() => {
    if (!isFirebaseConfigured || !fbUser) return;

    const prayersPath = 'prayerRequests';
    const prayersQuery = query(
      collection(db, 'prayerRequests'),
      where('status', 'in', ['active', 'answered']),
      limit(30)
    );

    const unsubPrayers = onSnapshot(
      prayersQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const livePrayers: PrayerItem[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              userId: String(d.authorId || d.userId || 'usr_anon'),
              authorName: String(d.authorName || 'Gateway Believer'),
              title: String(d.title || 'Prayer Petition'),
              body: String(d.body || ''),
              createdAt: 'Live on Altar',
              prayingCount: Number(d.prayingCount || 1),
            };
          });

          const mergedPrayers = [
            ...livePrayers,
            ...SEED_PRAYERS.filter((sp) => !livePrayers.some((lp) => lp.id === sp.id)),
          ];

          // Compare against previous prayingCount values to trigger real-time alerts
          const increases = detectPrayerCountIncreases(prevPrayerCountsRef.current, mergedPrayers);
          if (increases.length > 0) {
            const latest = increases[0];
            const alertItem: PrayerAlertNotification = {
              id: `notif_${Date.now()}_${latest.prayer.id}`,
              prayerId: latest.prayer.id,
              prayerTitle: latest.prayer.title,
              authorName: latest.prayer.authorName,
              newPrayingCount: latest.prayer.prayingCount,
              delta: latest.delta,
              timestamp: 'Just now',
              read: false,
            };
            setPrayerNotifications((prev) => [alertItem, ...prev.slice(0, 19)]);
            setLivePrayerBanner(alertItem);
          }

          // Update tracked counts
          const nextMap: Record<string, number> = { ...prevPrayerCountsRef.current };
          for (const p of mergedPrayers) {
            nextMap[p.id] = p.prayingCount;
          }
          prevPrayerCountsRef.current = nextMap;
          setPrayers(mergedPrayers);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, prayersPath);
        } catch {
          // Logged via handleFirestoreError
        }
      }
    );

    return () => {
      unsubPrayers();
    };
  }, [fbUser]);

  // Sync user's cloud giving receipts with local IndexedDB
  useEffect(() => {
    if (!isFirebaseConfigured || !fbUser) return;
    const receiptsPath = 'givingReceipts';
    const receiptsQuery = query(
      collection(db, 'givingReceipts'),
      where('ownerId', '==', fbUser.uid),
      limit(20)
    );

    const unsubReceipts = onSnapshot(
      receiptsQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          for (const docSnap of snapshot.docs) {
            const d = docSnap.data();
            await saveReceiptToIndexedDB(
              {
                id: String(d.receiptCode || d.id || docSnap.id),
                amount: Number(d.amount || 0),
                formattedAmount: String(d.formattedAmount || '$0.00'),
                currency: (d.currency as CurrencyCode) || 'USD',
                fund: String(d.fund || 'Tithe'),
                method: String(d.method || 'EcoCash'),
                phone: String(d.phone || 'Saved Method'),
                timestamp: String(d.timestamp || 'Synced Receipt'),
              },
              true
            );
          }
          const allLocal = await loadReceiptsFromIndexedDB();
          setReceipts(allLocal);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, receiptsPath);
        } catch {
          // Handled
        }
      }
    );

    return () => unsubReceipts();
  }, [fbUser]);

  // Computed values
  const displayedPosts = useMemo(() => {
    if (feedFilter === 'following') {
      return posts.filter(
        (p) => followedIds.includes(p.authorId) || p.authorId === 'usr_me'
      );
    }
    return posts;
  }, [posts, feedFilter, followedIds]);

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    return chatThreads.filter((t) => {
      if (chatFilter === 'unread' && t.unreadCount === 0) return false;
      if (chatFilter === 'group' && t.type !== 'group') return false;
      if (chatFilter === 'direct' && t.type !== 'direct') return false;
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !t.lastMessage.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [chatThreads, chatFilter, chatSearch]);

  const activeChat = useMemo(
    () => chatThreads.find((c) => c.id === activeChatId) || null,
    [chatThreads, activeChatId]
  );

  const totalUnreadChats = useMemo(
    () => chatThreads.reduce((acc, t) => acc + t.unreadCount, 0),
    [chatThreads]
  );

  const unreadNotificationsCount = useMemo(
    () => prayerNotifications.filter((n) => !n.read).length,
    [prayerNotifications]
  );

  // Automatically mark all messages in an active chat thread as 'read' when opened
  useEffect(() => {
    if (activeChatId) {
      setChatThreads((prev) => markThreadMessagesAsRead(prev, activeChatId));
    }
  }, [activeChatId]);

  const handleOpenChatThread = (threadId: string) => {
    setChatThreads((prev) => markThreadMessagesAsRead(prev, threadId));
    setActiveChatId(threadId);
  };

  const handleSendStoryReaction = (emoji: string) => {
    if (activeStoryIndex === null || !stories[activeStoryIndex]) return;
    const targetStory = stories[activeStoryIndex];

    // Spawn 3 staggered floating emoji particles for Instagram Live style feel
    const baseId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newParticles: FloatingReaction[] = [
      { id: `${baseId}_1`, emoji, leftPercent: 68 + Math.floor(Math.random() * 20) },
      { id: `${baseId}_2`, emoji, leftPercent: 52 + Math.floor(Math.random() * 25) },
      { id: `${baseId}_3`, emoji, leftPercent: 74 + Math.floor(Math.random() * 16) },
    ];
    setFloatingStoryReactions((prev) => [...prev, ...newParticles]);

    // Increment story reaction count
    setStories((prev) =>
      prev.map((st, idx) =>
        idx === activeStoryIndex ? { ...st, likes: st.likes + 1 } : st
      )
    );

    setTimeout(() => {
      setFloatingStoryReactions((prev) =>
        prev.filter((r) => !newParticles.some((np) => np.id === r.id))
      );
    }, 1850);

    showToast(`${emoji} Sent reaction to ${targetStory.authorName}!`);
  };

  // Background ticker that advances active ('downloading') sermon tasks and persists completed ones to IndexedDB
  const hasActiveDownloads = useMemo(
    () => downloadTasks.some((t) => t.status === 'downloading'),
    [downloadTasks]
  );

  useEffect(() => {
    if (!hasActiveDownloads) return;
    const timer = setInterval(() => {
      setDownloadTasks((prev) => {
        const { tasks: nextTasks, newlyCompleted } = advanceActiveDownloadTasks(prev, 20);
        if (newlyCompleted.length > 0) {
          void (async () => {
            for (const item of newlyCompleted) {
              await saveOfflineSermonToIndexedDB(item);
            }
            const updated = await loadOfflineSermonsFromIndexedDB();
            setOfflineSermons(updated);
            showToast(
              `✅ Downloaded "${newlyCompleted[0].title}" for offline watching!`
            );
          })();
        }
        return nextTasks;
      });
    }, 420);

    return () => clearInterval(timer);
  }, [hasActiveDownloads]);

  const handleDownloadSermonOffline = (sermon: SermonItem) => {
    setDownloadTasks((prev) => startOrResumeDownloadTask(prev, sermon));
    setShowDownloadsManager(true);
    showToast(`⬇️ Downloading "${sermon.title}" — manage in Downloads Manager`);
  };

  const handlePauseSermonDownload = (sermonId: string) => {
    setDownloadTasks((prev) => pauseDownloadTask(prev, sermonId));
    showToast('⏸ Download paused.');
  };

  const handleResumeSermonDownload = (sermonId: string) => {
    setDownloadTasks((prev) => resumeDownloadTask(prev, sermonId));
    showToast('▶️ Download resumed.');
  };

  const handleCancelSermonDownload = async (sermonId: string) => {
    setDownloadTasks((prev) => cancelDownloadTask(prev, sermonId));
    await removeOfflineSermonFromIndexedDB(sermonId);
    const updated = await loadOfflineSermonsFromIndexedDB();
    setOfflineSermons(updated);
    showToast('✕ Download removed from queue.');
  };

  const handleWatchOfflineSermon = (sermon: SermonItem) => {
    setActiveVideoSermonId(sermon.id);
    setUseDirectStreamPlayer(true);
    showToast(`▶️ Playing offline video: "${sermon.title}"`);
  };

  const handleUploadSermonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadSermonUrl(objectUrl);
    setUploadSermonSource('uploaded');
    if (!uploadSermonTitle.trim()) {
      setUploadSermonTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    showToast(`📹 Selected video "${file.name}" ready to publish!`);
  };

  const handlePublishUploadedSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadSermonTitle.trim()) {
      showToast('Please enter a sermon title 🎬');
      return;
    }

    let youtubeId = 'f2oxGYpuLkw';
    let videoUrl =
      uploadSermonUrl.trim() ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    let facebookVideoUrl: string | undefined;

    if (uploadSermonSource === 'youtube') {
      const match = uploadSermonUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
      youtubeId = match ? match[1] : uploadSermonUrl.trim() || 'f2oxGYpuLkw';
    } else if (uploadSermonSource === 'facebook') {
      facebookVideoUrl =
        uploadSermonUrl.trim() || 'https://www.facebook.com/facebook/videos/10153231379946729/';
    }

    const newSermon: SermonItem = {
      id: `sermon_custom_${Date.now()}`,
      title: uploadSermonTitle.trim(),
      speaker: uploadSermonSpeaker.trim() || userName,
      series: uploadSermonSeries.trim() || 'Sunday Sanctuary Uploads',
      duration: '45:00',
      publishedAt: 'Just now',
      youtubeId,
      source: uploadSermonSource,
      facebookVideoUrl,
      videoUrl,
      fileSizeMb: 42,
      views: '1 watching now',
      thumbnailUrl: COMMUNITY_PHOTOS.apostlePreaching,
      isPaid: false,
      body:
        uploadSermonBody.trim() ||
        'Uploaded directly to Gateway Connect for in-app streaming and offline playback.',
    };

    setSermons((prev) => [newSermon, ...prev]);
    setActiveVideoSermonId(newSermon.id);
    await saveOfflineSermonToIndexedDB(newSermon);
    const updatedOffline = await loadOfflineSermonsFromIndexedDB();
    setOfflineSermons(updatedOffline);

    setUploadSermonTitle('');
    setUploadSermonUrl('');
    setUploadSermonBody('');
    setShowUploadSermonModal(false);
    showToast('🎬 Sermon published & ready for in-app and offline playback!');
  };

  const filteredSermons = useMemo(() => {
    const baseList = sermonSourceFilter === 'offline' ? offlineSermons : sermons;
    const bySeriesAndSearch = filterSermons(baseList, selectedSeries, sermonSearch);
    if (
      sermonSourceFilter === 'all' ||
      sermonSourceFilter === 'offline' ||
      sermonSourceFilter === 'downloads'
    ) {
      return bySeriesAndSearch;
    }
    return bySeriesAndSearch.filter((s) => (s.source || 'youtube') === sermonSourceFilter);
  }, [sermons, offlineSermons, sermonSourceFilter, selectedSeries, sermonSearch]);

  const activeSermon = useMemo(
    () =>
      sermons.find((s) => s.id === activeVideoSermonId) ||
      offlineSermons.find((s) => s.id === activeVideoSermonId) ||
      sermons[0],
    [sermons, offlineSermons, activeVideoSermonId]
  );

  const filteredBooks = useMemo(
    () => filterBibleBooks(testamentFilter, bibleSearch, BIBLE_BOOKS),
    [testamentFilter, bibleSearch]
  );

  const selectedBook = useMemo(
    () => BIBLE_BOOKS.find((b) => b.name === selectedBookName) || BIBLE_BOOKS[18],
    [selectedBookName]
  );

  const currentVerses = useMemo(
    () => getChapterVerses(selectedBook.name, selectedChapter),
    [selectedBook.name, selectedChapter]
  );

  const highlightedVerseChoices = useMemo<HighlightedVerseChoice[]>(() => {
    const choices: HighlightedVerseChoice[] = [];
    for (const [key, isOn] of Object.entries(highlightedVerses)) {
      if (!isOn) continue;
      const parts = key.split(':');
      if (parts.length !== 3) continue;
      const [bookName, chStr, vStr] = parts;
      const chapterNum = Number(chStr);
      const verseNum = Number(vStr);
      const chVerses = getChapterVerses(bookName, chapterNum);
      const found = chVerses.find((item) => item.verse === verseNum);
      if (found) {
        choices.push({
          key,
          reference: `${bookName} ${chapterNum}:${verseNum}`,
          book: bookName,
          chapter: chapterNum,
          verse: verseNum,
          text: found.text,
        });
      }
    }
    if (choices.length === 0 && currentVerses.length > 0) {
      const first = currentVerses[0];
      choices.push({
        key: `${selectedBook.name}:${selectedChapter}:${first.verse}`,
        reference: `${selectedBook.name} ${selectedChapter}:${first.verse}`,
        book: selectedBook.name,
        chapter: selectedChapter,
        verse: first.verse,
        text: first.text,
      });
    }
    return choices;
  }, [highlightedVerses, currentVerses, selectedBook.name, selectedChapter]);

  const activeShareVerse = useMemo<HighlightedVerseChoice>(
    () =>
      highlightedVerseChoices.find((c) => c.key === activeShareVerseKey) ||
      highlightedVerseChoices[0],
    [highlightedVerseChoices, activeShareVerseKey]
  );

  const handleShareVerseCardToFeed = (
    dataUrl: string,
    verse: HighlightedVerseChoice,
    caption: string
  ) => {
    const newPost: SocialPost = {
      id: `post_verse_${Date.now()}`,
      authorId: 'usr_me',
      authorName: userName,
      authorHandle: userHandle,
      authorRole: 'Gateway Member',
      verified: true,
      avatarColor: '#0095f6',
      initials: userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      body:
        caption.trim() ||
        `“${verse.text}” — ${verse.reference} (KJV) 🙌✨ #GatewayConnect`,
      customImageUrl: dataUrl || undefined,
      scriptureTag: `${verse.reference} (KJV)`,
      timestamp: 'Just now',
      likes: 1,
      liked: true,
      reposts: 0,
      reposted: false,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('feed');
    showToast(`✨ Shared ${verse.reference} Verse Card to the Gateway Feed!`);
  };

  const handleShareVerseCardToStory = (
    _dataUrl: string,
    verse: HighlightedVerseChoice
  ) => {
    const created: StoryItem = {
      id: `story_verse_${Date.now()}`,
      authorId: 'usr_me',
      authorName: 'Your Story',
      authorHandle: userHandle,
      verified: true,
      avatarColor: '#0095f6',
      initials: userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      caption: `📖 “${verse.text}” — ${verse.reference} (KJV) ✨🙏`,
      imageKey: 'sanctuaryWorship',
      timestamp: 'Just now',
      likes: 1,
    };
    setStories((prev) => [created, ...prev]);
    setActiveTab('feed');
    setActiveStoryIndex(0);
    showToast(`📸 Shared ${verse.reference} to your Story!`);
  };

  // Handlers
  const handleToggleFollow = (targetId: string, labelName?: string) => {
    setFollowedIds((prev) => {
      const exists = prev.includes(targetId);
      const next = exists ? prev.filter((id) => id !== targetId) : [...prev, targetId];
      showToast(
        exists
          ? `Unfollowed ${labelName || 'account'}`
          : `💙 Following ${labelName || 'account'}!`
      );
      return next;
    });
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() && !composerPhotoKey) {
      showToast('Write a message or choose a photo to post ✨');
      return;
    }
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorId: 'usr_me',
      authorName: userName,
      authorHandle: userHandle,
      authorRole: 'Gateway Member',
      verified: true,
      avatarColor: '#0095f6',
      initials: userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      body: composerText.trim() || 'Sharing a blessed moment from Gateway Sanctuary! 🙌✨',
      imageKey: composerPhotoKey || undefined,
      scriptureTag: composerScripture.trim() || undefined,
      timestamp: 'Just now',
      likes: 1,
      liked: true,
      reposts: 0,
      reposted: false,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposerText('');
    setComposerPhotoKey('');
    setComposerScripture('');
    setShowPhotoSelector(false);
    showToast('✨ Your post is live on the Gateway Feed!');
  };

  const handleToggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.liked;
        return {
          ...p,
          liked: nextLiked,
          likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      })
    );
  };

  const handleToggleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextReposted = !p.reposted;
        if (nextReposted) showToast('🔁 Reposted to your followers!');
        return {
          ...p,
          reposted: nextReposted,
          reposts: nextReposted ? p.reposts + 1 : Math.max(0, p.reposts - 1),
        };
      })
    );
  };

  const handleToggleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextSaved = !p.bookmarked;
        showToast(nextSaved ? '🔖 Saved to your bookmarks' : 'Removed from bookmarks');
        return { ...p, bookmarked: nextSaved };
      })
    );
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `c_${Date.now()}`,
                  authorName: userName,
                  authorHandle: userHandle,
                  text: draft,
                  timestamp: 'Just now',
                },
              ],
            }
          : p
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    showToast('💬 Reply posted!');
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StoryItem = {
      id: `story_${Date.now()}`,
      authorId: 'usr_me',
      authorName: 'Your Story',
      authorHandle: userHandle,
      verified: true,
      avatarColor: '#0095f6',
      initials: userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      caption:
        newStoryCaption.trim() ||
        '🙌 Walking in covenant favor and gratitude today! #GatewayConnect 💙✨',
      imageKey: newStoryPhotoKey,
      timestamp: 'Just now',
      likes: 1,
    };
    setStories((prev) => [created, ...prev]);
    setNewStoryCaption('');
    setShowCreateStoryModal(false);
    setActiveStoryIndex(0);
    showToast('📸 Story shared with your followers!');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat) return;
    if (!chatMessageInput.trim() && !chatPhotoKey) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: 'usr_me',
      senderName: 'You',
      text: chatMessageInput.trim() || '📸 Shared a photo',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'read' as const,
      imageKey: chatPhotoKey || undefined,
    };

    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeChat.id
          ? {
              ...t,
              lastMessage: `You: ${newMsg.text}`,
              lastTimestamp: 'Just now',
              unreadCount: 0,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    setChatMessageInput('');
    setChatPhotoKey('');
  };

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;
    const newThread: ChatThread = {
      id: `chat_${Date.now()}`,
      name: newChatName.trim(),
      handle: newChatType === 'group' ? 'New Fellowship Group' : 'Direct Chat',
      type: newChatType,
      avatarColor: '#0095f6',
      initials: newChatName
        .trim()
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      verified: false,
      online: true,
      membersCount: newChatType === 'group' ? 12 : undefined,
      unreadCount: 0,
      lastMessage: 'Conversation started 👋',
      lastTimestamp: 'Just now',
      messages: [
        {
          id: `m_init_${Date.now()}`,
          senderId: 'usr_me',
          senderName: 'You',
          text: `Shalom family! Welcome to ${newChatName.trim()} 🙌💙`,
          timestamp: 'Just now',
          isMe: true,
          status: 'read',
        },
      ],
    };
    setChatThreads((prev) => [newThread, ...prev]);
    setActiveChatId(newThread.id);
    setNewChatName('');
    setShowNewChatModal(false);
    showToast(`💬 Opened ${newThread.name}`);
  };

  // Prayer Altar submission & real-time notification trigger
  const handleAddPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerTitle.trim() || !prayerBody.trim()) {
      showToast('Please enter both a prayer title and petition details 🙏');
      return;
    }
    const newId = `pray_${Date.now()}`;
    const newPrayer: PrayerItem = {
      id: newId,
      userId: fbUser?.uid || 'usr_me',
      authorName: userName,
      title: prayerTitle.trim(),
      body: prayerBody.trim(),
      createdAt: 'Just now',
      prayingCount: 1,
    };

    prevPrayerCountsRef.current[newId] = 1;
    setPrayers((prev) => [newPrayer, ...prev]);
    setPrayerTitle('');
    setPrayerBody('');

    if (fbUser && isFirebaseConfigured) {
      const path = `prayerRequests/${newId}`;
      try {
        await setDoc(doc(db, 'prayerRequests', newId), {
          authorId: fbUser.uid,
          authorName: userName.slice(0, 100),
          title: newPrayer.title.slice(0, 140),
          body: newPrayer.body.slice(0, 1000),
          status: 'active',
          prayingCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.CREATE, path);
        } catch {
          // Handled
        }
      }
    }
    showToast('🙏 Your prayer petition is live on the Altar!');
  };

  const handlePrayWithMember = async (prayer: PrayerItem) => {
    const alreadyPrayed = prayedIds.includes(prayer.id);
    const nextCount = alreadyPrayed ? prayer.prayingCount : prayer.prayingCount + 1;

    if (!alreadyPrayed) {
      setPrayedIds((prev) => [...prev, prayer.id]);
      prevPrayerCountsRef.current[prayer.id] = nextCount;
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayer.id ? { ...p, prayingCount: nextCount } : p))
      );

      // Trigger real-time prayer alert notification banner & notification feed item
      const alertObj: PrayerAlertNotification = {
        id: `notif_${Date.now()}_${prayer.id}`,
        prayerId: prayer.id,
        prayerTitle: prayer.title,
        authorName: prayer.authorName,
        newPrayingCount: nextCount,
        delta: 1,
        timestamp: 'Just now',
        read: false,
      };
      setPrayerNotifications((prev) => [alertObj, ...prev.slice(0, 19)]);
      setLivePrayerBanner(alertObj);

      if (fbUser && isFirebaseConfigured && prayer.id.startsWith('pray_17')) {
        const path = `prayerRequests/${prayer.id}`;
        try {
          await updateDoc(doc(db, 'prayerRequests', prayer.id), {
            prayingCount: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Local count already updated
        }
      }
    } else {
      showToast(`🙏 You are standing in prayer for "${prayer.title}"`);
    }
  };

  // Giving submission stored in localforage IndexedDB + synced to Firestore when online
  const handleGiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(givingAmountInput);
    const validationError = validateGivingInput(numericAmount, givingMethod, givingPhone);
    if (validationError) {
      showToast(validationError);
      return;
    }
    const receipt = createGivingReceipt({
      amount: numericAmount,
      currency,
      fundId: selectedFundId,
      method: givingMethod,
      phone: givingPhone,
    });

    // Step 1: Always store immediately in local browser IndexedDB via localforage
    await saveReceiptToIndexedDB(receipt, false);
    const currentList = await loadReceiptsFromIndexedDB();
    setReceipts(currentList);

    // Step 2: Synchronize with Firestore when network is online and user is authenticated
    if (isOnline && fbUser && isFirebaseConfigured) {
      try {
        const syncResult = await syncOfflineReceiptsToFirestore(fbUser.uid);
        setReceipts(syncResult.receipts);
        showToast(`💙 Thank you! ${receipt.formattedAmount} (${receipt.fund}) receipt saved & synced.`);
        return;
      } catch {
        // Remains queued in IndexedDB
      }
    }

    showToast(
      `💙 Thank you! ${receipt.formattedAmount} (${receipt.fund}) saved to your device receipts.`
    );
  };

  const handleOpenKotlinProjectModal = () => {
    setShowKotlinModal(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGooglePopup();
      showToast(`✨ Welcome, ${user.displayName || user.email || 'Believer'}!`);
    } catch {
      showToast('Sign-in popup was closed.');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutFirebase();
      showToast('Signed out of your account.');
    } catch {
      showToast('Could not sign out.');
    }
  };

  const openDirectMessageWithProfile = (profile: MemberProfile) => {
    const existing = chatThreads.find(
      (t) => t.name.toLowerCase() === profile.name.toLowerCase() || t.handle === profile.handle
    );
    if (existing) {
      handleOpenChatThread(existing.id);
    } else {
      const created: ChatThread = {
        id: `chat_${profile.id}`,
        name: profile.name,
        handle: profile.handle,
        type: 'direct',
        avatarColor: profile.avatarColor,
        initials: profile.initials,
        verified: profile.verified,
        online: true,
        unreadCount: 0,
        lastMessage: 'Tap to send a message 👋',
        lastTimestamp: 'Now',
        messages: [
          {
            id: `m_welcome_${Date.now()}`,
            senderId: profile.id,
            senderName: profile.name,
            text: `Shalom! Blessings from ${profile.name} 🙏💙`,
            timestamp: 'Just now',
            isMe: false,
            status: 'read',
          },
        ],
      };
      setChatThreads((prev) => [created, ...prev]);
      setActiveChatId(created.id);
    }
    setViewedProfile(null);
    setActiveTab('chat');
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen flex flex-col items-center justify-start sm:justify-center sm:py-4 sm:px-4 selection:bg-[#0095f6]/30 transition-colors duration-200 ${
        isLight ? 'bg-[#e2e8f0] text-[#0f172a]' : 'bg-[#050811] text-[#f8fafc]'
      }`}
    >
      {/* Native Mobile App Shell Container (Edge-to-Edge on Mobile, Sleek Phone Frame on Desktop) */}
      <div
        className={`relative w-full max-w-[430px] h-dvh sm:min-h-[852px] sm:h-[92vh] sm:max-h-[900px] sm:rounded-[44px] sm:border-[6px] flex flex-col overflow-hidden transition-colors duration-200 ${
          isLight
            ? 'bg-[#f8fafc] text-[#0f172a] sm:border-slate-900 sm:shadow-[0_24px_80px_rgba(15,23,42,0.22)]'
            : 'bg-[#0b0f19] text-[#f8fafc] sm:border-slate-800/95 sm:shadow-[0_24px_80px_rgba(0,149,246,0.22)]'
        }`}
      >
        {/* Native Mobile Status Bar (Time, Dynamic Island Pill, 5G/Wi-Fi/Battery) */}
        <div
          className={`h-7 px-5 flex items-center justify-between text-[11px] font-bold shrink-0 select-none ${
            isLight ? 'bg-[#f1f5f9] text-slate-900 border-b border-slate-200' : 'bg-[#0b0f19] text-slate-200'
          }`}
        >
          <span className="font-mono-tabular">9:41</span>
          <div className="hidden sm:flex items-center justify-center w-24 h-4 rounded-full bg-black border border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-[#0095f6]/60 mr-1.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-[#0095f6]">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Offline Connectivity Banner */}
        {!isOnline && (
          <div className="bg-amber-500/90 text-slate-950 px-3 py-1 text-[11px] font-extrabold text-center shrink-0">
            ⚡ Offline Mode — Downloaded Sermons, Receipts & Bible available offline
          </div>
        )}

        {/* Mobile App Top Bar (52px) */}
        <header
          className={`h-13 backdrop-blur-md border-b px-3 flex items-center justify-between gap-1 shrink-0 z-20 ${
            isLight
              ? 'bg-white/95 border-slate-300 text-slate-900'
              : 'bg-[#0b0f19]/95 border-slate-800/80 text-white'
          }`}
        >
          {/* Brand Logo + Title */}
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-1.5 text-left focus:outline-none shrink-0"
          >
            <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-[#0095f6] via-[#38bdf8] to-[#6366f1] shrink-0">
              <img
                src={GATEWAY_LOGO_URL}
                alt="Gateway Connect"
                className="w-full h-full rounded-full object-cover bg-[#0b0f19]"
              />
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                <span
                  className={`text-xs font-extrabold tracking-tight whitespace-nowrap ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  Gateway
                </span>
                <CheckCircle2 className="w-3 h-3 text-[#0095f6] shrink-0 fill-[#0095f6]/20" />
              </div>
              <p className="text-[8px] text-[#0095f6] font-bold leading-none">
                Kotlin Android ✨
              </p>
            </div>
          </button>

          {/* Quick Ministry Pills (Bible, Give) */}
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#131d31] border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('bible')}
              title="KJV Bible"
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-0.5 ${
                activeTab === 'bible'
                  ? 'bg-[#0095f6] text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>📖</span>
              <span>Bible</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              title="Give & Store"
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-0.5 ${
                activeTab === 'store'
                  ? 'bg-[#0095f6] text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>💝</span>
              <span>Give</span>
            </button>
          </div>

          {/* Right Actions: Theme Toggle, Kotlin APK Source, Notifications Bell & Sign In */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle color theme"
              title={isLight ? 'Switch to Dark Theme' : 'Switch to High-Contrast Light Theme'}
              className={`h-7 px-2 rounded-full border text-[10px] font-extrabold flex items-center gap-1 transition ${
                isLight
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-[#131d31] text-amber-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {isLight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              <span>{isLight ? 'Dark' : 'Light'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenKotlinProjectModal}
              aria-label="Kotlin Android Project"
              title="View Native Kotlin Android Project"
              className="w-7 h-7 rounded-full bg-[#0095f6]/15 hover:bg-[#0095f6]/25 border border-[#0095f6]/40 flex items-center justify-center text-[#0095f6] transition"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNotificationsDrawer((prev) => !prev);
                setPrayerNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              aria-label="Notifications"
              className="relative w-7 h-7 rounded-full bg-[#131d31] hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-200 transition"
            >
              <Bell className="w-3.5 h-3.5 text-[#38bdf8]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#0095f6] text-[8px] font-bold text-white flex items-center justify-center font-mono-tabular">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {fbUser ? (
              <button
                type="button"
                onClick={handleGoogleSignOut}
                aria-label="Sign Out"
                title="Sign Out"
                className="w-7 h-7 rounded-full bg-[#131d31] hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                aria-label="Sign In"
                title="Sign In"
                className="w-7 h-7 rounded-full bg-[#0095f6] hover:bg-[#1d9bf0] text-white flex items-center justify-center shadow-xs transition shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </header>

        {/* Real-Time Prayer Alert Banner */}
        {livePrayerBanner && (
          <div className="bg-gradient-to-r from-[#0095f6] via-[#0284c7] to-[#1d9bf0] text-white px-3 py-2 shadow-md shrink-0 z-20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
                <span className="text-sm shrink-0">🙏🔔</span>
                <span className="truncate">
                  Someone prayed with <strong>&ldquo;{livePrayerBanner.prayerTitle}&rdquo;</strong> (
                  {livePrayerBanner.newPrayingCount})
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('prayer');
                    setLivePrayerBanner(null);
                  }}
                  className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-[10px] font-bold transition"
                >
                  Altar
                </button>
                <button
                  type="button"
                  onClick={() => setLivePrayerBanner(null)}
                  aria-label="Dismiss prayer alert"
                  className="p-0.5 rounded-full hover:bg-white/20 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Mobile Screen Content Area */}
        <main
          className={`flex-1 overflow-y-auto no-scrollbar pb-4 transition-colors duration-200 ${
            isLight ? 'bg-[#f8fafc] text-[#0f172a]' : 'bg-[#0b0f19] text-[#f8fafc]'
          }`}
        >
          {/* ==================== 1. HOME FEED (X + INSTAGRAM STORIES) ==================== */}
          {activeTab === 'feed' && (
            <div>
              {/* Feed Subheader: For You / Following */}
              <div className="sticky top-0 z-10 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800 grid grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFeedFilter('foryou')}
                  className="py-3 text-xs font-bold text-center relative transition hover:bg-slate-900/50"
                >
                  <span className={feedFilter === 'foryou' ? 'text-white' : 'text-slate-400'}>
                    ✨ For You
                  </span>
                  {feedFilter === 'foryou' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full bg-[#0095f6]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('following')}
                  className="py-3 text-xs font-bold text-center relative transition hover:bg-slate-900/50"
                >
                  <span className={feedFilter === 'following' ? 'text-white' : 'text-slate-400'}>
                    💙 Following ({followedIds.length})
                  </span>
                  {feedFilter === 'following' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full bg-[#0095f6]" />
                  )}
                </button>
              </div>

              {/* Instagram-Style Stories Row */}
              <div className="px-3.5 py-3 border-b border-slate-800/80 bg-[#0e1525]/60">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setShowCreateStoryModal(true)}
                    className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                  >
                    <div className="relative w-15 h-15 rounded-full p-0.5 border-2 border-dashed border-[#0095f6] flex items-center justify-center bg-[#131d31] group-hover:scale-105 transition">
                      <Plus className="w-5 h-5 text-[#0095f6]" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0095f6] text-white text-[10px] font-bold flex items-center justify-center shadow">
                        +
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300">Your Story</span>
                  </button>

                  {stories.map((story, idx) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => setActiveStoryIndex(idx)}
                      className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                    >
                      <div className="w-15 h-15 rounded-full p-[2px] bg-gradient-to-tr from-[#0095f6] via-[#38bdf8] to-[#6366f1] group-hover:scale-105 transition">
                        <div className="w-full h-full rounded-full bg-[#0b0f19] p-0.5 overflow-hidden relative">
                          <img
                            src={
                              COMMUNITY_PHOTOS[
                                story.imageKey as keyof typeof COMMUNITY_PHOTOS
                              ] || COMMUNITY_PHOTOS.sanctuaryWorship
                            }
                            alt={story.authorName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-200 max-w-[64px] truncate">
                        {story.authorName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* X / Instagram Post Composer */}
              <form
                onSubmit={handlePublishPost}
                className="p-3.5 border-b border-slate-800 bg-[#131d31]/50 space-y-2.5"
              >
                <div className="flex gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0095f6] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    {userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <textarea
                      rows={2}
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder="What is God doing in your life today? Share a word, photo, or testimony ✨🙏"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none resize-none"
                    />

                    {composerPhotoKey && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-48">
                        <img
                          src={COMMUNITY_PHOTOS[composerPhotoKey]}
                          alt="Selected attachment"
                          className="w-full h-44 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setComposerPhotoKey('')}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {showPhotoSelector && (
                      <div className="p-2.5 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400">
                          📸 Choose a Sanctuary Photo to Attach:
                        </p>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {PHOTO_PRESETS.map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => {
                                setComposerPhotoKey(preset.key);
                                setShowPhotoSelector(false);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold shrink-0 border transition ${
                                composerPhotoKey === preset.key
                                  ? 'bg-[#0095f6] text-white border-[#0095f6]'
                                  : 'bg-[#131d31] text-slate-300 border-slate-700'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Composer Toolbar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPhotoSelector((prev) => !prev)}
                          className="min-h-[34px] px-2 rounded-xl hover:bg-slate-800 text-[#0095f6] text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setComposerScripture((prev) =>
                              prev ? '' : 'Isaiah 49:15-16'
                            )
                          }
                          className={`min-h-[34px] px-2 rounded-xl hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition ${
                            composerScripture ? 'text-[#38bdf8] bg-slate-800/80' : 'text-[#0095f6]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>{composerScripture || 'Scripture'}</span>
                        </button>
                        {['🔥', '🙏', '💙'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setComposerText((prev) => `${prev} ${emoji}`.trimStart())}
                            className="w-7 h-7 rounded-full hover:bg-slate-800 text-xs flex items-center justify-center transition"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="min-h-[34px] px-4 rounded-full bg-[#0095f6] hover:bg-[#1d9bf0] text-white text-xs font-extrabold shadow-md shadow-[#0095f6]/20 transition shrink-0"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Social Feed Stream */}
              <div className="divide-y divide-slate-800/80">
                {displayedPosts.map((post) => {
                  const isFollowing = followedIds.includes(post.authorId);
                  const photoUrl = post.imageKey
                    ? COMMUNITY_PHOTOS[post.imageKey as keyof typeof COMMUNITY_PHOTOS]
                    : post.customImageUrl;
                  const memberObj =
                    SEED_PROFILES.find((m) => m.id === post.authorId) || SEED_PROFILES[0];

                  return (
                    <article
                      key={post.id}
                      className="p-3.5 hover:bg-[#131d31]/30 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => setViewedProfile(memberObj)}
                          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs text-white shrink-0 ring-2 ring-[#0095f6]/40"
                            style={{ backgroundColor: post.avatarColor }}
                          >
                            {post.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white group-hover:underline truncate">
                                {post.authorName}
                              </span>
                              {post.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0095f6] shrink-0 fill-[#0095f6]/20" />
                              )}
                              <span className="text-[11px] text-slate-400 truncate">
                                {post.authorHandle} · {post.timestamp}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#38bdf8] font-medium block">
                              {post.authorRole}
                            </span>
                          </div>
                        </div>

                        {post.authorId !== 'usr_me' && (
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(post.authorId, post.authorName)}
                            className={`min-h-[30px] px-3 rounded-full text-[11px] font-bold transition shrink-0 ${
                              isFollowing
                                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                : 'bg-[#0095f6] text-white'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                        {post.body}
                      </p>

                      {post.scriptureTag && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0095f6]/15 border border-[#0095f6]/30 text-[11px] font-semibold text-[#38bdf8]">
                          <span>📖</span>
                          <span>{post.scriptureTag}</span>
                        </div>
                      )}

                      {photoUrl && (
                        <div
                          onDoubleClick={() => handleToggleLikePost(post.id)}
                          className="rounded-2xl overflow-hidden border border-slate-800 bg-[#131d31] cursor-pointer"
                        >
                          <img
                            src={photoUrl}
                            alt={post.authorName}
                            className="w-full max-h-[340px] object-cover"
                          />
                        </div>
                      )}

                      {/* Interaction Row */}
                      <div className="flex items-center justify-between pt-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCommentsPostId((prev) =>
                              prev === post.id ? null : post.id
                            )
                          }
                          className="min-h-[38px] px-2 rounded-full hover:bg-[#0095f6]/10 hover:text-[#0095f6] flex items-center gap-1.5 text-xs font-semibold transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-mono-tabular">{post.comments.length}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRepost(post.id)}
                          className={`min-h-[38px] px-2 rounded-full hover:bg-emerald-500/10 flex items-center gap-1.5 text-xs font-semibold transition ${
                            post.reposted ? 'text-emerald-400' : 'hover:text-emerald-400'
                          }`}
                        >
                          <Repeat2 className="w-4 h-4" />
                          <span className="font-mono-tabular">{post.reposts}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLikePost(post.id)}
                          className={`min-h-[38px] px-2 rounded-full hover:bg-rose-500/10 flex items-center gap-1.5 text-xs font-semibold transition ${
                            post.liked ? 'text-rose-500' : 'hover:text-rose-500'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${post.liked ? 'fill-rose-500 text-rose-500' : ''}`}
                          />
                          <span className="font-mono-tabular">{post.likes}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(post.id)}
                          aria-label="Bookmark post"
                          className={`min-h-[38px] px-2 rounded-full hover:bg-[#0095f6]/10 flex items-center gap-1 text-xs transition ${
                            post.bookmarked ? 'text-[#0095f6]' : 'hover:text-[#0095f6]'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              post.bookmarked ? 'fill-[#0095f6] text-[#0095f6]' : ''
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              void navigator.clipboard.writeText(
                                `${post.authorName}: "${post.body}" — Gateway Connect`
                              );
                            }
                            showToast('🔗 Post link copied to share!');
                          }}
                          aria-label="Share post"
                          className="min-h-[38px] px-2 rounded-full hover:bg-[#0095f6]/10 hover:text-[#0095f6] flex items-center gap-1 text-xs transition"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {expandedCommentsPostId === post.id && (
                        <div className="pt-2 mt-1 border-t border-slate-800/80 space-y-2">
                          {post.comments.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-[#131d31]/80 border border-slate-800/80 text-xs"
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-white">
                                  {c.authorName}{' '}
                                  <span className="text-slate-400 font-normal">
                                    {c.authorHandle}
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                              </div>
                              <p className="text-slate-200">{c.text}</p>
                            </div>
                          ))}

                          <form
                            onSubmit={(e) => handleAddComment(post.id, e)}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ''}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment or Amen... 💬"
                              className="flex-1 bg-[#131d31] border border-slate-700 rounded-full px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0095f6]"
                            />
                            <button
                              type="submit"
                              className="min-h-[32px] px-3 rounded-full bg-[#0095f6] text-white text-xs font-bold transition"
                            >
                              Reply
                            </button>
                          </form>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 2. WHATSAPP-STYLE IN-APP CHAT ==================== */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[calc(100vh-9.5rem)] sm:h-[710px]">
              {!activeChat ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3.5 border-b border-slate-800 bg-[#131d31]/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <span>💬 Gateway Messenger</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#0095f6]/20 text-[#38bdf8] text-[10px] font-mono-tabular">
                            {chatThreads.length} chats
                          </span>
                        </h1>
                        <p className="text-[11px] text-slate-400">
                          Instant fellowship chat, prayer lines & worship groups
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewChatModal(true)}
                        className="min-h-[36px] px-3 rounded-full bg-[#0095f6] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Search messages or members..."
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0095f6]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          { id: 'all', label: 'All Chats' },
                          { id: 'unread', label: `Unread (${totalUnreadChats})` },
                          { id: 'group', label: '🌍 Groups' },
                          { id: 'direct', label: '👤 Direct' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setChatFilter(tab.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition ${
                            chatFilter === tab.id
                              ? 'bg-[#0095f6] text-white'
                              : 'bg-[#0b0f19] text-slate-300 border border-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
                    {filteredChats.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => handleOpenChatThread(thread.id)}
                        className="w-full p-3.5 hover:bg-[#131d31]/70 flex items-center justify-between gap-2.5 text-left transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-xs"
                              style={{ backgroundColor: thread.avatarColor }}
                            >
                              {thread.initials}
                            </div>
                            {thread.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0b0f19]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs sm:text-sm font-bold text-white truncate">
                                {thread.name}
                              </span>
                              {thread.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {thread.lastMessage}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono-tabular">
                            {thread.lastTimestamp}
                          </span>
                          {thread.unreadCount > 0 ? (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0095f6] text-white text-[10px] font-bold flex items-center justify-center font-mono-tabular">
                              {thread.unreadCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#38bdf8]">
                              <CheckCheck className="w-3.5 h-3.5 text-[#0095f6]" />
                              <span>Read</span>
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0b141a]">
                  <div className="px-3 py-2 bg-[#131d31] border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveChatId(null)}
                        aria-label="Back to chat list"
                        className="min-w-[36px] min-h-[36px] rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-200 transition"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                        style={{ backgroundColor: activeChat.avatarColor }}
                      >
                        {activeChat.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                            {activeChat.name}
                          </h2>
                          {activeChat.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-400 truncate">
                          ● {activeChat.handle} • All messages read ✓✓
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          showToast(`📹 Starting video fellowship with ${activeChat.name}...`)
                        }
                        aria-label="Video Call"
                        className="min-w-[36px] min-h-[36px] rounded-full hover:bg-slate-800 flex items-center justify-center text-[#0095f6] transition"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`📞 Calling ${activeChat.name}...`)}
                        aria-label="Voice Call"
                        className="min-w-[36px] min-h-[36px] rounded-full hover:bg-slate-800 flex items-center justify-center text-[#0095f6] transition"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Thread Switcher Strip */}
                  <div className="px-3 py-1.5 bg-[#0e1726] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveChatId(null)}
                      className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold shrink-0"
                    >
                      ☰ All ({chatThreads.length})
                    </button>
                    {chatThreads.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleOpenChatThread(t.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition ${
                          t.id === activeChat.id
                            ? 'bg-[#0095f6] text-white'
                            : 'bg-[#131d31] text-slate-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 rounded-full bg-[#182229] text-[10px] text-slate-300 font-semibold border border-slate-800">
                        🔒 Read receipts enabled • Messages marked Read ✓✓ on open
                      </span>
                    </div>

                    {activeChat.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-xs ${
                            m.isMe
                              ? 'bg-[#005c4b] text-white rounded-br-xs'
                              : 'bg-[#202c33] text-slate-100 rounded-bl-xs'
                          }`}
                        >
                          {!m.isMe && (
                            <p className="text-[10px] font-bold text-[#38bdf8] mb-0.5">
                              {m.senderName}
                            </p>
                          )}
                          {m.imageKey && (
                            <img
                              src={
                                COMMUNITY_PHOTOS[
                                  m.imageKey as keyof typeof COMMUNITY_PHOTOS
                                ]
                              }
                              alt="Chat attachment"
                              className="w-full max-h-44 object-cover rounded-xl mb-1.5"
                            />
                          )}
                          <p className="text-xs leading-relaxed">{m.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[9px] text-slate-300/80 font-mono-tabular">
                              {m.timestamp}
                            </span>
                            <span
                              data-testid={`msg-status-${m.id}`}
                              className={`inline-flex items-center gap-0.5 text-[9px] font-bold ${
                                m.status === 'read' ? 'text-[#38bdf8]' : 'text-slate-400'
                              }`}
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>{m.status === 'read' ? 'Read' : 'Delivered'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-2 bg-[#131d31] border-t border-slate-800 space-y-1.5"
                  >
                    {chatPhotoKey && (
                      <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-[#0b0f19] text-[11px] text-[#38bdf8]">
                        <span>📸 Photo attached</span>
                        <button
                          type="button"
                          onClick={() => setChatPhotoKey('')}
                          className="text-rose-400 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setChatMessageInput((prev) => `${prev} 🙏🔥`.trimStart())
                        }
                        aria-label="Insert Emoji"
                        className="min-w-[38px] min-h-[38px] rounded-full bg-[#202c33] flex items-center justify-center text-slate-200"
                      >
                        <Smile className="w-4 h-4 text-[#38bdf8]" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setChatPhotoKey((prev) => (prev ? '' : 'sanctuaryWorship'))
                        }
                        aria-label="Attach Sanctuary Photo"
                        className="min-w-[38px] min-h-[38px] rounded-full bg-[#202c33] flex items-center justify-center text-slate-200"
                      >
                        <ImageIcon className="w-4 h-4 text-[#0095f6]" />
                      </button>
                      <input
                        type="text"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#202c33] border border-slate-700/80 rounded-full px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0095f6]"
                      />
                      <button
                        type="submit"
                        aria-label="Send Message"
                        className="min-w-[40px] min-h-[40px] rounded-full bg-[#0095f6] text-white flex items-center justify-center shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. GROUPS, MINISTRY PAGES & EVENTS ==================== */}
          {activeTab === 'groups' && (
            <div className="p-3.5 space-y-4">
              <div>
                <h1 className="text-base font-extrabold text-white">
                  🌍 Communities, Pages & Events
                </h1>
                <p className="text-xs text-slate-400">
                  Connect with fellowship circles, follow official ministry pages & RSVP
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-[#131d31] p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setGroupsSubTab('groups')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    groupsSubTab === 'groups'
                      ? 'bg-[#0095f6] text-white shadow'
                      : 'text-slate-300'
                  }`}
                >
                  🤝 Groups ({SEED_GROUPS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupsSubTab('pages')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    groupsSubTab === 'pages'
                      ? 'bg-[#0095f6] text-white shadow'
                      : 'text-slate-300'
                  }`}
                >
                  📣 Pages ({SEED_MINISTRY_PAGES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupsSubTab('events')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    groupsSubTab === 'events'
                      ? 'bg-[#0095f6] text-white shadow'
                      : 'text-slate-300'
                  }`}
                >
                  📅 Events ({SEED_EVENTS.length})
                </button>
              </div>

              {groupsSubTab === 'groups' && (
                <div className="space-y-3">
                  {SEED_GROUPS.map((group) => {
                    const isJoined = joinedGroupIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2.5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-white">{group.name}</h2>
                            {group.isPaid && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                Academy Pass
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {group.description}
                          </p>
                          <p className="text-[11px] text-[#38bdf8] mt-1.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{group.location}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setJoinedGroupIds((prev) =>
                                isJoined
                                  ? prev.filter((id) => id !== group.id)
                                  : [...prev, group.id]
                              );
                              showToast(
                                isJoined ? `Left ${group.name}` : `🎉 Joined ${group.name}!`
                              );
                            }}
                            className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold transition ${
                              isJoined
                                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                : 'bg-[#0095f6] text-white'
                            }`}
                          >
                            {isJoined ? '✓ Member (Joined)' : '+ Join Group'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatId('chat_sanctuary_lounge');
                              setActiveTab('chat');
                            }}
                            className="min-h-[40px] px-3 rounded-xl bg-[#0b0f19] border border-slate-700 text-xs font-bold text-[#38bdf8] flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {groupsSubTab === 'pages' && (
                <div className="space-y-3">
                  {SEED_MINISTRY_PAGES.map((page) => {
                    const isFollowing = followedIds.includes(page.id);
                    return (
                      <div
                        key={page.id}
                        className="rounded-2xl bg-[#131d31] border border-slate-800 overflow-hidden"
                      >
                        <div className="h-24 relative">
                          <img
                            src={
                              COMMUNITY_PHOTOS[
                                page.bannerKey as keyof typeof COMMUNITY_PHOTOS
                              ]
                            }
                            alt={page.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#131d31] via-black/30 to-transparent" />
                        </div>
                        <div className="p-3.5 -mt-7 relative space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm ring-4 ring-[#131d31]"
                              style={{ backgroundColor: page.avatarColor }}
                            >
                              {page.initials}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleFollow(page.id, page.name)}
                              className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold transition ${
                                isFollowing
                                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                  : 'bg-[#0095f6] text-white'
                              }`}
                            >
                              {isFollowing ? 'Following ✓' : '+ Follow Page'}
                            </button>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="text-sm font-extrabold text-white">{page.name}</h3>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0095f6]" />
                            </div>
                            <p className="text-[11px] text-[#38bdf8] font-medium">
                              {page.handle} • {page.category}
                            </p>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {page.description}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono-tabular">
                            🌍 {page.followersCount.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {groupsSubTab === 'events' && (
                <div className="space-y-3">
                  {SEED_EVENTS.map((evt) => {
                    const isRsvped = rsvpedEventIds.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-[#0095f6]/15 text-[#38bdf8] text-[10px] font-bold">
                            📅 {evt.category}
                          </span>
                          <span className="text-[11px] text-slate-300 font-mono-tabular">
                            {evt.eventDate} • {evt.eventTime}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-white">{evt.title}</h3>
                        <p className="text-xs text-slate-300">{evt.description}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />
                          <span>{evt.location}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpedEventIds((prev) =>
                              isRsvped
                                ? prev.filter((id) => id !== evt.id)
                                : [...prev, evt.id]
                            );
                            showToast(
                              isRsvped
                                ? `Cancelled RSVP for ${evt.title}`
                                : `🙌 Seat reserved for ${evt.title}!`
                            );
                          }}
                          className={`w-full min-h-[40px] rounded-xl text-xs font-bold transition ${
                            isRsvped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-[#0095f6] text-white'
                          }`}
                        >
                          {isRsvped ? '✓ Attending Service (RSVP Confirmed)' : 'Reserve Seat / RSVP'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== 4. PRAYER ALTAR (REAL-TIME NOTIFICATIONS) ==================== */}
          {activeTab === 'prayer' && (
            <div className="p-3.5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0095f6]/20 via-[#131d31] to-[#131d31] border border-[#0095f6]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#38bdf8]">
                    🙏 24/7 Live Prayer Altar
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    ● Live Alerts Active
                  </span>
                </div>
                <h1 className="text-sm font-extrabold text-white">
                  Stand in Agreement & Receive Instant Prayer Alerts
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Whenever someone prays with a petition on the altar, you receive an instant live
                  notification alert 🔔💙
                </p>
              </div>

              <form
                onSubmit={handleAddPrayer}
                className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2.5"
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  ✍️ Post a Prayer Petition to the Altar
                </h2>
                <input
                  type="text"
                  value={prayerTitle}
                  onChange={(e) => setPrayerTitle(e.target.value)}
                  placeholder="Petition Title (e.g., Healing & Family Peace)"
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0095f6]"
                />
                <textarea
                  rows={3}
                  value={prayerBody}
                  onChange={(e) => setPrayerBody(e.target.value)}
                  placeholder="Share your prayer request so the church family can stand in agreement with you..."
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0095f6] resize-none"
                />
                <button
                  type="submit"
                  className="w-full min-h-[42px] rounded-xl bg-[#0095f6] hover:bg-[#1d9bf0] text-white font-bold text-xs shadow-md shadow-[#0095f6]/25 transition"
                >
                  🙏 Place Petition on the Altar
                </button>
              </form>

              <div className="space-y-3">
                {prayers.map((prayer) => {
                  const hasPrayed = prayedIds.includes(prayer.id);
                  return (
                    <div
                      key={prayer.id}
                      className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#0095f6]/20 text-[#38bdf8] font-bold text-xs flex items-center justify-center">
                            🙏
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{prayer.authorName}</p>
                            <p className="text-[10px] text-slate-400">{prayer.createdAt}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#0095f6]/15 text-[#38bdf8] text-xs font-bold font-mono-tabular">
                          🔥 {prayer.prayingCount} praying
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white">{prayer.title}</h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {prayer.body}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrayWithMember(prayer)}
                        className={`w-full min-h-[42px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                          hasPrayed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#0095f6] hover:bg-[#1d9bf0] text-white shadow-xs'
                        }`}
                      >
                        <span>
                          {hasPrayed ? '✓ Standing in Prayer Agreement' : '🙏 Pray With Member'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 5. KJV BIBLE READER ==================== */}
          {activeTab === 'bible' && (
            <div className="p-3.5 space-y-3.5">
              <div className="flex items-center justify-between gap-2 bg-[#131d31] p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                    📖 Authorised KJV Bible
                  </span>
                  <h1 className="text-base font-extrabold text-white">
                    {selectedBook.name} {selectedChapter}
                  </h1>
                </div>
                <div className="flex items-center gap-1">
                  {(['ALL', 'OT', 'NT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTestamentFilter(t)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        testamentFilter === t
                          ? 'bg-[#0095f6] text-white'
                          : 'bg-[#0b0f19] text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#131d31] p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bibleSearch}
                    onChange={(e) => setBibleSearch(e.target.value)}
                    placeholder="Search 66 books..."
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0095f6]"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {filteredBooks.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setSelectedBookName(b.name);
                        setSelectedChapter(1);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
                        selectedBook.name === b.name
                          ? 'bg-[#0095f6] text-white'
                          : 'bg-[#0b0f19] text-slate-300'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800">
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChapter(ch)}
                      className={`min-w-[30px] h-7 rounded-lg text-xs font-bold font-mono-tabular shrink-0 transition ${
                        selectedChapter === ch
                          ? 'bg-[#0095f6] text-white'
                          : 'bg-[#0b0f19] text-slate-300'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bible Verse Share Card Component (Pick Highlighted Verse & Generate Shareable Image) */}
              {activeShareVerse && (
                <BibleVerseShareCard
                  highlightedVerses={highlightedVerseChoices}
                  activeVerse={activeShareVerse}
                  onSelectVerse={(v) => setActiveShareVerseKey(v.key)}
                  onShareToFeed={handleShareVerseCardToFeed}
                  onShareToStory={handleShareVerseCardToStory}
                  onToast={showToast}
                />
              )}

              <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-300">
                    Tap any verse to highlight & load into the Verse Share Card Studio ✨
                  </p>
                </div>
                {currentVerses.map((v) => {
                  const key = `${selectedBook.name}:${selectedChapter}:${v.verse}`;
                  const isHighlighted = Boolean(highlightedVerses[key]);
                  return (
                    <div
                      key={v.verse}
                      onClick={() => {
                        setHighlightedVerses((prev) => ({ ...prev, [key]: true }));
                        setActiveShareVerseKey(key);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition border ${
                        isHighlighted
                          ? 'bg-[#0095f6]/15 border-[#0095f6]/40 text-white'
                          : 'bg-[#0b0f19]/60 border-transparent text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs leading-relaxed">
                          <span className="font-mono-tabular font-bold text-[#38bdf8] mr-1.5">
                            {v.verse}
                          </span>
                          {v.text}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedVerses((prev) => ({ ...prev, [key]: true }));
                              setActiveShareVerseKey(key);
                              showToast(
                                `🎨 Loaded ${selectedBook.name} ${selectedChapter}:${v.verse} into Share Card Studio!`
                              );
                            }}
                            className="px-2 py-0.5 rounded-full bg-[#0095f6]/20 text-[10px] font-bold text-[#38bdf8]"
                          >
                            🎨 Card
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedVerses((prev) => ({
                                ...prev,
                                [key]: !prev[key],
                              }));
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-white"
                          >
                            {isHighlighted ? '★' : '☆'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 6. SERMONS & IN-APP MEDIA ARCHIVE + GLOBAL DOWNLOADS MANAGER ==================== */}
          {activeTab === 'sermons' && (
            <div className="p-3.5 space-y-3.5">
              {/* Sermons Header + Downloads Toggle & Upload Sermon Action */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <span>🎬 Sanctuary Sermons & Media</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    Stream YouTube, Facebook Live & Uploaded sermons in-app or save offline
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDownloadsManager((prev) => !prev)}
                    aria-label="Toggle Downloads Manager"
                    className={`min-h-[36px] px-2.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 border transition ${
                      showDownloadsManager
                        ? 'bg-[#0095f6]/20 border-[#0095f6] text-[#38bdf8]'
                        : 'bg-[#131d31] border-slate-700 text-slate-300'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Downloads ({downloadTasks.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadSermonModal(true)}
                    className="min-h-[36px] px-3 rounded-full bg-[#0095f6] hover:bg-[#1d9bf0] text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-[#0095f6]/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Source Filter Pills: All, YouTube, Facebook, Uploaded, Downloads Manager */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { id: 'all', label: `All (${sermons.length})` },
                    { id: 'youtube', label: '▶️ YouTube' },
                    { id: 'facebook', label: '📘 Facebook' },
                    { id: 'uploaded', label: '📹 Uploaded' },
                    { id: 'downloads', label: `⬇️ Downloads (${downloadTasks.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSermonSourceFilter(tab.id);
                      if (tab.id === 'downloads') {
                        setShowDownloadsManager(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition ${
                      sermonSourceFilter === tab.id
                        ? 'bg-[#0095f6] text-white shadow-xs'
                        : 'bg-[#131d31] text-slate-300 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Global Sermon Downloads Manager View (Progress Bars + Pause / Resume / Cancel) */}
              {(showDownloadsManager || sermonSourceFilter === 'downloads') && (
                <SermonDownloadsManager
                  tasks={downloadTasks}
                  onPause={handlePauseSermonDownload}
                  onResume={handleResumeSermonDownload}
                  onCancel={handleCancelSermonDownload}
                  onWatchOffline={handleWatchOfflineSermon}
                  onStartSampleDownload={() => handleDownloadSermonOffline(activeSermon)}
                />
              )}

              {/* In-App Sermon Video Player Card */}
              <div className="rounded-2xl overflow-hidden bg-[#131d31] border border-slate-800 shadow-lg">
                <div className="aspect-video bg-black relative">
                  {activeSermon.isPaid && !unlockedSermonIds.includes(activeSermon.id) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#0b0f19] to-[#131d31]">
                      <Lock className="w-8 h-8 text-[#0095f6] mb-1.5" />
                      <h3 className="text-sm font-extrabold text-white">{activeSermon.title}</h3>
                      <p className="text-[11px] text-slate-300 mt-1 mb-3">
                        Unlock this Apostolic Masterclass session to watch the full broadcast.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setUnlockedSermonIds((prev) => [...prev, activeSermon.id]);
                          showToast(`🔓 Unlocked "${activeSermon.title}"!`);
                        }}
                        className="px-4 py-2 rounded-full bg-[#0095f6] text-white text-xs font-extrabold"
                      >
                        Unlock ({formatCurrencyAmount(activeSermon.priceUsd || 30, currency)})
                      </button>
                    </div>
                  ) : activeSermon.source === 'uploaded' ||
                    sermonSourceFilter === 'offline' ||
                    useDirectStreamPlayer ? (
                    <video
                      key={`${activeSermon.id}_video`}
                      src={
                        activeSermon.videoUrl ||
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                      }
                      poster={activeSermon.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover bg-black"
                    />
                  ) : activeSermon.source === 'facebook' ? (
                    <iframe
                      key={`${activeSermon.id}_fb`}
                      title={activeSermon.title}
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                        activeSermon.facebookVideoUrl ||
                          'https://www.facebook.com/facebook/videos/10153231379946729/'
                      )}&show_text=false&autoplay=false`}
                      className="w-full h-full border-0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <iframe
                      key={`${activeSermon.id}_yt`}
                      title={activeSermon.title}
                      src={`https://www.youtube.com/embed/${activeSermon.youtubeId}?rel=0&playsinline=1`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>

                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#0095f6]/20 text-[#38bdf8] text-[10px] font-bold uppercase">
                        {activeSermon.source === 'facebook'
                          ? '📘 Facebook Live'
                          : activeSermon.source === 'uploaded'
                          ? '📹 Sanctuary Upload'
                          : '▶️ YouTube Stream'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {activeSermon.series}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      ⏱ {activeSermon.duration} • {activeSermon.views || '1.9K views'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-white">{activeSermon.title}</h2>
                    <p className="text-[11px] text-[#38bdf8] font-semibold">
                      {activeSermon.speaker} • {activeSermon.publishedAt}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {activeSermon.body}
                    </p>
                  </div>

                  {/* Player Action Bar: Download Offline & Player Mode Switch */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    {(() => {
                      const task = downloadTasks.find((t) => t.sermonId === activeSermon.id);
                      const isCompleted =
                        task?.status === 'completed' ||
                        offlineSermons.some((os) => os.id === activeSermon.id);
                      const isDownloading = task?.status === 'downloading';
                      const isPaused = task?.status === 'paused';

                      return (
                        <button
                          type="button"
                          onClick={() => handleDownloadSermonOffline(activeSermon)}
                          className={`flex-1 min-h-[38px] px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isPaused
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-[#0095f6] hover:bg-[#1d9bf0] text-white'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {isDownloading
                              ? `Downloading ${task.progress}%...`
                              : isPaused
                              ? `Resume Download (${task.progress}%)`
                              : isCompleted
                              ? `✓ Saved Offline (${activeSermon.fileSizeMb || 48} MB)`
                              : `Download Offline (${activeSermon.fileSizeMb || 48} MB)`}
                          </span>
                        </button>
                      );
                    })()}

                    {activeSermon.source !== 'uploaded' && (
                      <button
                        type="button"
                        onClick={() => setUseDirectStreamPlayer((prev) => !prev)}
                        className="min-h-[38px] px-3 rounded-xl bg-[#0b0f19] border border-slate-700 text-[11px] font-bold text-[#38bdf8] flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3 h-3" />
                        <span>{useDirectStreamPlayer ? 'Embed Player' : 'Direct HD Video'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sermonSearch}
                  onChange={(e) => setSermonSearch(e.target.value)}
                  placeholder="Search YouTube, Facebook or Uploaded sermons..."
                  className="w-full bg-[#131d31] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
                />
              </div>

              <div className="space-y-2">
                {filteredSermons.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#131d31]/60 border border-slate-800 text-center space-y-2">
                    <p className="text-xs font-bold text-white">No sermons match this filter yet</p>
                    <p className="text-[11px] text-slate-400">
                      Tap &ldquo;Download Offline&rdquo; on any sermon or upload a new sanctuary video.
                    </p>
                  </div>
                ) : (
                  filteredSermons.map((s) => {
                    const task = downloadTasks.find((t) => t.sermonId === s.id);
                    const isOfflineSaved =
                      task?.status === 'completed' ||
                      offlineSermons.some((os) => os.id === s.id);
                    return (
                      <div
                        key={s.id}
                        className={`w-full p-2.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                          activeSermon.id === s.id
                            ? 'bg-[#131d31] border-[#0095f6]'
                            : 'bg-[#131d31]/60 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVideoSermonId(s.id);
                            if (s.source === 'uploaded') {
                              setUseDirectStreamPlayer(true);
                            } else {
                              setUseDirectStreamPlayer(false);
                            }
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <div className="relative w-22 h-15 rounded-xl overflow-hidden shrink-0 bg-black">
                            <img
                              src={s.thumbnailUrl}
                              alt={s.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-bold text-white font-mono-tabular">
                              {s.duration}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-extrabold text-[#38bdf8] uppercase">
                                {s.source === 'facebook'
                                  ? '📘 Facebook'
                                  : s.source === 'uploaded'
                                  ? '📹 Uploaded'
                                  : '▶️ YouTube'}
                              </span>
                              {isOfflineSaved && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                  ✓ Offline
                                </span>
                              )}
                              {task?.status === 'downloading' && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#0095f6]/20 text-[#38bdf8] text-[9px] font-bold font-mono-tabular">
                                  ⬇ {task.progress}%
                                </span>
                              )}
                              {task?.status === 'paused' && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold font-mono-tabular">
                                  ⏸ {task.progress}%
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-bold text-white truncate mt-0.5">
                              {s.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">{s.speaker}</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            isOfflineSaved
                              ? handleCancelSermonDownload(s.id)
                              : handleDownloadSermonOffline(s)
                          }
                          title={isOfflineSaved ? 'Remove offline copy' : 'Download for offline watching'}
                          className={`min-w-[36px] min-h-[36px] px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center shrink-0 transition ${
                            isOfflineSaved
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-[#0b0f19] border-slate-700 text-[#38bdf8] hover:border-[#0095f6]'
                          }`}
                        >
                          {task?.status === 'downloading' ? (
                            <span>{task.progress}%</span>
                          ) : isOfflineSaved ? (
                            <Trash2 className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ==================== 7. GIVING & KINGDOM STORE (LOCALFORAGE SYNC) ==================== */}
          {activeTab === 'store' && (
            <div className="p-3.5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 bg-[#131d31] p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStoreSubTab('give')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      storeSubTab === 'give' ? 'bg-[#0095f6] text-white' : 'text-slate-300'
                    }`}
                  >
                    💝 Give
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreSubTab('merch')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      storeSubTab === 'merch' ? 'bg-[#0095f6] text-white' : 'text-slate-300'
                    }`}
                  >
                    🛍️ Store ({SEED_PRODUCTS.length})
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-[#131d31] p-1 rounded-xl border border-slate-800">
                  {(['USD', 'ZiG', 'GBP', 'ZAR'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                        currency === c ? 'bg-[#0095f6] text-white' : 'text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {storeSubTab === 'give' ? (
                <div className="space-y-4">
                  <form
                    onSubmit={handleGiveSubmit}
                    className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-3.5"
                  >
                    <div>
                      <h2 className="text-sm font-extrabold text-white">
                        💝 Kingdom Giving & Covenant Partnership
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Receipts are saved immediately on your device and synced automatically when
                        online ✨
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {GIVING_FUNDS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFundId(f.id)}
                          className={`p-2 rounded-xl border text-left transition ${
                            selectedFundId === f.id
                              ? 'bg-[#0095f6]/15 border-[#0095f6] text-white'
                              : 'bg-[#0b0f19] border-slate-800 text-slate-300'
                          }`}
                        >
                          <p className="text-xs font-bold">{f.name}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{f.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">
                        Offering Amount (USD Base • {currency} Equivalent)
                      </label>
                      <div className="flex gap-1.5">
                        {[10, 25, 50, 100, 250].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setGivingAmountInput(String(amt))}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono-tabular border transition ${
                              givingAmountInput === String(amt)
                                ? 'bg-[#0095f6] text-white border-[#0095f6]'
                                : 'bg-[#0b0f19] text-slate-300 border-slate-800'
                            }`}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={givingAmountInput}
                        onChange={(e) => setGivingAmountInput(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white font-mono-tabular focus:outline-none focus:border-[#0095f6]"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {(['EcoCash', 'Innbucks', 'OneMoney', 'Card'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setGivingMethod(m)}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                            givingMethod === m
                              ? 'bg-[#0095f6] text-white border-[#0095f6]'
                              : 'bg-[#0b0f19] text-slate-300 border-slate-800'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {givingMethod !== 'Card' && (
                      <input
                        type="tel"
                        value={givingPhone}
                        onChange={(e) => setGivingPhone(e.target.value)}
                        placeholder={`Enter ${givingMethod} mobile number`}
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
                      />
                    )}

                    <button
                      type="submit"
                      className="w-full min-h-[44px] rounded-xl bg-[#0095f6] hover:bg-[#1d9bf0] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#0095f6]/25 transition"
                    >
                      Give {formatCurrencyAmount(parseFloat(givingAmountInput) || 0, currency)} Now 💙
                    </button>
                  </form>

                  <div className="p-3.5 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold text-white">
                          🧾 Your Giving Receipts ({receipts.length})
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Stored on your device & synced when connected
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {receipts.map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{r.fund}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0095f6]/15 text-[#38bdf8] font-mono-tabular">
                                {r.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {r.method} • {r.timestamp} •{' '}
                              <span className="text-emerald-400">
                                {r.synced ? '✓ Backed Up' : '✓ Saved on Device'}
                              </span>
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-[#38bdf8] font-mono-tabular">
                            {r.formattedAmount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {SEED_PRODUCTS.map((prod) => {
                    const inCart = cartProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="rounded-2xl bg-[#131d31] border border-slate-800 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <img
                            src={STORE_IMAGE_MAP[prod.id]}
                            alt={prod.name}
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-2.5 space-y-1">
                            <span className="text-[9px] font-bold uppercase text-[#38bdf8]">
                              {prod.category}
                            </span>
                            <h3 className="text-xs font-bold text-white line-clamp-2">
                              {prod.name}
                            </h3>
                          </div>
                        </div>
                        <div className="p-2.5 pt-0 flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-white font-mono-tabular">
                            {formatCurrencyAmount(prod.price, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCartProductIds((prev) =>
                                inCart
                                  ? prev.filter((id) => id !== prod.id)
                                  : [...prev, prod.id]
                              );
                              showToast(
                                inCart
                                  ? `Removed ${prod.name}`
                                  : `🛍️ Added ${prod.name} to bag!`
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition ${
                              inCart
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-[#0095f6] text-white'
                            }`}
                          >
                            {inCart ? '✓ In Bag' : '+ Bag'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== 8. INSTAGRAM + X STYLE PROFILE ==================== */}
          {activeTab === 'profile' && (
            <div>
              <div className="h-28 bg-gradient-to-r from-[#0095f6] via-[#0284c7] to-[#6366f1] relative">
                <img
                  src={COMMUNITY_PHOTOS.sanctuaryWorship}
                  alt="Sanctuary Banner"
                  className="w-full h-full object-cover opacity-45"
                />
              </div>

              <div className="px-3.5 pb-3.5 -mt-9 relative space-y-2.5 border-b border-slate-800">
                <div className="flex items-end justify-between">
                  <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-[#0095f6] to-[#38bdf8]">
                    <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center text-white font-extrabold text-lg">
                      {userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleOpenKotlinProjectModal}
                      className="min-h-[34px] px-3 rounded-full bg-[#0095f6] text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Kotlin Android</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile((prev) => !prev)}
                      className="min-h-[34px] px-3 rounded-full bg-[#131d31] border border-slate-700 text-xs font-bold text-white"
                    >
                      {isEditingProfile ? 'Done' : 'Edit ✏️'}
                    </button>
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="p-3 rounded-2xl bg-[#131d31] border border-slate-700 space-y-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={userHandle}
                      onChange={(e) => setUserHandle(e.target.value)}
                      placeholder="@handle"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      placeholder="Bio"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white resize-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={userLocation}
                        onChange={(e) => setUserLocation(e.target.value)}
                        placeholder="City"
                        className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="Phone"
                        className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <h1 className="text-base font-extrabold text-white">{userName}</h1>
                      <CheckCircle2 className="w-4 h-4 text-[#0095f6]" />
                    </div>
                    <p className="text-xs text-slate-400">{userHandle}</p>
                    <p className="text-xs text-slate-200 leading-relaxed pt-0.5">{userBio}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0095f6]" />
                        {userLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0095f6]" />
                        Covenant Member
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <div className="p-2 rounded-xl bg-[#131d31] text-center">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">
                      {posts.length}
                    </p>
                    <p className="text-[10px] text-slate-400">Posts</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131d31] text-center">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">1,284</p>
                    <p className="text-[10px] text-slate-400">Followers</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131d31] text-center">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">
                      {followedIds.length}
                    </p>
                    <p className="text-[10px] text-slate-400">Following</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131d31] text-center">
                    <p className="text-xs font-extrabold text-[#38bdf8] font-mono-tabular">
                      {receipts.length}
                    </p>
                    <p className="text-[10px] text-slate-400">Receipts</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-b border-slate-800 text-xs font-bold">
                {(
                  [
                    { id: 'posts', label: '📝 Posts' },
                    { id: 'media', label: '📸 Photos' },
                    { id: 'saved', label: '🔖 Saved' },
                    { id: 'receipts', label: '🧾 Giving' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setProfileSubTab(t.id)}
                    className={`py-2.5 text-center border-b-2 transition ${
                      profileSubTab === t.id
                        ? 'border-[#0095f6] text-white'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-3.5">
                {profileSubTab === 'posts' && (
                  <div className="space-y-2.5">
                    {posts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-[#131d31] border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{p.authorName}</span>
                          <span className="text-slate-400">{p.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-200">{p.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {profileSubTab === 'media' && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(COMMUNITY_PHOTOS).map(([key, url]) => (
                      <img
                        key={key}
                        src={url}
                        alt={key}
                        className="w-full aspect-square object-cover rounded-xl border border-slate-800"
                      />
                    ))}
                  </div>
                )}

                {profileSubTab === 'saved' && (
                  <div className="space-y-2">
                    {posts.filter((p) => p.bookmarked).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        Tap the bookmark icon 🔖 on any post to save it here.
                      </p>
                    ) : (
                      posts
                        .filter((p) => p.bookmarked)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl bg-[#131d31] border border-slate-800 text-xs text-slate-200"
                          >
                            <strong className="text-white">{p.authorName}:</strong> {p.body}
                          </div>
                        ))
                    )}
                  </div>
                )}

                {profileSubTab === 'receipts' && (
                  <div className="space-y-2">
                    {receipts.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-[#131d31] border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">
                            {r.fund} ({r.method})
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {r.timestamp} • {r.synced ? '✓ Backed up' : '✓ Saved on device'}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-[#38bdf8] font-mono-tabular">
                          {r.formattedAmount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Toast Feedback Pill (Inside Mobile Shell) */}
        {toastMessage && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] bg-[#0095f6] text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-sky-300/30">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Notifications Drawer (Inside Mobile Shell) */}
        {showNotificationsDrawer && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
            <div className="w-[86%] bg-[#131d31] border-l border-slate-800 h-full flex flex-col p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0095f6]" />
                  <h2 className="text-xs font-bold text-white">Activity & Prayer Alerts 🙏</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotificationsDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {prayerNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowNotificationsDrawer(false);
                      setActiveTab('prayer');
                    }}
                    className="p-3 rounded-2xl bg-[#0b0f19]/90 border border-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#38bdf8] font-semibold mb-1">
                      <span>🙏 Prayer Agreement Alert</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      A believer prayed with <strong>&ldquo;{item.prayerTitle}&rdquo;</strong> by{' '}
                      {item.authorName}.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono-tabular">
                      🔥 {item.newPrayingCount} intercessors standing in faith
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Story Viewer Modal with Instagram Live Style Floating Emoji Reactions */}
        {activeStoryIndex !== null && stories[activeStoryIndex] && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="p-3 pt-4 flex gap-1.5">
              {stories.map((st, idx) => (
                <div
                  key={st.id}
                  onClick={() => setActiveStoryIndex(idx)}
                  className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
                >
                  <div
                    className={`h-full ${
                      idx <= activeStoryIndex ? 'w-full bg-[#0095f6]' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#0095f6]"
                  style={{ backgroundColor: stories[activeStoryIndex].avatarColor }}
                >
                  {stories[activeStoryIndex].initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {stories[activeStoryIndex].authorName}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    {stories[activeStoryIndex].timestamp} • ❤️ {stories[activeStoryIndex].likes} reactions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                aria-label="Close Story Viewer"
                className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <img
                src={
                  COMMUNITY_PHOTOS[
                    stories[activeStoryIndex].imageKey as keyof typeof COMMUNITY_PHOTOS
                  ] || COMMUNITY_PHOTOS.sanctuaryWorship
                }
                alt={stories[activeStoryIndex].authorName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

              {/* Floating Emoji Reactions Overlay (Instagram Live Style) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingStoryReactions.map((reaction) => (
                  <span
                    key={reaction.id}
                    data-testid="floating-story-reaction"
                    style={{ left: `${reaction.leftPercent}%` }}
                    className="absolute bottom-20 text-3xl select-none animate-float-reaction drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </div>

              <div className="absolute bottom-4 left-4 right-4 space-y-2.5">
                <p className="text-sm font-bold text-white leading-snug">
                  {stories[activeStoryIndex].caption}
                </p>

                {/* Quick Reaction Emoji Bar */}
                <div className="flex items-center justify-between bg-black/55 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5">
                  <span className="text-[10px] font-bold text-slate-300">Quick React:</span>
                  <div className="flex items-center gap-1.5">
                    {STORY_REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSendStoryReaction(emoji)}
                        aria-label={`React with ${emoji}`}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 text-base flex items-center justify-center transition transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#131d31] flex items-center gap-2">
              <input
                type="text"
                value={storyReplyText}
                onChange={(e) => setStoryReplyText(e.target.value)}
                placeholder={`Reply to ${stories[activeStoryIndex].authorName}...`}
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-full px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
              />
              <button
                type="button"
                onClick={() => handleSendStoryReaction('❤️')}
                aria-label="Send Heart Reaction"
                className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!storyReplyText.trim()) return;
                  showToast(`💬 Sent reply to ${stories[activeStoryIndex].authorName}!`);
                  setStoryReplyText('');
                  setActiveStoryIndex(null);
                }}
                aria-label="Send Story Reply"
                className="w-9 h-9 rounded-full bg-[#0095f6] text-white flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Story Bottom Sheet */}
        {showCreateStoryModal && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end">
            <form
              onSubmit={handleCreateStory}
              className="w-full rounded-t-3xl bg-[#131d31] border-t border-slate-800 p-4 space-y-3"
            >
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">📸 Share a New Story</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateStoryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={COMMUNITY_PHOTOS[newStoryPhotoKey]}
                alt="Story preview"
                className="w-full h-40 object-cover rounded-2xl border border-slate-700"
              />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setNewStoryPhotoKey(p.key)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
                      newStoryPhotoKey === p.key
                        ? 'bg-[#0095f6] text-white'
                        : 'bg-[#0b0f19] text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newStoryCaption}
                onChange={(e) => setNewStoryCaption(e.target.value)}
                placeholder="Add a caption or testimony... ✨🙏"
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0095f6]"
              />
              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-[#0095f6] text-white font-extrabold text-xs"
              >
                Publish to Your Story ✨
              </button>
            </form>
          </div>
        )}

        {/* New Chat Bottom Sheet */}
        {showNewChatModal && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end">
            <form
              onSubmit={handleCreateNewChat}
              className="w-full rounded-t-3xl bg-[#131d31] border-t border-slate-800 p-4 space-y-3"
            >
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">💬 Start New Conversation</h2>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewChatType('group')}
                  className={`py-2 rounded-xl text-xs font-bold ${
                    newChatType === 'group'
                      ? 'bg-[#0095f6] text-white'
                      : 'bg-[#0b0f19] text-slate-300'
                  }`}
                >
                  🌍 Fellowship Group
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatType('direct')}
                  className={`py-2 rounded-xl text-xs font-bold ${
                    newChatType === 'direct'
                      ? 'bg-[#0095f6] text-white'
                      : 'bg-[#0b0f19] text-slate-300'
                  }`}
                >
                  👤 Direct Chat
                </button>
              </div>
              <input
                type="text"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Enter group or member name..."
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#0095f6]"
              />
              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-[#0095f6] text-white font-extrabold text-xs"
              >
                Open Chat 💬
              </button>
            </form>
          </div>
        )}

        {/* Viewed Member Profile Bottom Sheet */}
        {viewedProfile && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end">
            <div className="w-full rounded-t-3xl bg-[#131d31] border-t border-slate-800 overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-[#0095f6] to-[#6366f1] relative">
                <button
                  type="button"
                  onClick={() => setViewedProfile(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 -mt-9 relative space-y-2.5">
                <div className="flex items-end justify-between">
                  <div
                    className="w-15 h-15 rounded-full flex items-center justify-center text-white font-extrabold text-base ring-4 ring-[#131d31]"
                    style={{ backgroundColor: viewedProfile.avatarColor }}
                  >
                    {viewedProfile.initials}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(viewedProfile.id, viewedProfile.name)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                        followedIds.includes(viewedProfile.id)
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-[#0095f6] text-white'
                      }`}
                    >
                      {followedIds.includes(viewedProfile.id) ? 'Following ✓' : 'Follow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDirectMessageWithProfile(viewedProfile)}
                      className="px-3 py-1.5 rounded-full bg-[#0b0f19] border border-slate-700 text-xs font-bold text-[#38bdf8]"
                    >
                      💬 Message
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-extrabold text-white">{viewedProfile.name}</h3>
                    {viewedProfile.verified && (
                      <CheckCircle2 className="w-4 h-4 text-[#0095f6]" />
                    )}
                  </div>
                  <p className="text-xs text-[#38bdf8]">
                    {viewedProfile.handle} • {viewedProfile.role}
                  </p>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{viewedProfile.bio}</p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-[#0b0f19]">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">
                      {viewedProfile.postsCount}
                    </p>
                    <p className="text-[10px] text-slate-400">Posts</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0b0f19]">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">
                      {viewedProfile.followersCount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">Followers</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0b0f19]">
                    <p className="text-xs font-extrabold text-white font-mono-tabular">
                      {viewedProfile.followingCount}
                    </p>
                    <p className="text-[10px] text-slate-400">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Sermon Video Modal */}
        {showUploadSermonModal && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end">
            <form
              onSubmit={handlePublishUploadedSermon}
              className="w-full rounded-t-3xl bg-[#131d31] border-t border-slate-800 p-4 space-y-3"
            >
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">
                  🎬 Upload or Link Sanctuary Sermon
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUploadSermonModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'uploaded', label: '📹 Upload File' },
                    { id: 'youtube', label: '▶️ YouTube' },
                    { id: 'facebook', label: '📘 Facebook' },
                  ] as const
                ).map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setUploadSermonSource(src.id)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      uploadSermonSource === src.id
                        ? 'bg-[#0095f6] text-white'
                        : 'bg-[#0b0f19] text-slate-300 border border-slate-800'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>

              {uploadSermonSource === 'uploaded' && (
                <label className="block p-3 rounded-2xl bg-[#0b0f19] border border-dashed border-[#0095f6]/60 text-center cursor-pointer hover:bg-slate-900/60 transition">
                  <span className="text-xs font-bold text-[#38bdf8] block">
                    📂 Tap to Select Video File (MP4 / MOV) from Device
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Plays directly in-app and saves for offline viewing
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleUploadSermonFileChange}
                    className="hidden"
                  />
                </label>
              )}

              <input
                type="text"
                value={uploadSermonTitle}
                onChange={(e) => setUploadSermonTitle(e.target.value)}
                placeholder="Sermon Title (e.g., Walking in Covenant Favor)"
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={uploadSermonSpeaker}
                  onChange={(e) => setUploadSermonSpeaker(e.target.value)}
                  placeholder="Speaker"
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
                />
                <input
                  type="text"
                  value={uploadSermonSeries}
                  onChange={(e) => setUploadSermonSeries(e.target.value)}
                  placeholder="Series"
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
                />
              </div>

              <input
                type="text"
                value={uploadSermonUrl}
                onChange={(e) => setUploadSermonUrl(e.target.value)}
                placeholder={
                  uploadSermonSource === 'youtube'
                    ? 'Paste YouTube Video URL or ID...'
                    : uploadSermonSource === 'facebook'
                    ? 'Paste Facebook Video URL...'
                    : 'Or paste direct MP4 video stream URL...'
                }
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6]"
              />

              <textarea
                rows={2}
                value={uploadSermonBody}
                onChange={(e) => setUploadSermonBody(e.target.value)}
                placeholder="Sermon notes & scripture references..."
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0095f6] resize-none"
              />

              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-[#0095f6] hover:bg-[#1d9bf0] text-white font-extrabold text-xs"
              >
                Publish Sermon to Player & Offline Library 🎬
              </button>
            </form>
          </div>
        )}

        {/* Native Kotlin Android Project Modal (Replaces PWA) */}
        {showKotlinModal && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end">
            <div className="w-full rounded-t-3xl bg-[#131d31] border-t border-slate-800 p-4 space-y-3 max-h-[86%] flex flex-col">
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto shrink-0" />
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <img
                    src={GATEWAY_LOGO_URL}
                    alt="Gateway App Icon"
                    className="w-10 h-10 rounded-2xl object-cover border border-[#0095f6]"
                  />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Native Kotlin Android Application 🤖
                    </h3>
                    <p className="text-[11px] text-[#38bdf8]">
                      /android-kotlin/ • Jetpack Compose + ExoPlayer + Room
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKotlinModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-1.5 text-[11px] text-slate-200 overflow-y-auto">
                <p className="font-bold text-[#38bdf8]">
                  Included Native Kotlin Project Files:
                </p>
                <ul className="space-y-1 text-slate-300 font-mono text-[10px]">
                  <li>• /android-kotlin/settings.gradle.kts</li>
                  <li>• /android-kotlin/app/build.gradle.kts</li>
                  <li>• /android-kotlin/app/src/main/AndroidManifest.xml</li>
                  <li>• /android-kotlin/app/src/main/java/org/joedaniels/gatewayconnect/MainActivity.kt</li>
                </ul>
                <pre className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto font-mono">
                  {KOTLIN_PREVIEW_SNIPPET}
                </pre>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      void navigator.clipboard.writeText(KOTLIN_PREVIEW_SNIPPET);
                    }
                    showToast('📋 Copied MainActivity.kt Kotlin code!');
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-[#0095f6] text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Kotlin Source</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowKotlinModal(false)}
                  className="min-h-[42px] px-4 rounded-xl bg-[#0b0f19] border border-slate-700 text-slate-200 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Native Mobile Bottom Tab Bar (6 Tabs Including Dedicated Sermons Tab) */}
        <nav
          className={`h-16 backdrop-blur-md border-t grid grid-cols-6 items-center px-1 shrink-0 z-30 ${
            isLight
              ? 'bg-white/95 border-slate-300 text-slate-800'
              : 'bg-[#0b0f19]/95 border-slate-800 text-slate-300'
          }`}
        >
          {(
            [
              { id: 'feed', label: 'Feed', icon: Home },
              { id: 'chat', label: 'Chat', icon: MessageCircle, badge: totalUnreadChats },
              { id: 'sermons', label: 'Sermons', icon: Video },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'prayer', label: 'Prayer', icon: HeartHandshake },
              { id: 'profile', label: 'Profile', icon: UserCheck },
            ] as Array<{
              id: NavTab;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
              badge?: number;
            }>
          ).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center relative transition ${
                  isActive
                    ? 'text-[#0095f6]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0095f6] text-white text-[9px] font-bold flex items-center justify-center font-mono-tabular">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-1">{item.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-[#0095f6] mt-0.5" />}
              </button>
            );
          })}
        </nav>

        {/* Native Mobile Home Indicator Pill */}
        <div
          className={`h-4 flex items-center justify-center shrink-0 ${
            isLight ? 'bg-white' : 'bg-[#0b0f19]'
          }`}
        >
          <div
            className={`w-28 h-1 rounded-full ${
              isLight ? 'bg-slate-400' : 'bg-slate-700/80'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default WebApp;
