import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = { id: number; up: string };

const migration1Up = `
CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'sage',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  audio_uri TEXT NOT NULL,
  transcript TEXT,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  deck_id TEXT REFERENCES decks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'Note',
  importance INTEGER NOT NULL DEFAULT 3,
  accent TEXT NOT NULL DEFAULT 'sage',
  bookmarked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cards_deck_id_idx ON cards(deck_id);
CREATE INDEX IF NOT EXISTS cards_category_idx ON cards(category);
CREATE INDEX IF NOT EXISTS cards_bookmarked_idx ON cards(bookmarked);
`;

export const migrations: Migration[] = [{ id: 1, up: migration1Up }];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)`,
  );
  const applied = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM _migrations ORDER BY id',
  );
  const appliedIds = new Set(applied.map((r) => r.id));
  for (const m of migrations) {
    if (appliedIds.has(m.id)) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.up);
      await db.runAsync(
        'INSERT INTO _migrations (id, applied_at) VALUES (?, ?)',
        m.id,
        Date.now(),
      );
    });
  }
}
