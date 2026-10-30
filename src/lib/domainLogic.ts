import { BIBLE_BOOKS, BibleBook } from '../data/bibleData';

export type CurrencyCode = 'USD' | 'ZiG' | 'GBP' | 'ZAR';

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
}

export interface SermonItem {
  id: string;
  title: string;
  body: string;
  speaker: string;
  series: string;
  duration: string;
  youtubeId: string;
  thumbnailUrl: string;
  source?: 'youtube' | 'facebook' | 'uploaded';
  facebookVideoUrl?: string;
  videoUrl?: string;
  fileSizeMb?: number;
  views?: string;
  isPaid?: boolean;
  priceUsd?: number;
}

export interface DevotionalItem {
  id: string;
  title: string;
  body: string;
  speaker: string;
  scripture: string;
  date: string;
}

export interface FellowshipGroup {
  id: string;
  name: string;
  description: string;
  location: string;
  isPaid?: boolean;
}

export interface ChurchEvent {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  category: string;
}

export interface TestimonyPost {
  id: string;
  title: string;
  body: string;
  author: string;
  likes: number;
  category: string;
}

export interface PrayerItem {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  prayingCount: number;
}

export interface GivingFund {
  id: string;
  name: string;
  desc: string;
}

export interface GivingReceipt {
  id: string;
  amount: number;
  formattedAmount: string;
  currency: CurrencyCode;
  fund: string;
  method: string;
  phone: string;
  timestamp: string;
}

export const GIVING_FUNDS: GivingFund[] = [
  { id: 'tithe', name: 'Tithe', desc: 'Ministry operations, broadcast satellites & pastoral sustenance' },
  { id: 'offering', name: 'Sunday Offering', desc: 'Freewill celebration of gratitude' },
  { id: 'firstfruits', name: 'Firstfruits', desc: 'Altar dedication and new territory advancement in 2026' },
  { id: 'partner', name: 'Covenant Partner', desc: 'Monthly apostolic partnership' },
  { id: 'seed_faith', name: 'Seed Faith', desc: 'Harare Evangelistic Crusade & Souls outreach' },
  { id: 'building', name: 'Cathedral Building', desc: 'Roofing and sanctuary construction in Belvedere' },
  { id: 'honorarium', name: 'Apostolic Honorarium', desc: 'Direct apostolic blessing and prophetic mantle honoring' },
];

export const SEED_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod_jd_white_heaven',
    name: 'JD Collection "Make Heaven Crowded" Velvet Print T-Shirt',
    description: 'White Theme: 100% premium soft cotton t-shirt with signature black suede velvet print "MAKE HEAVEN CROWDED" across the chest. Reverse showcases Apostle Joe Daniels silhouette.',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_white_heaven.jpg',
    inStock: true,
  },
  {
    id: 'prod_jd_orange_child',
    name: 'JD Collection "Child of God" Limited Edition T-Shirt',
    description: 'Kingdom Orange Theme: Vibrant high-voltage orange luxury tee with bold black "CHILD OF GOD" chest print incorporating the covenant cross inside the H.',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_orange_child.jpg',
    inStock: true,
  },
  {
    id: 'prod_jd_green_faith',
    name: 'JD Collection "Step In Faith" 2 Corinthians 5:7 T-Shirt',
    description: 'Emerald Green Theme: Rich emerald green unisex apparel with yellow and white "STEP IN FAITH" chest graphic and "2 CORINTHIANS 5:7".',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_green_faith.jpg',
    inStock: true,
  },
  {
    id: 'prod_jd_pink_finished',
    name: 'JD Collection "It Is Finished" John 19:28-30 T-Shirt',
    description: 'Hot Pink Theme: High-energy magenta streetwear release featuring distressed vertical Calvary cross and bold "IT IS FINISHED" lettering with John 19:28-30 reference.',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_pink_finished.jpg',
    inStock: true,
  },
  {
    id: 'prod_jd_cream_butgod',
    name: 'JD Collection "There Was No Way But God" Baggy T-Shirt',
    description: 'Vanilla Cream Theme: Off-white luxury streetwear silhouette with dark royal blue brush script "but God" and prophetic subtitle "There was no way But God made a way."',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_cream_butgod.jpg',
    inStock: true,
  },
  {
    id: 'prod_jd_maroon_construction',
    name: 'JD Collection "Christian Under Construction" T-Shirt',
    description: 'Deep Maroon Theme: Deep burgundy apparel with caution hazard stripe badge reading "I AM A CHRISTIAN UNDER CONSTRUCTION - GOD\'S NOT DONE WITH ME YET!".',
    price: 34.99,
    currency: 'USD',
    category: 'Kingdom Apparel',
    imageUrl: '/assets/store/jd_maroon_construction.jpg',
    inStock: true,
  },
  {
    id: 'prod_book_covenant_wealth',
    name: 'The Mystery of Covenant Wealth',
    description: 'Foundational apostolic handbook unlocking financial dominion, divine favor, and kingdom prosperity principles through covenant fidelity.',
    price: 15.0,
    currency: 'USD',
    category: 'Books & Manuals',
    imageUrl: '/assets/store/jd_white_heaven.jpg',
    inStock: true,
  },
  {
    id: 'prod_book_supernatural_dominion',
    name: 'Supernatural Dominion & Apostolic Authority',
    description: 'Step into unprecedented spiritual authority. A comprehensive guide to walking in kingdom dominion and territorial impact.',
    price: 18.0,
    currency: 'USD',
    category: 'Books & Manuals',
    imageUrl: '/assets/store/jd_green_faith.jpg',
    inStock: true,
  },
];

