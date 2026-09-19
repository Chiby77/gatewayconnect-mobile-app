import { getDatabase } from '../db/database';
import { BibleColor, BibleSearchResult, BibleVerse } from '../types/domain';
import { installBiblePack, KJV_CORE_PACK } from './biblePack';
import bundledKjvPack from '../../bible-packs/generated/eng_kjv.json';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export class BibleRepository {
  static ensureCorePack(): void {
    const database = getDatabase();
    const bundledPack = bundledKjvPack as typeof KJV_CORE_PACK;
    const installed = database.getFirstSync<{ id: string }>(`SELECT id FROM bible_versions WHERE id = ?`, bundledPack.id);
    if (!installed) installBiblePack(bundledPack);
  }

  static getChapter(versionId: string, bookId: number, chapter: number): BibleVerse[] {
    return getDatabase().getAllSync<BibleVerse>(
      `SELECT v.version_id AS versionId, v.book_id AS bookId, b.name AS bookName, v.chapter, v.verse, v.text
       FROM bible_verses v JOIN bible_books b ON b.id = v.book_id
       WHERE v.version_id = ? AND v.book_id = ? AND v.chapter = ? ORDER BY v.verse`,
      versionId, bookId, chapter
    );
  }

  static search(versionId: string, query: string): BibleSearchResult[] {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return getDatabase().getAllSync<BibleSearchResult>(
      `SELECT version_id AS versionId, 0 AS bookId, '' AS bookName, 0 AS chapter, 0 AS verse,
              text, reference FROM bible_verses_fts WHERE version_id = ? AND bible_verses_fts MATCH ? LIMIT 50`,
      versionId, `${trimmed.replace(/["*]/g, '')}*`
    );
  }

  static toggleBookmark(userId: string | null, versionId: string, reference: string): boolean {
    const database = getDatabase();
    const existing = database.getFirstSync<{ id: string }>(
      `SELECT id FROM bible_bookmarks WHERE user_id IS ? AND version_id = ? AND reference = ?`, userId, versionId, reference
    );
    if (existing) {
      database.runSync(`DELETE FROM bible_bookmarks WHERE id = ?`, existing.id);
      return false;
    }
    database.runSync(
      `INSERT INTO bible_bookmarks (id, user_id, version_id, reference, created_at) VALUES (?, ?, ?, ?, ?)`,
      id('bookmark'), userId, versionId, reference, new Date().toISOString()
    );
    return true;
  }

  static setHighlight(userId: string | null, versionId: string, reference: string, color: BibleColor): void {
    getDatabase().runSync(
      `INSERT OR REPLACE INTO bible_highlights (id, user_id, version_id, reference, color, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      id('highlight'), userId, versionId, reference, color, new Date().toISOString()
    );
  }

  static saveNote(userId: string | null, versionId: string, reference: string, note: string): void {
    getDatabase().runSync(
      `INSERT OR REPLACE INTO bible_notes (id, user_id, version_id, reference, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      id('note'), userId, versionId, reference, note, new Date().toISOString()
    );
  }

  static getHighlights(userId: string | null, versionId: string): Record<string, BibleColor> {
    const highlights = getDatabase().getAllSync<{ reference: string, color: BibleColor }>(
      `SELECT reference, color FROM bible_highlights WHERE user_id IS ? AND version_id = ?`,
      userId, versionId
    );
    const result: Record<string, BibleColor> = {};
    for (const h of highlights) {
      result[h.reference] = h.color;
    }
    return result;
  }

  static getNotes(userId: string | null, versionId: string): Record<string, string> {
    const notes = getDatabase().getAllSync<{ reference: string, note: string }>(
      `SELECT reference, note FROM bible_notes WHERE user_id IS ? AND version_id = ?`,
      userId, versionId
    );
    const result: Record<string, string> = {};
    for (const n of notes) {
      result[n.reference] = n.note;
    }
    return result;
  }

  static deleteHighlight(userId: string | null, versionId: string, reference: string): void {
    getDatabase().runSync(
      `DELETE FROM bible_highlights WHERE user_id IS ? AND version_id = ? AND reference = ?`,
      userId, versionId, reference
    );
  }

  static deleteNote(userId: string | null, versionId: string, reference: string): void {
    getDatabase().runSync(
      `DELETE FROM bible_notes WHERE user_id IS ? AND version_id = ? AND reference = ?`,
      userId, versionId, reference
    );
  }

  static listBookmarks(userId: string | null): string[] {
    return getDatabase().getAllSync<{ reference: string }>(
      `SELECT reference FROM bible_bookmarks WHERE user_id IS ? ORDER BY created_at DESC`, userId
    ).map(item => item.reference);
  }
}
