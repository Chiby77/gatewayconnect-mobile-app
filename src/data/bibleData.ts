import bundledKjvPack from '../../bible-packs/generated/eng_kjv.json';

export interface BibleBook {
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  chaptersCount: number;
  category: 'Law' | 'History' | 'Poetry' | 'Prophets' | 'Gospels' | 'Epistles' | 'Prophecy';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament (39 Books)
  { name: 'Genesis', abbreviation: 'Gen', testament: 'OT', chaptersCount: 50, category: 'Law' },
  { name: 'Exodus', abbreviation: 'Exo', testament: 'OT', chaptersCount: 40, category: 'Law' },
  { name: 'Leviticus', abbreviation: 'Lev', testament: 'OT', chaptersCount: 27, category: 'Law' },
  { name: 'Numbers', abbreviation: 'Num', testament: 'OT', chaptersCount: 36, category: 'Law' },
  { name: 'Deuteronomy', abbreviation: 'Deu', testament: 'OT', chaptersCount: 34, category: 'Law' },
  { name: 'Joshua', abbreviation: 'Jos', testament: 'OT', chaptersCount: 24, category: 'History' },
  { name: 'Judges', abbreviation: 'Jdg', testament: 'OT', chaptersCount: 21, category: 'History' },
  { name: 'Ruth', abbreviation: 'Rut', testament: 'OT', chaptersCount: 4, category: 'History' },
  { name: '1 Samuel', abbreviation: '1Sa', testament: 'OT', chaptersCount: 31, category: 'History' },
  { name: '2 Samuel', abbreviation: '2Sa', testament: 'OT', chaptersCount: 24, category: 'History' },
  { name: '1 Kings', abbreviation: '1Ki', testament: 'OT', chaptersCount: 22, category: 'History' },
  { name: '2 Kings', abbreviation: '2Ki', testament: 'OT', chaptersCount: 25, category: 'History' },
  { name: '1 Chronicles', abbreviation: '1Ch', testament: 'OT', chaptersCount: 29, category: 'History' },
  { name: '2 Chronicles', abbreviation: '2Ch', testament: 'OT', chaptersCount: 36, category: 'History' },
  { name: 'Ezra', abbreviation: 'Ezr', testament: 'OT', chaptersCount: 10, category: 'History' },
  { name: 'Nehemiah', abbreviation: 'Neh', testament: 'OT', chaptersCount: 13, category: 'History' },
  { name: 'Esther', abbreviation: 'Est', testament: 'OT', chaptersCount: 10, category: 'History' },
  { name: 'Job', abbreviation: 'Job', testament: 'OT', chaptersCount: 42, category: 'Poetry' },
  { name: 'Psalms', abbreviation: 'Psa', testament: 'OT', chaptersCount: 150, category: 'Poetry' },
  { name: 'Proverbs', abbreviation: 'Pro', testament: 'OT', chaptersCount: 31, category: 'Poetry' },
  { name: 'Ecclesiastes', abbreviation: 'Ecc', testament: 'OT', chaptersCount: 12, category: 'Poetry' },
  { name: 'Song of Solomon', abbreviation: 'Sng', testament: 'OT', chaptersCount: 8, category: 'Poetry' },
  { name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', chaptersCount: 66, category: 'Prophets' },
  { name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', chaptersCount: 52, category: 'Prophets' },
  { name: 'Lamentations', abbreviation: 'Lam', testament: 'OT', chaptersCount: 5, category: 'Prophets' },
  { name: 'Ezekiel', abbreviation: 'Ezk', testament: 'OT', chaptersCount: 48, category: 'Prophets' },
  { name: 'Daniel', abbreviation: 'Dan', testament: 'OT', chaptersCount: 12, category: 'Prophets' },
  { name: 'Hosea', abbreviation: 'Hos', testament: 'OT', chaptersCount: 14, category: 'Prophets' },
  { name: 'Joel', abbreviation: 'Jol', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Amos', abbreviation: 'Amo', testament: 'OT', chaptersCount: 9, category: 'Prophets' },
  { name: 'Obadiah', abbreviation: 'Oba', testament: 'OT', chaptersCount: 1, category: 'Prophets' },
  { name: 'Jonah', abbreviation: 'Jon', testament: 'OT', chaptersCount: 4, category: 'Prophets' },
  { name: 'Micah', abbreviation: 'Mic', testament: 'OT', chaptersCount: 7, category: 'Prophets' },
  { name: 'Nahum', abbreviation: 'Nam', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Zephaniah', abbreviation: 'Zep', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Haggai', abbreviation: 'Hag', testament: 'OT', chaptersCount: 2, category: 'Prophets' },
  { name: 'Zechariah', abbreviation: 'Zec', testament: 'OT', chaptersCount: 14, category: 'Prophets' },
  { name: 'Malachi', abbreviation: 'Mal', testament: 'OT', chaptersCount: 4, category: 'Prophets' },

  // New Testament (27 Books)
  { name: 'Matthew', abbreviation: 'Mat', testament: 'NT', chaptersCount: 28, category: 'Gospels' },
  { name: 'Mark', abbreviation: 'Mrk', testament: 'NT', chaptersCount: 16, category: 'Gospels' },
  { name: 'Luke', abbreviation: 'Luk', testament: 'NT', chaptersCount: 24, category: 'Gospels' },
  { name: 'John', abbreviation: 'Jhn', testament: 'NT', chaptersCount: 21, category: 'Gospels' },
  { name: 'Acts', abbreviation: 'Act', testament: 'NT', chaptersCount: 28, category: 'History' },
  { name: 'Romans', abbreviation: 'Rom', testament: 'NT', chaptersCount: 16, category: 'Epistles' },
  { name: '1 Corinthians', abbreviation: '1Co', testament: 'NT', chaptersCount: 16, category: 'Epistles' },
  { name: '2 Corinthians', abbreviation: '2Co', testament: 'NT', chaptersCount: 13, category: 'Epistles' },
  { name: 'Galatians', abbreviation: 'Gal', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: 'Philippians', abbreviation: 'Php', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: 'Colossians', abbreviation: 'Col', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: '1 Thessalonians', abbreviation: '1Th', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 Thessalonians', abbreviation: '2Th', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: '1 Timothy', abbreviation: '1Ti', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: '2 Timothy', abbreviation: '2Ti', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: 'Titus', abbreviation: 'Tit', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: 'Philemon', abbreviation: 'Phm', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', chaptersCount: 13, category: 'Epistles' },
  { name: 'James', abbreviation: 'Jas', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '1 Peter', abbreviation: '1Pe', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 Peter', abbreviation: '2Pe', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: '1 John', abbreviation: '1Jo', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 John', abbreviation: '2Jo', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: '3 John', abbreviation: '3Jo', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: 'Jude', abbreviation: 'Jud', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: 'Revelation', abbreviation: 'Rev', testament: 'NT', chaptersCount: 22, category: 'Prophecy' },
];

export interface VerseItem {
  verse: number;
  text: string;
}

// Map of normalized book name to book ID (1 to 66)
const bookNameToIdMap = new Map<string, number>();
for (const b of (bundledKjvPack as { books: Array<{ id: number; name: string }> }).books) {
  bookNameToIdMap.set(b.name.toLowerCase(), b.id);
}

// Map of `${bookId}:${chapter}` -> VerseItem[]
const indexedChaptersMap = new Map<string, VerseItem[]>();
for (const v of (bundledKjvPack as { verses: Array<{ bookId: number; chapter: number; verse: number; text: string }> }).verses) {
  const key = `${v.bookId}:${v.chapter}`;
  let list = indexedChaptersMap.get(key);
  if (!list) {
    list = [];
    indexedChaptersMap.set(key, list);
  }
  list.push({ verse: v.verse, text: v.text.trim() });
}

/**
 * Returns authentic King James scripture verses for any book and chapter across all 66 books.
 * Zero placeholder verses, 100% genuine Scripture.
 */
export function getChapterVerses(bookName: string, chapter: number): VerseItem[] {
  const normalized = bookName.trim().toLowerCase();
  const bookId = bookNameToIdMap.get(normalized);
  if (bookId !== undefined) {
    const key = `${bookId}:${chapter}`;
    const verses = indexedChaptersMap.get(key);
    if (verses && verses.length > 0) {
      return verses;
    }
  }

  // Fallback for special name variations like 'Psalm' -> 'Psalms'
  if (normalized === 'psalm') {
    const pId = bookNameToIdMap.get('psalms');
    if (pId !== undefined) {
      const verses = indexedChaptersMap.get(`${pId}:${chapter}`);
      if (verses && verses.length > 0) return verses;
    }
  }

  return [];
}

/**
 * Fetches authentic Scripture dynamically from bible-api.com if needed
 */
export async function fetchOnlineChapter(bookName: string, chapter: number): Promise<VerseItem[]> {
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(bookName)}+${chapter}?translation=kjv`);
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json.verses)) {
      return json.verses.map((v: { verse: number; text: string }) => ({
        verse: v.verse,
        text: v.text.trim(),
      }));
    }
  } catch {
    // Network unavailable or offline
  }
  return [];
}