export const SEED_DEVOTIONALS: DevotionalItem[] = [
  {
    id: 'dev_today',
    title: 'Divine Remembrance: God Has Not Forgotten You',
    body: 'Beloved, when delay seems prolonged, the enemy whispers that heaven is silent. But God says your name is engraved upon His palms. Every prayer you prayed over your family, your health, and your career in Zimbabwe or across the nations is before the altar of incense. Today, step out with high expectation!\n\nScripture: Isaiah 49:15-16\n"See, I have engraved you on the palms of my hands; your walls are continually before me."\n\nPrayer: Heavenly Father, I thank You that You are mindful of me. I rebuke every spirit of discouragement. Your promises over my destiny are YES and AMEN in Christ Jesus.\n\nDeclaration: I declare that this day marks the beginning of unusual favor, open doors, and restored peace in Jesus name!',
    speaker: 'Apostle Joe Daniels',
    scripture: 'Isaiah 49:15-16',
    date: 'Today',
  },
  {
    id: 'dev_yesterday',
    title: 'The Atmosphere of Gratitude',
    body: 'Gratitude is not a reaction to good news; it is the generator of supernatural victory. Praise God in the hallway before the door opens. When Paul and Silas prayed and sang praises at midnight in prison, the foundations shook and every chain was loosed.\n\nScripture: 1 Thessalonians 5:18\n"In everything give thanks; for this is the will of God in Christ Jesus for you."\n\nPrayer: Lord, I choose thanksgiving over anxiety today. Fill my heart with songs of deliverance.\n\nDeclaration: My praise confuses the enemy and unlocks my breakthrough!',
    speaker: 'Apostle Joe Daniels',
    scripture: '1 Thessalonians 5:18',
    date: 'Yesterday',
  },
];

export const SEED_SERMONS: SermonItem[] = [
  {
    id: 'sermon_church_politics',
    title: 'Church & Politics (Controversial Issues)',
    body: 'Apostle Joe Daniels unpacks controversial issues regarding church, state, and kingdom governance with apostolic depth. Believers are called to be salt and light in every sector of society.',
    speaker: 'Apostle Joe Daniels',
    series: 'Apostolic Word',
    duration: '42m',
    youtubeId: '-CibsaxijIk',
    thumbnailUrl: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 48,
    views: '14.2K views',
  },
  {
    id: 'sermon_1',
    title: 'Bring Change From Within',
    body: 'Powerful apostolic message by Apostle Joe Daniels on spiritual authority, internal transformation, and the power of kingdom mind renewal.',
    speaker: 'Apostle Joe Daniels',
    series: 'Apostolic Revelations',
    duration: '35m',
    youtubeId: 'upeY03DKvTo',
    thumbnailUrl: 'https://img.youtube.com/vi/upeY03DKvTo/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 39,
    views: '19.8K views',
  },
  {
    id: 'sermon_fb_live_1',
    title: 'Facebook Live: Midweek Prophetic Altar & Deliverance Service',
    body: 'Full Facebook Live Sanctuary broadcast from Harare with Apostle Joe Daniels. Experience atmospheric worship, prophetic word of knowledge, and instant testimonies.',
    speaker: 'Apostle Joe Daniels',
    series: 'Facebook Live Stream',
    duration: '58m',
    youtubeId: 'Im5BmoPwSHI',
    facebookVideoUrl: 'https://www.facebook.com/facebook/videos/10153231379946729/',
    thumbnailUrl: 'https://img.youtube.com/vi/Im5BmoPwSHI/hqdefault.jpg',
    source: 'facebook',
    fileSizeMb: 64,
    views: '22.4K views',
  },
  {
    id: 'sermon_uploaded_1',
    title: 'Sanctuary Direct Upload: Commanding the Morning & Prophetic Decrees',
    body: 'Uploaded directly from the Gateway Sanctuary media desk for high-speed in-app playback and one-tap offline downloading.',
    speaker: 'Apostle Joe Daniels',
    series: 'Uploaded Sanctuary HD',
    duration: '18m',
    youtubeId: 'iaHCBW8XDGU',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://img.youtube.com/vi/iaHCBW8XDGU/hqdefault.jpg',
    source: 'uploaded',
    fileSizeMb: 24,
    views: '9.6K views',
  },
  {
    id: 'sermon_2',
    title: 'God Changes Your Circle Before He Changes Your Life',
    body: 'Walk with those who carry your future. Divine relationships and covenant circles determine your spiritual altitude and kingdom acceleration.',
    speaker: 'Apostle Joe Daniels',
    series: 'Divine Wisdom',
    duration: '48m',
    youtubeId: 'Im5BmoPwSHI',
    thumbnailUrl: 'https://img.youtube.com/vi/Im5BmoPwSHI/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 54,
    views: '31.1K views',
  },
  {
    id: 'sermon_4',
    title: 'Varume Izvi Ndizvinoda Vakadzi Vedu',
    body: 'Biblical marital wisdom, love, mutual honor, and kingdom foundation for couples and families.',
    speaker: 'Apostle Joe Daniels',
    series: 'Family & Marriage',
    duration: '28m',
    youtubeId: 'iaHCBW8XDGU',
    thumbnailUrl: 'https://img.youtube.com/vi/iaHCBW8XDGU/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 32,
    views: '18.5K views',
  },
  {
    id: 'sermon_5',
    title: 'Mwari Ngaakubvisirewo Nhamo Inokutadzisa',
    body: 'Deliverance decree breaking ancestral hardship, poverty cycles, and spiritual stagnation in the name of Jesus Christ.',
    speaker: 'Apostle Joe Daniels',
    series: 'Deliverance & Freedom',
    duration: '52m',
    youtubeId: '6STJ8Hv4RE8',
    thumbnailUrl: 'https://img.youtube.com/vi/6STJ8Hv4RE8/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 59,
    views: '27.3K views',
  },
  {
    id: 'sermon_masterclass_1',
    title: 'Apostolic Masterclass: The Mystery of Kingdom Wealth & Acceleration',
    body: 'Advanced kingdom financial dominion, altar covenants, and supernatural acceleration for ministers and marketplace leaders.',
    speaker: 'Apostle Joe Daniels',
    series: 'Apostolic Masterclass',
    duration: '1h 15m',
    youtubeId: '-CibsaxijIk',
    thumbnailUrl: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
    source: 'youtube',
    fileSizeMb: 85,
    views: '11.9K views',
    isPaid: true,
    priceUsd: 30,
  },
];

