import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Video,
  BookOpen,
  Users,
  ShoppingBag,
  User,
  Heart,
  Flame,
  Bell,
  BellRing,
  Search,
  CheckCircle2,
  Bookmark,
  StickyNote,
  Play,
  Send,
  X,
  LogOut,
  Sparkles,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  HandCoins,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { BIBLE_BOOKS, getChapterVerses } from './data/bibleData';
import {
  SEED_PRODUCTS,
  SEED_DEVOTIONALS,
  SEED_SERMONS,
  SEED_GROUPS,
  SEED_EVENTS,
  SEED_TESTIMONIES,
  SEED_PRAYERS,
  GIVING_FUNDS,
  CurrencyCode,
  StoreProduct,
  SermonItem,
  GivingReceipt,
  PrayerItem,
  formatCurrencyAmount,
  filterSermons,
  filterBibleBooks,
  validateGivingInput,
  createGivingReceipt,
} from './lib/domainLogic';
import { GATEWAY_LOGO_URL, STORE_IMAGE_MAP } from './lib/assets';
import {
  auth,
  db,
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
  signInWithGooglePopup,
  signOutFirebase,
  handleFirestoreError,
  OperationType,
} from './remote/firebase';

type TabKey = 'home' | 'sermons' | 'bible' | 'community' | 'store' | 'profile';
type BibleHighlightColor = 'gold' | 'emerald' | 'blue' | 'rose';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isFirebaseAuthenticated?: boolean;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_tinodaishe',
  name: 'Tinodaishe Chibi',
  email: 'tinodaishemchibi@gmail.com',
  phone: '0772000111',
  role: 'GATEWAY MEMBER',
  isFirebaseAuthenticated: false,
};

const UPCOMING_SERVICES = [
  {
    id: 'sund',
    title: 'Sunday Glorious Service',
    time: 'Sun • 09:00 AM CAT',
    venue: 'Main Sanctuary & Global Live',
    tag: 'Next Service',
  },
  {
    id: 'wed',
    title: 'Midweek Dominion & Word',
    time: 'Wed • 05:30 PM CAT',
    venue: 'Teaching Sanctuary & Stream',
    tag: 'Deep Bible',
  },
  {
    id: 'fri',
    title: 'Fire Friday Prayer Rally',
    time: 'Fri • 06:00 PM CAT',
    venue: 'Harare Sanctuary & Virtual',
    tag: 'Atmosphere',
  },
];

const INITIAL_DECREES = [
  { id: 'd1', user: 'Sister Tariro (Harare)', text: 'Amen! Receiving this word of divine speed!', time: '10:04' },
  { id: 'd2', user: 'Brother Farai (UK)', text: 'Watching live from London! The presence of God is heavy!', time: '10:05' },
  { id: 'd3', user: 'Deacon Mutasa', text: 'Hallelujah! Prophetic alignment is happening!', time: '10:06' },
  { id: 'd4', user: 'Chiedza (Bulawayo)', text: 'Glory to Jesus! No more stagnation!', time: '10:07' },
];

const TRENDING_DECREES_INIT = [
  {
    id: 'td1',
    author: 'Sister Tariro (Harare)',
    badgeLabel: 'Covenant Believer',
    avatarText: 'ST',
    text: 'After Friday prayer altar, God opened a corporate breakthrough for me this week! Divine speed is real!',
    likes: 48,
    liked: false,
    amened: false,
    time: '1h ago',
  },
  {
    id: 'td2',
    author: 'Brother Farai (UK)',
    badgeLabel: 'Verified Believer',
    avatarText: 'BF',
    text: "Apostle's decree of supernatural speed literally broke 3 years of visa delay in 48 hours. Glory to God!",
    likes: 65,
    liked: false,
    amened: false,
    time: '3h ago',
  },
  {
    id: 'td3',
    author: 'Deacon Mutasa',
    badgeLabel: 'Gold Partner',
    avatarText: 'DM',
    text: 'The atmosphere in the sanctuary is shifting. Miracles and financial releases are breaking out everywhere!',
    likes: 39,
    liked: false,
    amened: false,
    time: '5h ago',
  },
];

const HIGHLIGHT_CLASSES: Record<BibleHighlightColor, string> = {
  gold: 'bg-amber-500/25 border-amber-500/50',
  emerald: 'bg-emerald-500/25 border-emerald-500/50',
  blue: 'bg-sky-500/25 border-sky-500/50',
  rose: 'bg-rose-500/25 border-rose-500/50',
};

