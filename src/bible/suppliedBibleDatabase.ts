import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { BibleSearchResult, BibleVerse } from '../types/domain';
import { getDatabase } from '../db/database';

const DATABASE_NAME = 'bible.eng.db';
const DATABASE_DIRECTORY = `${FileSystem.documentDirectory || ''}SQLite/`;
const DATABASE_URI = `${DATABASE_DIRECTORY}${DATABASE_NAME}`;

interface TranslationRow {
  id: string;
  name: string;
  shortName: string | null;
  englishName: string | null;
  language: string | null;
  licenseUrl: string | null;
  licenseNotes: string | null;
  licenseNotice: string | null;
}

interface BookRow {
  id: string;
  name: string;
  translationId: string;
  order: number;
  numberOfChapters: number;
}

interface VerseRow {
  number: number;
  chapterNumber: number;
  bookId: string;
  translationId: string;
  text: string;
  name: string | null;
  englishName: string | null;
}

let bibleDatabase: SQLite.SQLiteDatabase | null = null;

export function getSuppliedBibleDatabaseUri(): string {
  return DATABASE_URI;
}

export async function isSuppliedBibleInstalled(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(DATABASE_URI);
  return info.exists && !info.isDirectory;
}

export async function installSuppliedBibleDatabase(sourceUri: string, onProgress?: (progress: number) => void): Promise<void> {
  await FileSystem.makeDirectoryAsync(DATABASE_DIRECTORY, { intermediates: true });
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
  if (!sourceInfo.exists || sourceInfo.isDirectory) throw new Error('Bible database source file was not found.');
  onProgress?.(10);
  await FileSystem.copyAsync({ from: sourceUri, to: DATABASE_URI });
  onProgress?.(100);
  bibleDatabase = null;
}

export async function downloadSuppliedBibleDatabase(url: string, onProgress?: (progress: number) => void): Promise<void> {
  await FileSystem.makeDirectoryAsync(DATABASE_DIRECTORY, { intermediates: true });
  const task = FileSystem.createDownloadResumable(DATABASE_URI, url, {}, progress => {
    const total = progress.totalBytesExpectedToWrite || 0;
    onProgress?.(total ? Math.round((progress.totalBytesWritten / total) * 100) : 0);
  });
  const result = await task.downloadAsync();
  if (!result) throw new Error('Bible database download did not complete.');
  bibleDatabase = null;
}

export function openSuppliedBibleDatabase(): SQLite.SQLiteDatabase {
  if (!bibleDatabase) {
    bibleDatabase = SQLite.openDatabaseSync(DATABASE_NAME, { useNewConnection: true }, DATABASE_DIRECTORY);
  }
  return bibleDatabase;
}

export function closeSuppliedBibleDatabase(): void {
  bibleDatabase?.closeSync();
  bibleDatabase = null;
}

export function listSuppliedTranslations(): TranslationRow[] {
  return openSuppliedBibleDatabase().getAllSync<TranslationRow>(
    `SELECT id, name, shortName, englishName, language, licenseUrl, licenseNotes, licenseNotice FROM Translation ORDER BY name`
  );
}

export function listSuppliedBooks(translationId: string): BookRow[] {
  return openSuppliedBibleDatabase().getAllSync<BookRow>(
    `SELECT id, name, translationId, "order", numberOfChapters FROM Book WHERE translationId = ? ORDER BY "order"`, translationId
  );
}

export function getSuppliedChapter(translationId: string, bookId: string, chapter: number): BibleVerse[] {
  const rows = openSuppliedBibleDatabase().getAllSync<VerseRow>(
    `SELECT number, chapterNumber, bookId, translationId, text, name, englishName
     FROM ChapterVerse WHERE translationId = ? AND bookId = ? AND chapterNumber = ? ORDER BY number`,
    translationId, bookId, chapter
  );
  return rows.map(row => ({
    versionId: row.translationId,
    bookId: 0,
    bookName: row.name || row.englishName || row.bookId,
    chapter: row.chapterNumber,
    verse: row.number,
    text: row.text
  }));
}

export function indexSuppliedTranslation(translationId: string): number {
  const source = openSuppliedBibleDatabase();
  const rows = source.getAllSync<VerseRow & { bookName: string }>(
    `SELECT v.number, v.chapterNumber, v.bookId, v.translationId, v.text, v.name, v.englishName, b.name AS bookName
     FROM ChapterVerse v JOIN Book b ON b.id = v.bookId AND b.translationId = v.translationId
     WHERE v.translationId = ? ORDER BY b."order", v.chapterNumber, v.number`, translationId
  );
  const target = getDatabase();
  target.withTransactionSync(() => {
    target.runSync(`DELETE FROM supplied_bible_fts WHERE translation_id = ?`, translationId);
    for (const row of rows) {
      target.runSync(
        `INSERT INTO supplied_bible_fts (translation_id, reference, text) VALUES (?, ?, ?)`,
        translationId, `${row.bookName} ${row.chapterNumber}:${row.number}`, row.text
      );
    }
  });
  return rows.length;
}

export function searchSuppliedBible(translationId: string, query: string, limit = 50): BibleSearchResult[] {
  const term = query.trim();
  if (!term) return [];
  const indexed = getDatabase().getFirstSync<{ count: number }>(`SELECT COUNT(*) AS count FROM supplied_bible_fts WHERE translation_id = ?`, translationId)?.count || 0;
  if (indexed > 0) {
    return getDatabase().getAllSync<BibleSearchResult & { reference: string }>(
      `SELECT translation_id AS versionId, 0 AS bookId, '' AS bookName, 0 AS chapter, 0 AS verse, text, reference
       FROM supplied_bible_fts WHERE translation_id = ? AND supplied_bible_fts MATCH ? LIMIT ?`,
      translationId, `${term.replace(/["*]/g, '')}*`, limit
    );
  }
  const rows = openSuppliedBibleDatabase().getAllSync<VerseRow>(`SELECT number, chapterNumber, bookId, translationId, text, name, englishName FROM ChapterVerse WHERE translationId = ? AND text LIKE ? LIMIT ?`, translationId, `%${term}%`, limit);
  return rows.map(row => ({ versionId: row.translationId, bookId: 0, bookName: row.name || row.englishName || row.bookId, chapter: row.chapterNumber, verse: row.number, text: row.text, reference: `${row.name || row.englishName || row.bookId} ${row.chapterNumber}:${row.number}` }));
}