export const SEED_GROUPS: FellowshipGroup[] = [
  {
    id: 'group_ignite_worship',
    name: 'Ignite Worship Team',
    description: 'About worship and awakening the consciousness of God. Connects people together in atmospheric praise.',
    location: 'Sanctuary & Online (Fridays @ 6:00 PM CAT)',
  },
  {
    id: 'group_pride_of_lions',
    name: 'Pride Of Lions (Men of Valor)',
    description: "Men's Worship team & ministry where men are groomed and trained in the way of God to be godly husbands, fathers, and leaders.",
    location: 'Belvedere Hub & Virtual (Saturdays @ 7:00 AM CAT)',
  },
  {
    id: 'group_passion_ladies',
    name: 'Passion Ladies Ministry',
    description: 'Women of prayer, prophetic empowerment, family building, and virtuous grace led by Prophetess Melinda Daniels.',
    location: 'Gateway Center & Virtual',
  },
  {
    id: 'group_gymstars_foundation',
    name: 'Gymstars Foundation',
    description: 'Foundation for youth and juniors where we groom and teach the youth to find God at an early age, build character, and excel.',
    location: 'Youth Arena & Harare West (Saturdays @ 2:00 PM CAT)',
  },
  {
    id: 'group_foundation_school',
    name: 'Foundation School (Paid Covenant Pass)',
    description: 'Enroll to learn about Christ, discipleship, spiritual foundation, and how to mature in the Kingdom. ($150 / 3 Months)',
    location: 'Apostolic Academy & Online Portal',
    isPaid: true,
  },
];

export const SEED_EVENTS: ChurchEvent[] = [
  {
    id: 'evt_sunday',
    title: 'Sunday Glorious Service',
    eventDate: 'Every Sunday',
    eventTime: '08:00 - 13:00 CAT',
    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
    description: 'Atmospheric praise, explosive apostolic revelations, prophetic ministry, and communion with Apostle Joe Daniels.',
    category: 'Sunday Service',
  },
  {
    id: 'evt_wednesday',
    title: 'Wednesday Midweek Dominion Service',
    eventDate: 'Every Wednesday',
    eventTime: '17:00 - 20:00 CAT',
    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
    description: 'Deep scriptural study, targeted intercessory warfare, prophetic alignment, and spiritual deliverance.',
    category: 'Wednesday Service',
  },
  {
    id: 'evt_seminar',
    title: 'Pastors and Leaders Apostolic Seminar',
    eventDate: 'Upcoming Saturday',
    eventTime: '13:00 - 17:00 CAT',
    location: 'Chitungwiza Center',
    description: 'Apostolic impartation, church leadership governance, ministerial ethics, and pastoral acceleration with Apostle Joe Daniels.',
    category: 'Seminar',
  },
];

export const SEED_TESTIMONIES: TestimonyPost[] = [
  {
    id: 'test_1',
    title: 'Miraculous Healing from Tumor',
    body: 'Praise the Lord saints! After Apostle Joe Daniels laid hands and decreed healing during Sunday service, the doctors in Bulawayo ran confirmatory tests before surgery and the tumor was completely gone! Jesus is alive!',
    author: 'Sister Chiedza M.',
    likes: 24,
    category: 'Healing',
  },
  {
    id: 'test_2',
    title: 'Supernatural Debt Cancellation & Job Breakthrough',
    body: 'I stood on the altar word of covenant wealth and within 2 weeks received an international employment offer with double my expected salary! Give glory to God!',
    author: 'Brother Tinashe C.',
    likes: 19,
    category: 'Financial Miracle',
  },
];