export default function WebApp() {
  const isAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [showWelcome, setShowWelcome] = useState<boolean>(!isAutostart);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Give / Tithe modal
  const [giveModalOpen, setGiveModalOpen] = useState(false);

  // Home state
  const [liveMuted, setLiveMuted] = useState(true);
  const [liveLikes, setLiveLikes] = useState(142);
  const [liveLiked, setLiveLiked] = useState(false);
  const [liveDecrees, setLiveDecrees] = useState(INITIAL_DECREES);
  const [decreeInput, setDecreeInput] = useState('');
  const [serviceReminders, setServiceReminders] = useState<Record<string, boolean>>({});
  const [trendingDecrees, setTrendingDecrees] = useState(TRENDING_DECREES_INIT);
  const [activeDevotionalId, setActiveDevotionalId] = useState<string>(SEED_DEVOTIONALS[0].id);

  // Sermons state
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [sermonSearch, setSermonSearch] = useState<string>('');
  const [playingSermon, setPlayingSermon] = useState<SermonItem | null>(null);
  const [savedSermonIds, setSavedSermonIds] = useState<string[]>(['sermon_1']);

  // Bible state
  const [selectedBook, setSelectedBook] = useState<string>('Psalms');
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [bookSearch, setBookSearch] = useState<string>('');
  const [bookPickerOpen, setBookPickerOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>(['Psalms 23:1', 'Isaiah 49:16']);
  const [highlights, setHighlights] = useState<Record<string, BibleHighlightColor>>({
    'Psalms 23:1': 'gold',
  });
  const [verseNotes, setVerseNotes] = useState<Record<string, string>>({
    'Psalms 23:1': 'Covenant declaration of supernatural supply and shepherd leadership.',
  });
  const [activeVerseRef, setActiveVerseRef] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>('');

  // Community & Prayer Wall state
  const [communitySection, setCommunitySection] = useState<'prayer' | 'groups' | 'testimonies' | 'events'>('prayer');
  const [prayers, setPrayers] = useState<PrayerItem[]>(SEED_PRAYERS);
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerBody, setPrayerBody] = useState('');
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({
    group_ignite_worship: true,
  });
  const [rsvpEvents, setRsvpEvents] = useState<Record<string, boolean>>({
    evt_sunday: true,
  });
  const [testimonies, setTestimonies] = useState(SEED_TESTIMONIES);

  // Store & Giving state
  const [storeSubTab, setStoreSubTab] = useState<'shop' | 'give'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [cartOrders, setCartOrders] = useState<Array<{ id: string; productName: string; size: string; priceFormatted: string }>>([]);

  // Giving form state
  const [givingFundId, setGivingFundId] = useState<string>('tithe');
  const [givingPresetAmount, setGivingPresetAmount] = useState<number>(50);
  const [givingCustomAmount, setGivingCustomAmount] = useState<string>('');
  const [givingMethod, setGivingMethod] = useState<'EcoCash' | 'OneMoney' | 'Innbucks' | 'Card'>('EcoCash');
  const [givingPhone, setGivingPhone] = useState<string>('0772000111');
  const [givingError, setGivingError] = useState<string | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<GivingReceipt | null>(null);
  const [givingHistory, setGivingHistory] = useState<GivingReceipt[]>([]);

  // Profile / Settings state
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setAuthReady(true);
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Gateway Member',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '0772000111',
          role: 'FIREBASE VERIFIED MEMBER',
          isFirebaseAuthenticated: true,
        });
        setShowWelcome(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Firestore listeners when Firebase Auth is active
  useEffect(() => {
    if (!authReady || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const prayersQuery = query(
      collection(db, 'prayerRequests'),
      where('status', 'in', ['active', 'answered']),
      limit(30)
    );
    const unsubPrayers = onSnapshot(
      prayersQuery,
      (snap) => {
        if (!snap.empty) {
          const remotePrayers: PrayerItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: String(data.authorId || ''),
              authorName: String(data.authorName || 'Covenant Member'),
              title: String(data.title || ''),
              body: String(data.body || ''),
              createdAt: 'Synced via Firebase',
              prayingCount: Number(data.prayingCount || 1),
            };
          });
          setPrayers([...remotePrayers, ...SEED_PRAYERS]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'prayerRequests');
      }
    );

    const receiptsQuery = query(
      collection(db, 'givingReceipts'),
      where('ownerId', '==', uid),
      limit(20)
    );
    const unsubReceipts = onSnapshot(
      receiptsQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteReceipts: GivingReceipt[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: String(data.receiptCode || d.id),
              amount: Number(data.amount || 0),
              formattedAmount: String(data.formattedAmount || '$0.00'),
              currency: (data.currency as CurrencyCode) || 'USD',
              fund: String(data.fund || 'Tithe'),
              method: String(data.method || 'EcoCash'),
              phone: 'Firebase Synced',
              timestamp: 'Cloud Firestore',
            };
          });
          setGivingHistory(remoteReceipts);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'givingReceipts');
      }
    );

    return () => {
      unsubPrayers();
      unsubReceipts();
    };
  }, [authReady, user?.isFirebaseAuthenticated]);

  // Filtered Bible books & verses
  const filteredBooks = useMemo(
    () => filterBibleBooks(testamentFilter, bookSearch),
    [testamentFilter, bookSearch]
  );
  const currentBookMeta = useMemo(
    () => BIBLE_BOOKS.find((b) => b.name === selectedBook) || BIBLE_BOOKS[18],
    [selectedBook]
  );
  const currentVerses = useMemo(
    () => getChapterVerses(selectedBook, selectedChapter),
    [selectedBook, selectedChapter]
  );

  // Filtered sermons
  const sermonSeriesList = useMemo(() => {
    const unique = Array.from(new Set(SEED_SERMONS.map((s) => s.series)));
    return ['All', ...unique];
  }, []);
  const filteredSermons = useMemo(
    () => filterSermons(SEED_SERMONS, selectedSeries, sermonSearch),
    [selectedSeries, sermonSearch]
  );

  // Store categories & products
  const storeCategories = useMemo(() => {
    const unique = Array.from(new Set(SEED_PRODUCTS.map((p) => p.category)));
    return ['All', ...unique];
  }, []);
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return SEED_PRODUCTS;
    return SEED_PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Handlers with Firebase Firestore persistence & blueprint validation
  const handlePostLiveDecree = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = decreeInput.trim().slice(0, 500);
    if (!cleanText) return;

    const decreeId = `dec_${Date.now()}`;
    const newMsg = {
      id: decreeId,
      user: user ? user.name : 'Guest Believer',
      text: cleanText,
      time: 'Just now',
    };
    setLiveDecrees((prev) => [newMsg, ...prev]);
    setDecreeInput('');

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'decrees', decreeId), {
          authorId: auth.currentUser.uid,
          authorName: (user?.name || 'Covenant Member').slice(0, 100),
          text: cleanText,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `decrees/${decreeId}`);
      }
    }
    showToast('Prophetic decree released to the sanctuary stream!');
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = prayerTitle.trim().slice(0, 140);
    const cleanBody = prayerBody.trim().slice(0, 1000);
    if (!cleanTitle || !cleanBody) {
      setPrayerError('Please enter both a prayer title and petition details.');
      return;
    }
    setPrayerError(null);
    const prayerId = `pray_${Date.now()}`;
    const created: PrayerItem = {
      id: prayerId,
      userId: user?.id || 'guest',
      authorName: user?.name || 'Covenant Member',
      title: cleanTitle,
      body: cleanBody,
      createdAt: 'Just now',
      prayingCount: 1,
    };
    setPrayers((prev) => [created, ...prev]);
    setPrayerTitle('');
    setPrayerBody('');

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'prayerRequests', prayerId), {
          authorId: auth.currentUser.uid,
          authorName: (user?.name || 'Covenant Member').slice(0, 100),
          title: cleanTitle,
          body: cleanBody,
          prayingCount: 1,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `prayerRequests/${prayerId}`);
      }
    }
    showToast('Prayer petition saved to Firebase Altar Wall!');
  };

  const handleProcessGiving = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = givingCustomAmount.trim()
      ? parseFloat(givingCustomAmount)
      : givingPresetAmount;

    const validationError = validateGivingInput(numericAmount, givingMethod, givingPhone);
    if (validationError) {
      setGivingError(validationError);
      return;
    }
    setGivingError(null);
    const receipt = createGivingReceipt({
      amount: numericAmount,
      currency,
      fundId: givingFundId,
      method: givingMethod,
      phone: givingPhone,
    });
    setLatestReceipt(receipt);
    setGivingHistory((prev) => [receipt, ...prev]);
    setGiveModalOpen(false);

    if (auth.currentUser) {
      const docId = `rcpt_${Date.now()}`;
      try {
        await setDoc(doc(db, 'givingReceipts', docId), {
          ownerId: auth.currentUser.uid,
          receiptCode: receipt.id.slice(0, 40),
          amount: receipt.amount,
          formattedAmount: receipt.formattedAmount.slice(0, 40),
          currency: receipt.currency,
          fund: receipt.fund.slice(0, 80),
          method: receipt.method.slice(0, 40),
          status: 'completed',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `givingReceipts/${docId}`);
      }
    }
    showToast(`Altar Seed ${receipt.id} confirmed!`);
  };

  const handleGoogleFirebaseLogin = async () => {
    setAuthError(null);
    try {
      const fbUser = await signInWithGooglePopup();
      showToast(`Signed in with Firebase as ${fbUser.displayName || fbUser.email}!`);
      setAuthModalOpen(false);
      setShowWelcome(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In popup was closed or blocked.');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter your email/phone and password.');
      return;
    }
    if (authMode === 'signup' && !authName.trim()) {
      setAuthError('Please enter your full name to create an account.');
      return;
    }
    setAuthError(null);
    const displayName =
      authName.trim() ||
      authEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    setUser({
      id: `usr_${Date.now()}`,
      name: displayName,
      email: authEmail.trim(),
      phone: '0772000111',
      role: 'GATEWAY MEMBER',
      isFirebaseAuthenticated: false,
    });
    setAuthModalOpen(false);
    setShowWelcome(false);
    showToast(`Welcome to Gateway Connect, ${displayName}!`);
  };

  // Welcome Splash Screen inside Mobile App Shell
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[#04060a] flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-[#070a0f] text-slate-50 flex flex-col items-center justify-between px-6 py-10 border-x border-white/10 shadow-2xl">
          <div className="w-full flex flex-col items-center text-center mt-6">
            <div className="w-36 h-36 mb-6 flex items-center justify-center rounded-3xl bg-[#131d31]/60 border border-amber-500/20 p-4 shadow-xl">
              <img
                src={GATEWAY_LOGO_URL}
                alt="Gateway Church Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-[0.22em] text-[#dfa732]">
              GATEWAY
            </h1>
            <div className="flex items-center gap-3 mt-2 mb-5">
              <span className="w-8 h-[1.5px] bg-[#dfa732]/80" />
              <span className="text-sm font-bold tracking-[0.3em] text-[#dfa732]">
                CONNECT
              </span>
              <span className="w-8 h-[1.5px] bg-[#dfa732]/80" />
            </div>
            <p className="text-xs tracking-[0.16em] text-white/75 leading-relaxed uppercase">
              Connecting People
              <br />
              To A Brighter Future
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
              <Database className="w-3.5 h-3.5" />
              <span>Powered by Firebase Cloud Firestore</span>
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleFirebaseLogin}
              className="w-full py-3.5 px-6 rounded-full bg-[#f1be48] hover:bg-[#ffd875] text-[#070a0f] font-extrabold text-xs tracking-widest border-2 border-[#ffd875] shadow-lg shadow-amber-500/25 transition cursor-pointer"
            >
              SIGN IN WITH GOOGLE (FIREBASE) →
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthError(null);
                setAuthModalOpen(true);
              }}
              className="w-full py-3 px-6 rounded-full bg-transparent hover:bg-amber-500/10 text-[#dfa732] font-bold text-xs tracking-widest border border-[#dfa732] transition cursor-pointer"
            >
              MEMBER PHONE / EMAIL SIGN IN
            </button>

            <button
              type="button"
              onClick={() => {
                setShowWelcome(false);
                setActiveTab('home');
              }}
              className="mt-1 py-2 px-4 text-xs text-white/60 hover:text-white underline cursor-pointer"
            >
              Browse as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060a] text-[#f8fafc] flex justify-center">
      {/* Mobile App Viewport Container */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#0b0f19] border-x border-white/10 shadow-2xl flex flex-col relative pb-24">
        {/* Mobile App Header */}
        <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1f6f5c]/30 border border-amber-500/40 flex items-center justify-center overflow-hidden p-1 shrink-0">
                <img
                  src={GATEWAY_LOGO_URL}
                  alt="Gateway Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-[9px] font-extrabold tracking-[0.2em] text-amber-500 uppercase">
                  GATEWAY CHURCH
                </div>
                <div className="text-base font-extrabold tracking-tight text-white leading-tight">
                  GatewayConnect
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                title="Firebase Cloud Firestore Connected"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firebase
              </span>

              <button
                type="button"
                onClick={() => setGiveModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>Give</span>
              </button>
            </div>
          </div>
        </header>

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] rounded-xl bg-[#131d31] border border-amber-500/50 px-3.5 py-2.5 text-xs font-semibold text-amber-300 shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Mobile App Screen Content */}
        <main className="flex-1 px-3.5 py-4 space-y-4">
          {/* ================= HOME TAB ================= */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Live Sanctuary Stream Card */}
              <section className="rounded-2xl bg-[#131d31] border border-white/10 overflow-hidden shadow-lg">
                <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Live Sanctuary
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLiveMuted((m) => !m)}
                      aria-label={liveMuted ? 'Unmute stream audio' : 'Mute stream audio'}
                      className="px-2 py-1 rounded-lg bg-[#0b0f19] border border-white/10 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {liveMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{liveMuted ? 'Muted' : 'Audio On'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLiveLiked((prev) => !prev);
                        setLiveLikes((c) => (liveLiked ? c - 1 : c + 1));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                        liveLiked
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-[#0b0f19] border-white/10 text-slate-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liveLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{liveLikes}</span>
                    </button>
                  </div>
                </div>

                {/* Video Player Banner */}
                <div className="p-4 bg-gradient-to-br from-[#0b0f19] via-[#131d31] to-[#1a253c] space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-amber-400">
                      Apostle Joe Daniels
                    </span>
                    <span className="text-slate-400">1,248 Watching</span>
                  </div>

                  <h2 className="text-base font-extrabold text-white leading-snug">
                    “Divine Remembrance & Supernatural Speed in Your Season”
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Join live from Fantasyland Cinema Sanctuary, Harare for prophetic decrees and worship.
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPlayingSermon(SEED_SERMONS[0])}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Stream</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGiveModalOpen(true)}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      <span>Altar Seed</span>
                    </button>
                  </div>
                </div>

                {/* Live Sanctuary Decree Chat */}
                <div className="p-3.5 bg-[#0e1626] border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                      Live Altar Decrees
                    </h3>
                    <span className="text-[10px] text-slate-400">{liveDecrees.length} decrees</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {liveDecrees.map((msg) => (
                      <div key={msg.id} className="rounded-xl bg-[#131d31] p-2 border border-white/5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-300">{msg.user}</span>
                          <span className="text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePostLiveDecree} className="flex gap-1.5">
                    <label htmlFor="live-decree-input" className="sr-only">
                      Post a live decree
                    </label>
                    <input
                      id="live-decree-input"
                      type="text"
                      maxLength={500}
                      value={decreeInput}
                      onChange={(e) => setDecreeInput(e.target.value)}
                      placeholder="Release your Amen / Decree..."
                      className="flex-1 rounded-xl bg-[#0b0f19] border border-white/15 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      aria-label="Send decree"
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </section>

              {/* Daily Bread Devotional */}
              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                    Daily Bread Devotional
                  </span>
                  <div className="flex gap-1">
                    {SEED_DEVOTIONALS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setActiveDevotionalId(d.id)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          activeDevotionalId === d.id
                            ? 'bg-amber-500 text-[#0b0f19]'
                            : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                        }`}
                      >
                        {d.date}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const dev = SEED_DEVOTIONALS.find((d) => d.id === activeDevotionalId) || SEED_DEVOTIONALS[0];
                  return (
                    <>
                      <h3 className="text-sm font-extrabold text-white">{dev.title}</h3>
                      <div className="text-[11px] font-semibold text-amber-300">
                        {dev.speaker} • {dev.scripture}
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {dev.body}
                      </p>
                    </>
                  );
                })()}
              </section>

              {/* Upcoming Sanctuary Services */}
              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Service Schedule
                  </h3>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-2">
                  {UPCOMING_SERVICES.map((svc) => {
                    const reminded = !!serviceReminders[svc.id];
                    return (
                      <div
                        key={svc.id}
                        className="rounded-xl bg-[#0b0f19] border border-white/10 p-3 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded mb-1">
                            {svc.tag}
                          </span>
                          <h4 className="text-xs font-bold text-white">{svc.title}</h4>
                          <p className="text-[11px] text-slate-400">{svc.time} • {svc.venue}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setServiceReminders((prev) => {
                              const next = !prev[svc.id];
                              showToast(next ? `Reminder set for ${svc.title}` : `Reminder removed for ${svc.title}`);
                              return { ...prev, [svc.id]: next };
                            });
                          }}
                          aria-label={`Toggle reminder for ${svc.title}`}
                          className={`p-2 rounded-lg border cursor-pointer ${
                            reminded
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-[#131d31] border-white/10 text-slate-400'
                          }`}
                        >
                          {reminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Trending Decrees */}
              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white">Trending Sanctuary Decrees</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('community')}
                    className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Prayer Wall</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {trendingDecrees.map((td) => (
                    <div
                      key={td.id}
                      className="rounded-xl bg-[#0b0f19] border border-white/10 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[11px] font-extrabold text-amber-300">
                          {td.avatarText}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{td.author}</div>
                          <div className="text-[10px] text-amber-400 font-semibold">{td.badgeLabel} • {td.time}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{td.text}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTrendingDecrees((prev) =>
                              prev.map((item) =>
                                item.id === td.id
                                  ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
                                  : item
                              )
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                            td.liked ? 'bg-rose-500/20 text-rose-300' : 'bg-[#131d31] text-slate-300'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${td.liked ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{td.likes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTrendingDecrees((prev) =>
                              prev.map((item) =>
                                item.id === td.id ? { ...item, amened: !item.amened } : item
                              )
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            td.amened ? 'bg-amber-500 text-[#0b0f19]' : 'bg-[#131d31] text-amber-300'
                          }`}
                        >
                          {td.amened ? 'Amened ✓' : 'Say Amen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ================= SERMONS TAB ================= */}
          {activeTab === 'sermons' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Apostolic Sermons</h1>
                <p className="text-xs text-slate-400">
                  Messages & masterclasses by Apostle Joe Daniels
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search sermons"
                  value={sermonSearch}
                  onChange={(e) => setSermonSearch(e.target.value)}
                  placeholder="Search messages or series..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131d31] border border-white/10 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {sermonSeriesList.map((series) => (
                  <button
                    key={series}
                    type="button"
                    onClick={() => setSelectedSeries(series)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                      selectedSeries === series
                        ? 'bg-amber-500 text-[#0b0f19]'
                        : 'bg-[#131d31] text-slate-300 border border-white/10'
                    }`}
                  >
                    {series}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredSermons.map((sermon) => {
                  const isSaved = savedSermonIds.includes(sermon.id);
                  return (
                    <article
                      key={sermon.id}
                      className="rounded-2xl bg-[#131d31] border border-white/10 overflow-hidden"
                    >
                      <div className="relative h-40 bg-black">
                        <img
                          src={sermon.thumbnailUrl}
                          alt={sermon.title}
                          className="w-full h-full object-cover opacity-90"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 text-amber-400 text-[10px] font-bold">
                          {sermon.series}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold">
                          {sermon.duration}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-2">
                        <h2 className="text-sm font-extrabold text-white">{sermon.title}</h2>
                        <p className="text-xs text-slate-400 line-clamp-2">{sermon.body}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPlayingSermon(sermon)}
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch Message</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSavedSermonIds((prev) =>
                                prev.includes(sermon.id) ? prev.filter((id) => id !== sermon.id) : [...prev, sermon.id]
                              );
                              showToast(isSaved ? 'Removed from offline library' : 'Saved to offline library');
                            }}
                            aria-label={`Save ${sermon.title}`}
                            className={`p-2 rounded-xl border cursor-pointer ${
                              isSaved
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-[#0b0f19] border-white/10 text-slate-400'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= BIBLE TAB ================= */}
          {activeTab === 'bible' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-extrabold text-white">Holy Bible (KJV)</h1>
                  <p className="text-[11px] text-slate-400">66 Books • Tap verse to highlight or note</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBookPickerOpen((v) => !v)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-[#0b0f19] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {selectedBook} {selectedChapter}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Previous chapter"
                    disabled={selectedChapter <= 1}
                    onClick={() => setSelectedChapter((c) => Math.max(1, c - 1))}
                    className="p-1.5 rounded-xl bg-[#131d31] border border-white/10 text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next chapter"
                    disabled={selectedChapter >= currentBookMeta.chaptersCount}
                    onClick={() =>
                      setSelectedChapter((c) => Math.min(currentBookMeta.chaptersCount, c + 1))
                    }
                    className="p-1.5 rounded-xl bg-[#131d31] border border-white/10 text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {bookPickerOpen && (
                <section className="rounded-2xl bg-[#131d31] border border-amber-500/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {(['ALL', 'OT', 'NT'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTestamentFilter(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            testamentFilter === t
                              ? 'bg-amber-500 text-[#0b0f19]'
                              : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="search"
                      aria-label="Filter Bible books"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Find book..."
                      className="flex-1 px-2.5 py-1 rounded-lg bg-[#0b0f19] border border-white/15 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {filteredBooks.map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => {
                          setSelectedBook(b.name);
                          setSelectedChapter(1);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold truncate cursor-pointer ${
                          selectedBook === b.name
                            ? 'bg-amber-500 text-[#0b0f19] font-extrabold'
                            : 'bg-[#0b0f19] text-slate-300'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Select Chapter ({selectedBook})
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                      {Array.from({ length: currentBookMeta.chaptersCount }, (_, idx) => idx + 1).map(
                        (chapNum) => (
                          <button
                            key={chapNum}
                            type="button"
                            onClick={() => {
                              setSelectedChapter(chapNum);
                              setBookPickerOpen(false);
                            }}
                            className={`w-8 h-7 rounded-lg text-[11px] font-bold cursor-pointer ${
                              selectedChapter === chapNum
                                ? 'bg-amber-500 text-[#0b0f19]'
                                : 'bg-[#0b0f19] text-slate-300'
                            }`}
                          >
                            {chapNum}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <h2 className="text-base font-extrabold text-amber-400">
                    {selectedBook} {selectedChapter}
                  </h2>
                  <span className="text-[11px] text-slate-400">{currentVerses.length} Verses • KJV</span>
                </div>

                <div className="space-y-2">
                  {currentVerses.map((v) => {
                    const ref = `${selectedBook} ${selectedChapter}:${v.verse}`;
                    const hl = highlights[ref];
                    const isBookmarked = bookmarks.includes(ref);
                    const note = verseNotes[ref];
                    return (
                      <div
                        key={v.verse}
                        className={`p-2.5 rounded-xl border transition ${
                          hl
                            ? HIGHLIGHT_CLASSES[hl]
                            : activeVerseRef === ref
                            ? 'bg-white/10 border-amber-500/50'
                            : 'bg-[#0b0f19]/60 border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVerseRef(activeVerseRef === ref ? null : ref);
                              setDraftNote(verseNotes[ref] || '');
                            }}
                            className="text-left flex-1 text-xs text-slate-100 leading-relaxed cursor-pointer"
                          >
                            <span className="font-extrabold text-amber-400 mr-1.5">{v.verse}</span>
                            <span>{v.text}</span>
                          </button>
                          {isBookmarked && (
                            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {note && (
                          <div className="mt-1.5 text-[11px] text-amber-200 bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-amber-500/30">
                            <strong>Note:</strong> {note}
                          </div>
                        )}

                        {activeVerseRef === ref && (
                          <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setBookmarks((prev) =>
                                    prev.includes(ref) ? prev.filter((b) => b !== ref) : [...prev, ref]
                                  );
                                  showToast(isBookmarked ? `Removed bookmark ${ref}` : `Bookmarked ${ref}`);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#0b0f19] border border-white/15 text-[11px] font-semibold text-amber-300 cursor-pointer"
                              >
                                {isBookmarked ? '★ Unbookmark' : '★ Bookmark'}
                              </button>

                              {(['gold', 'emerald', 'blue', 'rose'] as BibleHighlightColor[]).map((col) => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() =>
                                    setHighlights((prev) => ({
                                      ...prev,
                                      [ref]: col,
                                    }))
                                  }
                                  className="px-2 py-1 rounded-lg bg-[#0b0f19] border border-white/15 text-[11px] capitalize text-slate-200 cursor-pointer"
                                >
                                  {col}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                aria-label={`Study note for ${ref}`}
                                value={draftNote}
                                onChange={(e) => setDraftNote(e.target.value)}
                                placeholder="Add study note..."
                                className="flex-1 rounded-lg bg-[#0b0f19] border border-white/15 px-2.5 py-1 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (draftNote.trim()) {
                                    setVerseNotes((prev) => ({ ...prev, [ref]: draftNote.trim() }));
                                    showToast(`Saved note on ${ref}`);
                                  }
                                  setActiveVerseRef(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 text-[#0b0f19] font-bold text-xs cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ================= COMMUNITY & PRAYER TAB ================= */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-white">Covenant Community</h1>
                <p className="text-xs text-slate-400">
                  Firebase Prayer Altar, Fellowship Groups & Events
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'prayer', label: 'Prayer' },
                    { id: 'groups', label: 'Groups' },
                    { id: 'testimonies', label: 'Miracles' },
                    { id: 'events', label: 'Events' },
                  ] as const
                ).map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setCommunitySection(sec.id)}
                    className={`py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      communitySection === sec.id
                        ? 'bg-amber-500 text-[#0b0f19]'
                        : 'bg-[#131d31] text-slate-300 border border-white/10'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {communitySection === 'prayer' && (
                <div className="space-y-4">
                  <form
                    onSubmit={handleSubmitPrayer}
                    className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                        New Prayer Petition
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                        FIRESTORE ALTAR
                      </span>
                    </div>

                    {prayerError && (
                      <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                        {prayerError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="prayer-title" className="block text-xs font-semibold text-slate-300 mb-1">
                        Petition Title
                      </label>
                      <input
                        id="prayer-title"
                        type="text"
                        maxLength={140}
                        value={prayerTitle}
                        onChange={(e) => setPrayerTitle(e.target.value)}
                        placeholder="e.g. Healing, Family, Career..."
                        className="w-full rounded-xl bg-[#0b0f19] border border-white/15 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="prayer-body" className="block text-xs font-semibold text-slate-300 mb-1">
                        Petition Details
                      </label>
                      <textarea
                        id="prayer-body"
                        rows={3}
                        maxLength={1000}
                        value={prayerBody}
                        onChange={(e) => setPrayerBody(e.target.value)}
                        placeholder="Write your prayer request in faith..."
                        className="w-full rounded-xl bg-[#0b0f19] border border-white/15 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs cursor-pointer"
                    >
                      Submit Prayer Request
                    </button>
                  </form>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-white">Active Altar Petitions</h2>
                      <span className="text-xs text-amber-400 font-bold">{prayers.length} petitions</span>
                    </div>

                    {prayers.map((p) => {
                      const hasPrayed = !!prayedIds[p.id];
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl bg-[#131d31] border border-white/10 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold text-amber-300">{p.authorName}</span>
                            <span>{p.createdAt}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-white">{p.title}</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">{p.body}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-[11px] text-slate-400">
                              {p.prayingCount + (hasPrayed ? 1 : 0)} praying
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPrayedIds((prev) => ({
                                  ...prev,
                                  [p.id]: !prev[p.id],
                                }))
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                hasPrayed
                                  ? 'bg-amber-500 text-[#0b0f19]'
                                  : 'bg-[#0b0f19] text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {hasPrayed ? 'Standing in Faith ✓' : 'Pray With Member'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {communitySection === 'groups' && (
                <div className="space-y-3">
                  {SEED_GROUPS.map((g) => {
                    const joined = !!joinedGroups[g.id];
                    return (
                      <div
                        key={g.id}
                        className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-3"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold text-white">{g.name}</h3>
                          <p className="text-xs text-slate-300">{g.description}</p>
                          <div className="text-[11px] text-amber-400 font-medium">{g.location}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setJoinedGroups((prev) => ({ ...prev, [g.id]: !prev[g.id] }));
                            showToast(joined ? `Left ${g.name}` : `Joined ${g.name}!`);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                            joined
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500 text-[#0b0f19]'
                          }`}
                        >
                          {joined ? 'Joined Fellowship ✓' : 'Join Fellowship Group'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {communitySection === 'testimonies' && (
                <div className="space-y-3">
                  {testimonies.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-400">{t.author}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white">{t.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{t.body}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setTestimonies((prev) =>
                            prev.map((item) =>
                              item.id === t.id ? { ...item, likes: item.likes + 1 } : item
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-white/10 text-xs font-bold text-amber-300 cursor-pointer"
                      >
                        Praise Report • {t.likes} Amens
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {communitySection === 'events' && (
                <div className="space-y-3">
                  {SEED_EVENTS.map((ev) => {
                    const isRsvped = !!rsvpEvents[ev.id];
                    return (
                      <div
                        key={ev.id}
                        className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-3"
                      >
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          {ev.category}
                        </span>
                        <h3 className="text-sm font-extrabold text-white">{ev.title}</h3>
                        <p className="text-xs text-slate-300">{ev.description}</p>
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{ev.eventDate} • {ev.eventTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>{ev.location}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpEvents((prev) => ({ ...prev, [ev.id]: !prev[ev.id] }));
                            showToast(isRsvped ? `Cancelled RSVP for ${ev.title}` : `RSVP confirmed for ${ev.title}`);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                            isRsvped
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500 text-[#0b0f19]'
                          }`}
                        >
                          {isRsvped ? 'Attending Sanctuary ✓' : 'Reserve Seat / RSVP'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= STORE & GIVING TAB ================= */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-extrabold text-white">Store & Giving</h1>
                <div className="flex items-center gap-1 bg-[#131d31] p-1 rounded-xl border border-white/10">
                  {(['USD', 'ZiG', 'GBP', 'ZAR'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                        currency === c ? 'bg-amber-500 text-[#0b0f19]' : 'text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#131d31] border border-white/10">
                <button
                  type="button"
                  onClick={() => setStoreSubTab('shop')}
                  className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                    storeSubTab === 'shop'
                      ? 'bg-amber-500 text-[#0b0f19]'
                      : 'text-slate-300'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreSubTab('give')}
                  className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                    storeSubTab === 'give'
                      ? 'bg-amber-500 text-[#0b0f19]'
                      : 'text-slate-300'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Give</span>
                </button>
              </div>

              {storeSubTab === 'shop' ? (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {storeCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-[#0b0f19]'
                            : 'bg-[#131d31] text-slate-300 border border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((prod) => {
                      const imgSrc = STORE_IMAGE_MAP[prod.id] || prod.imageUrl;
                      return (
                        <div
                          key={prod.id}
                          className="rounded-2xl bg-[#131d31] border border-white/10 overflow-hidden flex flex-col justify-between"
                        >
                          <div>
                            <div className="h-36 bg-[#0b0f19] overflow-hidden relative">
                              <img
                                src={imgSrc}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3 space-y-1">
                              <h3 className="text-xs font-extrabold text-white line-clamp-2">{prod.name}</h3>
                              <p className="text-[11px] text-slate-400 line-clamp-2">{prod.description}</p>
                            </div>
                          </div>

                          <div className="p-3 pt-0 flex items-center justify-between gap-1">
                            <span className="text-xs font-extrabold text-amber-400">
                              {formatCurrencyAmount(prod.price, currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setSelectedSize('L');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-[#0b0f19] font-extrabold text-[11px] cursor-pointer"
                            >
                              Order
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <form
                    onSubmit={handleProcessGiving}
                    className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-3"
                  >
                    <h2 className="text-base font-extrabold text-white">Plant Your Covenant Seed</h2>
                    {givingError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                        {givingError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5">
                      {GIVING_FUNDS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setGivingFundId(f.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                            givingFundId === f.id
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-[#0b0f19] border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-extrabold text-amber-400">{f.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[10, 25, 50, 100, 250].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setGivingPresetAmount(amt);
                            setGivingCustomAmount('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                            givingPresetAmount === amt && !givingCustomAmount
                              ? 'bg-amber-500 text-[#0b0f19]'
                              : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                          }`}
                        >
                          {formatCurrencyAmount(amt, currency)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="give-method" className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Method
                        </label>
                        <select
                          id="give-method"
                          value={givingMethod}
                          onChange={(e) => setGivingMethod(e.target.value as any)}
                          className="w-full rounded-xl bg-[#0b0f19] border border-white/15 px-2.5 py-2 text-xs text-white"
                        >
                          <option value="EcoCash">EcoCash</option>
                          <option value="OneMoney">OneMoney</option>
                          <option value="Innbucks">Innbucks</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="give-phone" className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Mobile Number
                        </label>
                        <input
                          id="give-phone"
                          type="tel"
                          value={givingPhone}
                          onChange={(e) => setGivingPhone(e.target.value)}
                          placeholder="0772000111"
                          className="w-full rounded-xl bg-[#0b0f19] border border-white/15 px-2.5 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs cursor-pointer"
                    >
                      Dedicate Seed on the Altar
                    </button>
                  </form>

                  {latestReceipt && (
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/40 p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                          Official Altar Receipt
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-base font-extrabold text-white">{latestReceipt.id}</div>
                      <p className="text-xs text-slate-200">
                        Amount: <strong>{latestReceipt.formattedAmount}</strong> • Fund: <strong>{latestReceipt.fund}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= ME / ACCOUNT TAB (Matches Screenshot 1) ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold text-white">Account</h1>

              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center shrink-0">
                        <User className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                          {user.role}
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">{user.name}</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Your secure Firebase session is active on this device.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!user.isFirebaseAuthenticated && (
                        <button
                          type="button"
                          onClick={handleGoogleFirebaseLogin}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-[#0b0f19] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Link Google Firebase Auth</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await signOutFirebase().catch(() => undefined);
                          setUser(null);
                          showToast('Signed out of Gateway Connect');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Sign in with Firebase Auth to sync your Bible bookmarks, prayer petitions, and giving receipts.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleFirebaseLogin}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-[#0b0f19] font-extrabold text-xs cursor-pointer"
                    >
                      Sign In with Google (Firebase)
                    </button>
                  </div>
                )}
              </section>

              <h2 className="text-lg font-extrabold text-white">Settings</h2>
              <section className="rounded-2xl bg-[#131d31] border border-white/10 p-4 space-y-4">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  DATA & PRIVACY
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-white">Low-Data Mode</div>
                    <p className="text-xs text-slate-400">
                      Saves mobile data by reducing media downloads.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lowDataMode}
                    aria-label="Toggle Low-Data Mode"
                    onClick={() => setLowDataMode((v) => !v)}
                    className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer shrink-0 ${
                      lowDataMode ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        lowDataMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-sm font-extrabold text-white">Analytics</div>
                    <p className="text-xs text-slate-400">
                      Share anonymous usage data to help us improve.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    aria-label="Toggle Analytics"
                    onClick={() => setAnalyticsEnabled((v) => !v)}
                    className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer shrink-0 ${
                      analyticsEnabled ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Bottom Navigation TabBar pinned inside the Mobile App Shell */}
        <nav
          aria-label="Primary Bottom Navigation"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-[#09090c]/95 backdrop-blur border-t border-white/10 px-2 py-1.5"
        >
          <div className="grid grid-cols-7 items-center">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'home' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sermons')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'sermons' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <Video className="w-5 h-5 mb-0.5" />
              <span>Sermons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bible')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'bible' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span>Bible</span>
            </button>

            {/* Center Give FAB */}
            <div className="flex flex-col items-center -mt-5">
              <button
                type="button"
                onClick={() => setGiveModalOpen(true)}
                aria-label="Give or Tithe"
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-[#09090c] flex items-center justify-center shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                <HandCoins className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-bold text-amber-400 mt-0.5">Give</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'community' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Community</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'store' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span>Store</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'profile' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span>{user ? 'Me' : 'Sign In'}</span>
            </button>
          </div>
        </nav>

        {/* Sermon Video Modal */}
        {playingSermon && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Watching ${playingSermon.title}`}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[400px] rounded-2xl bg-[#131d31] border border-white/15 overflow-hidden">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {playingSermon.series}
                  </span>
                  <h2 className="text-xs font-extrabold text-white">{playingSermon.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingSermon(null)}
                  aria-label="Close video player"
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  title={playingSermon.title}
                  src={`https://www.youtube-nocookie.com/embed/${playingSermon.youtubeId}?autoplay=0&rel=0`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-3.5 text-xs text-slate-300">{playingSermon.body}</div>
            </div>
          </div>
        )}

        {/* Store Product Order Modal */}
        {selectedProduct && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${selectedProduct.name}`}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[390px] rounded-2xl bg-[#131d31] border border-white/15 p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-extrabold text-white">{selectedProduct.name}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close product modal"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300">{selectedProduct.description}</p>
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-1.5">Select Size</span>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-9 h-8 rounded-lg text-xs font-extrabold cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-amber-500 text-[#0b0f19]'
                          : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-extrabold text-amber-400">
                  {formatCurrencyAmount(selectedProduct.price, currency)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCartOrders((prev) => [
                      ...prev,
                      {
                        id: `ord_${Date.now()}`,
                        productName: selectedProduct.name,
                        size: selectedSize,
                        priceFormatted: formatCurrencyAmount(selectedProduct.price, currency),
                      },
                    ]);
                    showToast(`Reserved ${selectedProduct.name} (Size ${selectedSize})`);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs cursor-pointer"
                >
                  Reserve Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Give / Tithe Modal */}
        {giveModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Give or Tithe Modal"
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[390px] rounded-2xl bg-[#131d31] border border-white/15 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-white">Give / Tithe</h2>
                  <p className="text-[11px] text-slate-400">Plant your covenant seed on the altar</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGiveModalOpen(false)}
                  aria-label="Close Give modal"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProcessGiving} className="space-y-3">
                <div className="flex gap-1.5">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setGivingPresetAmount(amt);
                        setGivingCustomAmount('');
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                        givingPresetAmount === amt && !givingCustomAmount
                          ? 'bg-amber-500 text-[#0b0f19]'
                          : 'bg-[#0b0f19] text-slate-300 border border-white/10'
                      }`}
                    >
                      {formatCurrencyAmount(amt, currency)}
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="modal-give-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number ({givingMethod})
                  </label>
                  <input
                    id="modal-give-phone"
                    type="tel"
                    value={givingPhone}
                    onChange={(e) => setGivingPhone(e.target.value)}
                    className="w-full rounded-xl bg-[#0b0f19] border border-white/15 px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0b0f19] font-extrabold text-xs cursor-pointer"
                >
                  Confirm Altar Seed ({formatCurrencyAmount(givingPresetAmount, currency)})
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
