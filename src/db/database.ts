import * as SQLite from 'expo-sqlite';

const database = SQLite.openDatabaseSync('gatewayconnect.db');
const SCHEMA_VERSION = 2;

import { runMigrations } from './migrations';

export function initializeDatabase(): void {
  database.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  runMigrations(database);
}

export function getDatabase(): SQLite.SQLiteDatabase {
  return database;
}

export function getAppSetting(key: string): string | null {
  const row = database.getFirstSync<{ value: string }>(`SELECT value FROM app_settings WHERE key = ? LIMIT 1`, key);
  return row ? row.value : null;
}

export function setAppSetting(key: string, value: string): void {
  database.runSync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    key, value, new Date().toISOString()
  );
}
