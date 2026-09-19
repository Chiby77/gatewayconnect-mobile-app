import { getDatabase } from '../db/database';

export interface BibleBookSeed {
  id: number;
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  chaptersCount: number;
}

export interface BibleVerseSeed {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePack {
  id: string;
  name: string;
  language: string;
  version: string;
  license: string;
  packVersion: string;
  books: BibleBookSeed[];
  verses: BibleVerseSeed[];
}

export const BIBLE_BOOKS: BibleBookSeed[] = [
  ['Genesis', 'Ge', 'OT', 50], ['Exodus', 'Ex', 'OT', 40], ['Leviticus', 'Le', 'OT', 27], ['Numbers', 'Nu', 'OT', 36], ['Deuteronomy', 'De', 'OT', 34],
  ['Joshua', 'Jos', 'OT', 24], ['Judges', 'Jdg', 'OT', 21], ['Ruth', 'Ru', 'OT', 4], ['1 Samuel', '1Sa', 'OT', 31], ['2 Samuel', '2Sa', 'OT', 24],
  ['1 Kings', '1Ki', 'OT', 22], ['2 Kings', '2Ki', 'OT', 25], ['1 Chronicles', '1Ch', 'OT', 29], ['2 Chronicles', '2Ch', 'OT', 36], ['Ezra', 'Ezr', 'OT', 10],
  ['Nehemiah', 'Ne', 'OT', 13], ['Esther', 'Es', 'OT', 10], ['Job', 'Job', 'OT', 42], ['Psalms', 'Ps', 'OT', 150], ['Proverbs', 'Pr', 'OT', 31],
  ['Ecclesiastes', 'Ec', 'OT', 12], ['Song of Solomon', 'So', 'OT', 8], ['Isaiah', 'Isa', 'OT', 66], ['Jeremiah', 'Jer', 'OT', 52], ['Lamentations', 'La', 'OT', 5],
  ['Ezekiel', 'Eze', 'OT', 48], ['Daniel', 'Da', 'OT', 12], ['Hosea', 'Ho', 'OT', 14], ['Joel', 'Joe', 'OT', 3], ['Amos', 'Am', 'OT', 9],
  ['Obadiah', 'Ob', 'OT', 1], ['Jonah', 'Jon', 'OT', 4], ['Micah', 'Mic', 'OT', 7], ['Nahum', 'Na', 'OT', 3], ['Habakkuk', 'Hab', 'OT', 3],
  ['Zephaniah', 'Zep', 'OT', 3], ['Haggai', 'Hag', 'OT', 2], ['Zechariah', 'Zec', 'OT', 14], ['Malachi', 'Mal', 'OT', 4],
  ['Matthew', 'Mt', 'NT', 28], ['Mark', 'Mk', 'NT', 16], ['Luke', 'Lk', 'NT', 24], ['John', 'Jn', 'NT', 21], ['Acts', 'Ac', 'NT', 28],
  ['Romans', 'Ro', 'NT', 16], ['1 Corinthians', '1Co', 'NT', 16], ['2 Corinthians', '2Co', 'NT', 13], ['Galatians', 'Ga', 'NT', 6], ['Ephesians', 'Eph', 'NT', 6],
  ['Philippians', 'Php', 'NT', 4], ['Colossians', 'Col', 'NT', 4], ['1 Thessalonians', '1Th', 'NT', 5], ['2 Thessalonians', '2Th', 'NT', 3], ['1 Timothy', '1Ti', 'NT', 6],
  ['2 Timothy', '2Ti', 'NT', 4], ['Titus', 'Tit', 'NT', 3], ['Philemon', 'Phm', 'NT', 1], ['Hebrews', 'Heb', 'NT', 13], ['James', 'Jas', 'NT', 5],
  ['1 Peter', '1Pe', 'NT', 5], ['2 Peter', '2Pe', 'NT', 3], ['1 John', '1Jn', 'NT', 5], ['2 John', '2Jn', 'NT', 1], ['3 John', '3Jn', 'NT', 1], ['Jude', 'Jud', 'NT', 1], ['Revelation', 'Rev', 'NT', 22]
].map(([name, abbreviation, testament, chaptersCount], index) => ({ id: index + 1, name: name as string, abbreviation: abbreviation as string, testament: testament as 'OT' | 'NT', chaptersCount: chaptersCount as number }));

const CORE_VERSES: BibleVerseSeed[] = [
  { bookId: 1, chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
  { bookId: 1, chapter: 1, verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' },
  { bookId: 19, chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  { bookId: 19, chapter: 23, verse: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
  { bookId: 19, chapter: 23, verse: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
  { bookId: 19, chapter: 23, verse: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil.' },
  { bookId: 19, chapter: 91, verse: 1, text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.' },
  { bookId: 20, chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { bookId: 40, chapter: 5, verse: 3, text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.' },
  { bookId: 40, chapter: 6, verse: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
  { bookId: 43, chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son.' },
  { bookId: 45, chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God.' },
  { bookId: 50, chapter: 4, verse: 13, text: 'I can do all things through Christ which strengtheneth me.' }
];

export const KJV_CORE_PACK: BiblePack = {
  id: 'kjv-core',
  name: 'King James Version Core Pack',
  language: 'English',
  version: 'KJV',
  license: 'Public domain',
  packVersion: '1.0.0',
  books: BIBLE_BOOKS,
  verses: CORE_VERSES
};

export function installBiblePack(pack: BiblePack): void {
  const database = getDatabase();
  const installedAt = new Date().toISOString();
  database.withTransactionSync(() => {
    database.runSync(`DELETE FROM bible_verses_fts WHERE version_id = ?`, pack.id);
    database.runSync(
      `INSERT OR REPLACE INTO bible_versions (id, name, language, version, license, pack_version, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      pack.id, pack.name, pack.language, pack.version, pack.license, pack.packVersion, installedAt
    );
    for (const book of pack.books) {
      database.runSync(
        `INSERT OR REPLACE INTO bible_books (id, name, abbreviation, testament, chapters_count) VALUES (?, ?, ?, ?, ?)`,
        book.id, book.name, book.abbreviation, book.testament, book.chaptersCount
      );
    }
    for (const verse of pack.verses) {
      database.runSync(
        `INSERT OR REPLACE INTO bible_verses (version_id, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)`,
        pack.id, verse.bookId, verse.chapter, verse.verse, verse.text
      );
      const book = pack.books.find(item => item.id === verse.bookId);
      database.runSync(
        `INSERT INTO bible_verses_fts (version_id, reference, text) VALUES (?, ?, ?)`,
        pack.id, `${book?.name ?? 'Unknown'} ${verse.chapter}:${verse.verse}`, verse.text
      );
    }
  });
}
