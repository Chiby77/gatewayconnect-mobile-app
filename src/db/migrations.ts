import * as SQLite from 'expo-sqlite';

const migrations: string[] = [
  // Migration 0 is applied implicitly before we start tracking version 1.
  '',
  // Migration 1: Initial schema
  `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      handle TEXT,
      phone TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS bible_versions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      version TEXT NOT NULL,
      license TEXT,
      pack_version TEXT NOT NULL,
      installed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bible_books (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      testament TEXT NOT NULL,
      chapters_count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bible_verses (
      version_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY(version_id, book_id, chapter, verse),
      FOREIGN KEY(version_id) REFERENCES bible_versions(id) ON DELETE CASCADE,
      FOREIGN KEY(book_id) REFERENCES bible_books(id) ON DELETE CASCADE
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS bible_verses_fts USING fts5(
      version_id UNINDEXED,
      reference UNINDEXED,
      text,
      tokenize='unicode61'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS supplied_bible_fts USING fts5(
      translation_id UNINDEXED,
      reference UNINDEXED,
      text,
      tokenize='unicode61'
    );
    CREATE TABLE IF NOT EXISTS bible_bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      version_id TEXT NOT NULL,
      reference TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, version_id, reference)
    );
    CREATE TABLE IF NOT EXISTS bible_highlights (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      version_id TEXT NOT NULL,
      reference TEXT NOT NULL,
      color TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, version_id, reference)
    );
    CREATE TABLE IF NOT EXISTS bible_notes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      version_id TEXT NOT NULL DEFAULT 'KJV',
      reference TEXT NOT NULL,
      note TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reading_plans (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      days_total INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reading_plan_progress (
      plan_id TEXT NOT NULL,
      user_id TEXT,
      current_day INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(plan_id, user_id),
      FOREIGN KEY(plan_id) REFERENCES reading_plans(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY NOT NULL,
      post_id TEXT NOT NULL,
      user_id TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prayer_requests (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      sender_id TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_downloads (
      id TEXT PRIMARY KEY NOT NULL,
      content_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      checksum TEXT,
      size_bytes INTEGER,
      status TEXT NOT NULL DEFAULT 'complete',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_cursors (
      resource TEXT PRIMARY KEY NOT NULL,
      cursor TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_tombstones (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      deleted_at TEXT NOT NULL,
      PRIMARY KEY(entity_type, entity_id)
    );
    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_error TEXT,
      next_attempt_at TEXT,
      idempotency_key TEXT UNIQUE
    );
  `,
  // Migration 2: Indexes
  `
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_ready ON sync_outbox(status, next_attempt_at, created_at);
      CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup ON bible_verses(version_id, book_id, chapter, verse);
      CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(type, updated_at);
  `,
  // Migration 3: Group memberships
  `
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      PRIMARY KEY(group_id, user_id),
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE
    );
  `,
  // Migration 4: Events table
  `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      banner_url TEXT,
      category TEXT,
      created_at TEXT NOT NULL
    );
  `,
  // Migration 5: Seed Reading Plans
  `
    INSERT OR IGNORE INTO reading_plans (id, title, description, days_total) 
    VALUES ('nt_30_days', 'New Testament in 30 Days', 'Read through the New Testament in just a month.', 30);
  `,
  // Migration 6: Products / Store table
  `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      image_url TEXT,
      category TEXT,
      in_stock INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `
];

export function runMigrations(db: SQLite.SQLiteDatabase): void {
  let currentVersion = Number(db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version || 0);

  // Apply migrations one by one. If currentVersion is 0, we apply migrations[1].
  for (let i = currentVersion + 1; i < migrations.length; i++) {
    const migration = migrations[i];
    if (migration) {
      db.execSync(migration);
    }
    db.execSync(`PRAGMA user_version = ${i}`);
    currentVersion = i;
  }
}
