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