export const SEED_PRAYERS: PrayerItem[] = [
  {
    id: 'pray_1',
    userId: 'usr_1',
    authorName: 'Sister Rutendo (Harare)',
    title: 'Family Restoration & Peace',
    body: 'Standing in agreement for complete restoration of peace, unity, and divine protection over our household this season.',
    createdAt: '2 hours ago',
    prayingCount: 18,
  },
  {
    id: 'pray_2',
    userId: 'usr_2',
    authorName: 'Brother Kudzai (Diaspora)',
    title: 'Supernatural Business Open Doors',
    body: 'Praying for apostolic favor and wisdom as we sign new regional logistics contracts this month.',
    createdAt: '5 hours ago',
    prayingCount: 14,
  },
];

export function formatCurrencyAmount(usdAmount: number, currency: CurrencyCode): string {
  if (currency === 'ZiG') {
    return `ZiG ${Math.round(usdAmount * 14.8)}`;
  }
  if (currency === 'GBP') {
    return `£${Math.round(usdAmount * 0.78)}`;
  }
  if (currency === 'ZAR') {
    return `R${Math.round(usdAmount * 18.5)}`;
  }
  return `$${usdAmount.toFixed(2)}`;
}

export function filterSermons(
  sermons: SermonItem[],
  series: string,
  searchQuery: string
): SermonItem[] {
  const q = searchQuery.trim().toLowerCase();
  return sermons.filter((s) => {
    const matchesSeries = series === 'All' || s.series === series;
    const matchesQuery =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q) ||
      s.speaker.toLowerCase().includes(q) ||
      s.series.toLowerCase().includes(q);
    return matchesSeries && matchesQuery;
  });
}

