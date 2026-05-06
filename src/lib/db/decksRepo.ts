import { getDb } from '@/lib/db';
import type { Deck, DeckAccent } from '@/types';

type Row = {
  id: string;
  name: string;
  accent: string;
  created_at: number;
  updated_at: number;
};

function rowToDeck(row: Row): Deck {
  return {
    id: row.id,
    name: row.name,
    accent: row.accent as DeckAccent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const decksRepo = {
  async create(input: { name: string; accent?: DeckAccent }): Promise<Deck> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = Date.now();
    const accent = input.accent ?? 'sage';
    await db.runAsync(
      'INSERT INTO decks (id, name, accent, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      id,
      input.name,
      accent,
      now,
      now,
    );
    return { id, name: input.name, accent, createdAt: now, updatedAt: now };
  },

  async list(): Promise<Deck[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT id, name, accent, created_at, updated_at FROM decks ORDER BY updated_at DESC',
    );
    return rows.map(rowToDeck);
  },

  async get(id: string): Promise<Deck | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row | null>(
      'SELECT id, name, accent, created_at, updated_at FROM decks WHERE id = ?',
      id,
    );
    return row ? rowToDeck(row) : null;
  },

  async getByName(name: string): Promise<Deck | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row | null>(
      'SELECT id, name, accent, created_at, updated_at FROM decks WHERE LOWER(name) = LOWER(?)',
      name,
    );
    return row ? rowToDeck(row) : null;
  },

  async update(
    id: string,
    patch: Partial<Pick<Deck, 'name' | 'accent'>>,
  ): Promise<Deck> {
    const db = await getDb();
    const existing = await this.get(id);
    if (!existing) throw new Error(`Deck not found: ${id}`);
    const name = patch.name ?? existing.name;
    const accent = patch.accent ?? existing.accent;
    const now = Date.now();
    await db.runAsync(
      'UPDATE decks SET name = ?, accent = ?, updated_at = ? WHERE id = ?',
      name,
      accent,
      now,
      id,
    );
    return { ...existing, name, accent, updatedAt: now };
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM decks WHERE id = ?', id);
  },
};