export function filterBibleBooks(
  testament: 'ALL' | 'OT' | 'NT',
  searchQuery: string,
  books: BibleBook[] = BIBLE_BOOKS
): BibleBook[] {
  const q = searchQuery.trim().toLowerCase();
  return books.filter((b) => {
    if (testament === 'OT' && b.testament !== 'OT') return false;
    if (testament === 'NT' && b.testament !== 'NT') return false;
    if (q && !b.name.toLowerCase().includes(q) && !b.abbreviation.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

export function validateGivingInput(
  amount: number,
  method: string,
  phone: string
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Please enter a valid offering amount greater than zero.';
  }
  if ((method === 'EcoCash' || method === 'OneMoney' || method === 'Innbucks') && !phone.trim()) {
    return `Please enter your ${method} mobile number.`;
  }
  return null;
}

export function createGivingReceipt(params: {
  amount: number;
  currency: CurrencyCode;
  fundId: string;
  method: string;
  phone: string;
  nowMs?: number;
}): GivingReceipt {
  const suffix = String(params.nowMs ?? Date.now()).slice(-6);
  const fundObj = GIVING_FUNDS.find((f) => f.id === params.fundId);
  const fundName = fundObj ? fundObj.name : params.fundId;
  return {
    id: `GCZ-GIVE-${suffix}`,
    amount: params.amount,
    formattedAmount: formatCurrencyAmount(params.amount, params.currency),
    currency: params.currency,
    fund: fundName,
    method: params.method,
    phone: params.phone.trim() || 'Card Ending 4242',
    timestamp: new Date(params.nowMs ?? Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export interface MemberProfile {
  id: string;
  name: string;
  handle: string;
  role: string;
  verified: boolean;
  avatarColor: string;
  initials: string;
  bio: string;
  location: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  verified: boolean;
  avatarColor: string;
  initials: string;
  caption: string;
  imageKey: string;
  timestamp: string;
  viewed?: boolean;
  likes?: number;
}

export interface SocialComment {
  id: string;
  authorName: string;
  authorHandle: string;
  text: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorRole: string;
  verified: boolean;
  avatarColor: string;
  initials: string;
  body: string;
  imageKey?: string;
  customImageUrl?: string;
  scriptureTag?: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  reposts: number;
  reposted?: boolean;
  bookmarked?: boolean;
  comments: SocialComment[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status: 'sent' | 'delivered' | 'read';
  imageKey?: string;
  reaction?: string;
}

export interface ChatThread {
  id: string;
  name: string;
  handle: string;
  type: 'direct' | 'group';
  avatarColor: string;
  initials: string;
  verified?: boolean;
  online?: boolean;
  membersCount?: number;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}

export interface MinistryPage {
  id: string;
  name: string;
  handle: string;
  category: string;
  description: string;
  followersCount: number;
  verified: boolean;
  avatarColor: string;
  initials: string;
  bannerKey: string;
}

export interface PrayerAlertNotification {
  id: string;
  prayerId: string;
  prayerTitle: string;
  authorName: string;
  newPrayingCount: number;
  delta: number;
  timestamp: string;
  read: boolean;
}

export const SEED_PROFILES: MemberProfile[] = [
  {
    id: 'usr_apostle_joe',
    name: 'Apostle Joe Daniels',
    handle: '@apostlejoedaniels',
    role: 'Senior Visionary',
    verified: true,
    avatarColor: '#0095f6',
    initials: 'JD',
    bio: 'Visionary Leader of Gateway Sanctuary International 🌍 | Raising Kingdom Giants | Make Heaven Crowded ✨🙏',
    location: 'Harare, Zimbabwe',
    followersCount: 48200,
    followingCount: 124,
    postsCount: 342,
  },
  {
    id: 'usr_melinda',
    name: 'Prophetess Melinda Daniels',
    handle: '@melindadaniels',
    role: 'Passion Ladies Lead',
    verified: true,
    avatarColor: '#ec4899',
    initials: 'MD',
    bio: 'Leading Passion Ladies Ministry 🌸 | Intercessor, Mother & Prophetic Voice | Proverbs 31 Woman ✨',
    location: 'Harare, Zimbabwe',
    followersCount: 29400,
    followingCount: 185,
    postsCount: 218,
  },
  {
    id: 'usr_ignite',
    name: 'Ignite Worship Team',
    handle: '@igniteworshipzw',
    role: 'Official Worship',
    verified: true,
    avatarColor: '#6366f1',
    initials: 'IW',
    bio: 'Atmospheric praise & prophetic worship from Gateway Sanctuary 🎶🔥 New live sessions every Sunday!',
    location: 'Belvedere Sanctuary',
    followersCount: 15800,
    followingCount: 64,
    postsCount: 129,
  },
  {
    id: 'usr_chiedza',
    name: 'Sister Chiedza M.',
    handle: '@chiedza_grace',
    role: 'Covenant Partner',
    verified: false,
    avatarColor: '#10b981',
    initials: 'CM',
    bio: 'Living testimony of Jesus’ healing power 🙌 | Passion Ladies & Sanctuary Choir member 💙',
    location: 'Bulawayo / Harare',
    followersCount: 1420,
    followingCount: 390,
    postsCount: 47,
  },
  {
    id: 'usr_tinashe',
    name: 'Brother Tinashe C.',
    handle: '@tinashe_kingdom',
    role: 'Pride of Lions',
    verified: false,
    avatarColor: '#0284c7',
    initials: 'TC',
    bio: 'Marketplace believer & Pride of Lions coordinator 🦁 | Step in Faith (2 Cor 5:7) 📈',
    location: 'Harare, Zimbabwe',
    followersCount: 980,
    followingCount: 310,
    postsCount: 31,
  },
];

export const SEED_STORIES: StoryItem[] = [
  {
    id: 'story_1',
    authorId: 'usr_apostle_joe',
    authorName: 'Apostle Joe',
    authorHandle: '@apostlejoedaniels',
    verified: true,
    avatarColor: '#0095f6',
    initials: 'JD',
    caption: '🔥 This week every closed door before your family is opening by fire! Walk in dominion! 🙌✨',
    imageKey: 'apostlePreaching',
    timestamp: '18m ago',
    likes: 412,
  },
  {
    id: 'story_2',
    authorId: 'usr_melinda',
    authorName: 'Prophetess Melinda',
    authorHandle: '@melindadaniels',
    verified: true,
    avatarColor: '#ec4899',
    initials: 'MD',
    caption: '🌸 Passion Ladies Prayer Altar was electric tonight! Thank You Jesus for restored homes 💙🙏',
    imageKey: 'altarCall',
    timestamp: '1h ago',
    likes: 289,
  },
  {
    id: 'story_3',
    authorId: 'usr_ignite',
    authorName: 'Ignite Worship',
    authorHandle: '@igniteworshipzw',
    verified: true,
    avatarColor: '#6366f1',
    initials: 'IW',
    caption: '🎶 Soundcheck & rehearsal for Sunday Glorious Service! Heaven is touching Harare! 🔥🎤',
    imageKey: 'choirPraise',
    timestamp: '2h ago',
    likes: 194,
  },
  {
    id: 'story_4',
    authorId: 'usr_tinashe',
    authorName: 'Bro Tinashe',
    authorHandle: '@tinashe_kingdom',
    verified: false,
    avatarColor: '#0284c7',
    initials: 'TC',
    caption: '🦁 Pride of Lions Saturday morning fellowship! Iron sharpens iron 💪🔥',
    imageKey: 'fellowshipGathering',
    timestamp: '4h ago',
    likes: 87,
  },
];

export const SEED_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    authorId: 'usr_apostle_joe',
    authorName: 'Apostle Joe Daniels',
    authorHandle: '@apostlejoedaniels',
    authorRole: 'Senior Visionary',
    verified: true,
    avatarColor: '#0095f6',
    initials: 'JD',
    body: 'God changes your circle before He changes your life! 🌍✨ When heaven is ready to shift you into a new season of favor, He aligns you with voices that speak to your destiny. Drop an "AMEN 🔥" if you are ready for divine acceleration this week!',
    imageKey: 'apostlePreaching',
    scriptureTag: 'Isaiah 49:15-16',
    timestamp: '25m',
    likes: 642,
    liked: false,
    reposts: 148,
    reposted: false,
    comments: [
      {
        id: 'c_1',
        authorName: 'Sister Chiedza M.',
        authorHandle: '@chiedza_grace',
        text: 'AMEN 🔥🙌 Receiving this prophetic word for my household!',
        timestamp: '19m',
      },
      {
        id: 'c_2',
        authorName: 'Brother Tinashe C.',
        authorHandle: '@tinashe_kingdom',
        text: 'Powerful word Papa! Divine alignment is our portion 💙✨',
        timestamp: '12m',
      },
    ],
  },
  {
    id: 'post_2',
    authorId: 'usr_ignite',
    authorName: 'Ignite Worship Team',
    authorHandle: '@igniteworshipzw',
    authorRole: 'Official Worship',
    verified: true,
    avatarColor: '#6366f1',
    initials: 'IW',
    body: 'Nothing compares to the presence of God in the sanctuary! 🎶🙌 When praises go up, chains fall down. Which worship anthem has been carrying your spirit this week? 👇💙',
    imageKey: 'sanctuaryWorship',
    scriptureTag: 'Psalm 150:6',
    timestamp: '2h',
    likes: 318,
    liked: true,
    reposts: 76,
    reposted: false,
    comments: [
      {
        id: 'c_3',
        authorName: 'Prophetess Melinda Daniels',
        authorHandle: '@melindadaniels',
        text: 'The atmosphere on Sunday was truly heaven on earth! 🔥🎶',
        timestamp: '1h',
      },
    ],
  },
  {
    id: 'post_3',
    authorId: 'usr_chiedza',
    authorName: 'Sister Chiedza M.',
    authorHandle: '@chiedza_grace',
    authorRole: 'Covenant Partner',
    verified: false,
    avatarColor: '#10b981',
    initials: 'CM',
    body: 'TESTIMONY TIME 😭🙌 After prayer at the Sunday Glorious Service, the doctors in Bulawayo ran confirmatory scans and the tumor is COMPLETELY GONE! Never stop trusting Jesus! 💙🙏✨',
    imageKey: 'sundayGlory',
    scriptureTag: 'Jeremiah 30:17',
    timestamp: '4h',
    likes: 512,
    liked: false,
    reposts: 119,
    reposted: false,
    comments: [],
  },
];

export const SEED_CHAT_THREADS: ChatThread[] = [
  {
    id: 'chat_sanctuary_lounge',
    name: 'Gateway Global Family 🌍',
    handle: '1,420 members online',
    type: 'group',
    avatarColor: '#0095f6',
    initials: 'GG',
    verified: true,
    online: true,
    membersCount: 4850,
    unreadCount: 3,
    lastMessage: 'Apostle Joe: See you all at Wednesday Dominion Service! 🔥',
    lastTimestamp: '10:42 AM',
    messages: [
      {
        id: 'm_1',
        senderId: 'usr_melinda',
        senderName: 'Prophetess Melinda 🌸',
        text: 'Good morning Gateway family! May peace and unusual favor follow you today 💙✨',
        timestamp: '10:15 AM',
        isMe: false,
        status: 'read',
      },
      {
        id: 'm_2',
        senderId: 'usr_tinashe',
        senderName: 'Brother Tinashe 🦁',
        text: 'Amen! Standing in agreement from Harare CBD 🙌🔥',
        timestamp: '10:28 AM',
        isMe: false,
        status: 'delivered',
      },
      {
        id: 'm_3',
        senderId: 'usr_apostle_joe',
        senderName: 'Apostle Joe Daniels',
        text: 'See you all at Wednesday Dominion Service! Come expectant for miracles 🔥🙏',
        timestamp: '10:42 AM',
        isMe: false,
        status: 'sent',
      },
    ],
  },
  {
    id: 'chat_pastoral_care',
    name: 'Pastoral Prayer & Care 🙏',
    handle: 'Direct Ministry Line',
    type: 'direct',
    avatarColor: '#0284c7',
    initials: 'PC',
    verified: true,
    online: true,
    unreadCount: 1,
    lastMessage: 'We are standing in prayer with your household today 💙',
    lastTimestamp: '09:30 AM',
    messages: [
      {
        id: 'm_4',
        senderId: 'usr_pastoral',
        senderName: 'Pastoral Care Desk',
        text: 'Shalom beloved! How can our intercessory team pray with you this week? 🙏💙',
        timestamp: '09:15 AM',
        isMe: false,
        status: 'read',
      },
      {
        id: 'm_5',
        senderId: 'usr_me',
        senderName: 'You',
        text: 'Thank you so much! Praying for wisdom and peace over our family.',
        timestamp: '09:24 AM',
        isMe: true,
        status: 'read',
      },
      {
        id: 'm_6',
        senderId: 'usr_pastoral',
        senderName: 'Pastoral Care Desk',
        text: 'We are standing in prayer with your household today 💙 Isaiah 54:17 is your portion!',
        timestamp: '09:30 AM',
        isMe: false,
        status: 'delivered',
      },
    ],
  },
  {
    id: 'chat_ignite_team',
    name: 'Ignite Worship Hub 🎶',
    handle: 'Choir & Instrumentalists',
    type: 'group',
    avatarColor: '#6366f1',
    initials: 'IW',
    verified: true,
    online: true,
    membersCount: 142,
    unreadCount: 0,
    lastMessage: 'Setlist for Sunday Glorious Service is uploaded 🎤✨',
    lastTimestamp: 'Yesterday',
    messages: [
      {
        id: 'm_7',
        senderId: 'usr_ignite',
        senderName: 'Ignite Worship Lead',
        text: 'Setlist for Sunday Glorious Service is uploaded 🎤✨ Rehearsal starts Friday 6 PM sharp!',
        timestamp: 'Yesterday',
        isMe: false,
        status: 'read',
      },
    ],
  },
  {
    id: 'chat_sister_chiedza',
    name: 'Sister Chiedza M.',
    handle: '@chiedza_grace',
    type: 'direct',
    avatarColor: '#10b981',
    initials: 'CM',
    verified: false,
    online: true,
    unreadCount: 0,
    lastMessage: 'Glory to Jesus! Your testimony blessed the whole church 🙌',
    lastTimestamp: 'Yesterday',
    messages: [
      {
        id: 'm_8',
        senderId: 'usr_chiedza',
        senderName: 'Sister Chiedza M.',
        text: 'Hallelujah! Thank you for standing in prayer with me during Sunday service 💙🙏',
        timestamp: 'Yesterday',
        isMe: false,
        status: 'read',
      },
      {
        id: 'm_9',
        senderId: 'usr_me',
        senderName: 'You',
        text: 'Glory to Jesus! Your testimony blessed the whole church 🙌',
        timestamp: 'Yesterday',
        isMe: true,
        status: 'read',
      },
    ],
  },
];

export const SEED_MINISTRY_PAGES: MinistryPage[] = [
  {
    id: 'page_apostle_jd',
    name: 'Apostle Joe Daniels Ministries',
    handle: '@apostlejoedaniels',
    category: 'Apostolic & Prophetic Global Broadcast',
    description: 'Official ministry page for global crusades, daily prophetic decrees, and apostolic teachings.',
    followersCount: 48200,
    verified: true,
    avatarColor: '#0095f6',
    initials: 'JD',
    bannerKey: 'apostlePreaching',
  },
  {
    id: 'page_gateway_media',
    name: 'Gateway Sanctuary Media',
    handle: '@gatewayconnectzw',
    category: 'Live Broadcast & Reels',
    description: 'High-definition service highlights, Sunday Glorious Service streams, and miracle testimonies.',
    followersCount: 31500,
    verified: true,
    avatarColor: '#0284c7',
    initials: 'GM',
    bannerKey: 'sanctuaryWorship',
  },
  {
    id: 'page_jd_collection',
    name: 'JD Kingdom Apparel & Store',
    handle: '@jdcollection_official',
    category: 'Kingdom Streetwear & Books',
    description: 'Wear your faith boldly. Official Make Heaven Crowded & Step In Faith apparel releases.',
    followersCount: 19400,
    verified: true,
    avatarColor: '#3b82f6',
    initials: 'JC',
    bannerKey: 'youthIgnition',
  },
];

/**
 * Pure helper that compares previous prayer counts with updated prayer items from Firestore
 * and returns any petitions whose `prayingCount` increased so the UI can alert the user.
 */
export function detectPrayerCountIncreases(
  previousCounts: Record<string, number>,
  currentPrayers: PrayerItem[]
): Array<{ prayer: PrayerItem; delta: number }> {
  const increases: Array<{ prayer: PrayerItem; delta: number }> = [];
  for (const prayer of currentPrayers) {
    const prev = previousCounts[prayer.id];
    if (typeof prev === 'number' && prayer.prayingCount > prev) {
      increases.push({
        prayer,
        delta: prayer.prayingCount - prev,
      });
    }
  }
  return increases;
}

/**
 * Pure helper that updates all messages in the opened chat thread to status 'read'
 * and clears unreadCount to 0 to implement read receipts when a user opens a thread.
 */
export function markThreadMessagesAsRead(
  threads: ChatThread[],
  threadId: string
): ChatThread[] {
  return threads.map((thread) => {
    if (thread.id !== threadId) return thread;
    return {
      ...thread,
      unreadCount: 0,
      messages: thread.messages.map((msg) =>
        msg.status === 'read' ? msg : { ...msg, status: 'read' as const }
      ),
    };
  });
}

/**
 * Pure helper to resolve the persisted theme preference from localStorage.
 */
export function resolveStoredTheme(storedValue: string | null | undefined): 'dark' | 'light' {
  return storedValue === 'light' ? 'light' : 'dark';
}

export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'cancelled';

export interface SermonDownloadTask {
  sermonId: string;
  sermon: SermonItem;
  status: DownloadStatus;
  progress: number; // 0 to 100
  downloadedMb: number;
  totalMb: number;
  speedMbps: string;
  updatedAt: number;
}

export const SEED_DOWNLOAD_TASKS: SermonDownloadTask[] = [
  {
    sermonId: 'sermon_uploaded_1',
    sermon: SEED_SERMONS.find((s) => s.id === 'sermon_uploaded_1') || SEED_SERMONS[0],
    status: 'completed',
    progress: 100,
    downloadedMb: 38,
    totalMb: 38,
    speedMbps: 'Completed',
    updatedAt: 1711800000000,
  },
  {
    sermonId: 'sermon_2',
    sermon: SEED_SERMONS.find((s) => s.id === 'sermon_2') || SEED_SERMONS[1],
    status: 'paused',
    progress: 45,
    downloadedMb: 23.4,
    totalMb: 52,
    speedMbps: 'Paused',
    updatedAt: 1711800050000,
  },
];

/**
 * Starts a new sermon download task or resumes an existing paused/cancelled task.
 */
export function startOrResumeDownloadTask(
  tasks: SermonDownloadTask[],
  sermon: SermonItem,
  nowMs = Date.now()
): SermonDownloadTask[] {
  const totalMb = sermon.fileSizeMb || 48;
  const existing = tasks.find((t) => t.sermonId === sermon.id);
  if (existing) {
    const nextProgress =
      existing.status === 'completed'
        ? 100
        : existing.progress <= 0 || existing.status === 'cancelled'
        ? 12
        : existing.progress;
    return tasks.map((t) =>
      t.sermonId === sermon.id
        ? {
            ...t,
            status: nextProgress >= 100 ? 'completed' : 'downloading',
            progress: nextProgress,
            downloadedMb: Number(((totalMb * nextProgress) / 100).toFixed(1)),
            speedMbps: nextProgress >= 100 ? 'Completed' : '4.8 MB/s',
            updatedAt: nowMs,
          }
        : t
    );
  }

  const initialProgress = 12;
  const created: SermonDownloadTask = {
    sermonId: sermon.id,
    sermon: {
      ...sermon,
      videoUrl:
        sermon.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    status: 'downloading',
    progress: initialProgress,
    downloadedMb: Number(((totalMb * initialProgress) / 100).toFixed(1)),
    totalMb,
    speedMbps: '4.8 MB/s',
    updatedAt: nowMs,
  };
  return [created, ...tasks];
}

/**
 * Pauses an active sermon download task, preserving its current progress.
 */
export function pauseDownloadTask(
  tasks: SermonDownloadTask[],
  sermonId: string,
  nowMs = Date.now()
): SermonDownloadTask[] {
  return tasks.map((t) =>
    t.sermonId === sermonId && t.status === 'downloading'
      ? {
          ...t,
          status: 'paused',
          speedMbps: 'Paused',
          updatedAt: nowMs,
        }
      : t
  );
}

/**
 * Resumes a paused sermon download task from its saved progress percentage.
 */
export function resumeDownloadTask(
  tasks: SermonDownloadTask[],
  sermonId: string,
  nowMs = Date.now()
): SermonDownloadTask[] {
  return tasks.map((t) =>
    t.sermonId === sermonId && (t.status === 'paused' || t.status === 'cancelled')
      ? {
          ...t,
          status: 'downloading',
          progress: Math.max(t.progress, 10),
          speedMbps: '5.2 MB/s',
          updatedAt: nowMs,
        }
      : t
  );
}

/**
 * Cancels and removes an active or paused download task from the download queue.
 */
export function cancelDownloadTask(
  tasks: SermonDownloadTask[],
  sermonId: string
): SermonDownloadTask[] {
  return tasks.filter((t) => t.sermonId !== sermonId);
}

/**
 * Advances all active ('downloading') tasks by `stepPercent` and returns updated tasks
 * along with any sermons that just reached 100% completion.
 */
export function advanceActiveDownloadTasks(
  tasks: SermonDownloadTask[],
  stepPercent = 18,
  nowMs = Date.now()
): { tasks: SermonDownloadTask[]; newlyCompleted: SermonItem[] } {
  const newlyCompleted: SermonItem[] = [];
  const nextTasks = tasks.map((t) => {
    if (t.status !== 'downloading') return t;
    const nextProgress = Math.min(100, t.progress + stepPercent);
    const isDone = nextProgress >= 100;
    if (isDone) {
      newlyCompleted.push(t.sermon);
    }
    return {
      ...t,
      status: isDone ? ('completed' as const) : ('downloading' as const),
      progress: nextProgress,
      downloadedMb: isDone
        ? t.totalMb
        : Number(((t.totalMb * nextProgress) / 100).toFixed(1)),
      speedMbps: isDone ? 'Completed' : '5.1 MB/s',
      updatedAt: nowMs,
    };
  });
  return { tasks: nextTasks, newlyCompleted };
}

export interface VerseCardTheme {
  id: string;
  label: string;
  gradientStops: [string, string, string];
  accentColor: string;
  textColor: string;
  subTextColor: string;
}

export const VERSE_CARD_THEMES: VerseCardTheme[] = [
  {
    id: 'royal_blue',
    label: '💙 Sanctuary Blue',
    gradientStops: ['#051329', '#004e92', '#0095f6'],
    accentColor: '#38bdf8',
    textColor: '#ffffff',
    subTextColor: '#e0f2fe',
  },
  {
    id: 'covenant_gold',
    label: '✨ Covenant Gold',
    gradientStops: ['#1c1408', '#5c3a09', '#b45309'],
    accentColor: '#fbbf24',
    textColor: '#ffffff',
    subTextColor: '#fef3c7',
  },
  {
    id: 'emerald_glory',
    label: '🌿 Emerald Glory',
    gradientStops: ['#041f1a', '#065f46', '#059669'],
    accentColor: '#34d399',
    textColor: '#ffffff',
    subTextColor: '#d1fae5',
  },
  {
    id: 'crimson_altar',
    label: '🔥 Altar Fire',
    gradientStops: ['#280714', '#7f1d1d', '#be123c'],
    accentColor: '#fda4af',
    textColor: '#ffffff',
    subTextColor: '#ffe4e6',
  },
  {
    id: 'midnight_zion',
    label: '🌌 Midnight Zion',
    gradientStops: ['#090d16', '#1e1b4b', '#312e81'],
    accentColor: '#818cf8',
    textColor: '#ffffff',
    subTextColor: '#e0e7ff',
  },
];

/**
 * Pure helper that wraps a scripture verse into balanced lines for canvas image rendering.
 */
export function wrapVerseTextIntoLines(text: string, maxCharsPerLine = 34): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}



