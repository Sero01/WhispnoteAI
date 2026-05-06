import { getDb } from '@/lib/db';
import type { Card, CardImportance, DeckAccent } from '@/types';

type Row = {
  id: string;
  note_id: string;
  deck_id: string | null;
  title: string;
  summary: string;
  body: string;
  tags_json: string;
  category: string;
  importance: number;
  accent: string;
  bookmarked: number;
  created_at: number;
  updated_at: number;
};

function rowToCard(row: Row): Card {
  return {
    id: row.id,
    noteId: row.note_id,
    deckId: row.deck_id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    tags: JSON.parse(row.tags_json) as string[],
    category: row.category,
    importance: row.importance as CardImportance,
    accent: row.accent as DeckAccent,
    bookmarked: row.bookmarked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateCardInput = {
  noteId: string;
  deckId?: string | null;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  category: string;
  importance: CardImportance;
  accent: DeckAccent;
};

export type CardFilter = {
  deckId?: string;
  category?: string;
  bookmarked?: boolean;
};

export const cardsRepo = {
  async create(input: CreateCardInput): Promise<Card> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = Date.now();
    const deckId = input.deckId ?? null;
    const tagsJson = JSON.stringify(input.tags);
    await db.runAsync(
      `INSERT INTO cards (id, note_id, deck_id, title, summary, body, tags_json, category, importance, accent, bookmarked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      id,
      input.noteId,
      deckId,
      input.title,
      input.summary,
      input.body,
      tagsJson,
      input.category,
      input.importance,
      input.accent,
      now,
      now,
    );
    return {
      id,
      noteId: input.noteId,
      deckId,
      title: input.title,
      summary: input.summary,
      body: input.body,
      tags: input.tags,
      category: input.category,
      importance: input.importance,
      accent: input.accent,
      bookmarked: false,
      createdAt: now,
      updatedAt: now,
    };
  },

  async get(id: string): Promise<Card | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row | null>(
      `SELECT id, note_id, deck_id, title, summary, body, tags_json, category, importance, accent, bookmarked, created_at, updated_at
       FROM cards WHERE id = ?`,
      id,
    );
    return row ? rowToCard(row) : null;
  },

  async list(filter?: CardFilter): Promise<Card[]> {
    const db = await getDb();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.deckId !== undefined) {
      conditions.push('deck_id = ?');
      params.push(filter.deckId);
    }
    if (filter?.category !== undefined) {
      conditions.push('category = ?');
      params.push(filter.category);
    }
    if (filter?.bookmarked !== undefined) {
      conditions.push('bookmarked = ?');
      params.push(filter.bookmarked ? 1 : 0);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await db.getAllAsync<Row>(
      `SELECT id, note_id, deck_id, title, summary, body, tags_json, category, importance, accent, bookmarked, created_at, updated_at
       FROM cards ${where} ORDER BY updated_at DESC`,
      ...params,
    );
    return rows.map(rowToCard);
  },

  async listCategories(): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ category: string }>(
      'SELECT DISTINCT category FROM cards ORDER BY category ASC',
    );
    return rows.map((r) => r.category);
  },

  async update(
    id: string,
    patch: Partial<Omit<Card, 'id' | 'noteId' | 'createdAt'>>,
  ): Promise<Card> {
    const db = await getDb();
    const existing = await this.get(id);
    if (!existing) throw new Error(`Card not found: ${id}`);

    const now = Date.now();
    const title = patch.title ?? existing.title;
    const summary = patch.summary ?? existing.summary;
    const body = patch.body ?? existing.body;
    const tags = patch.tags ?? existing.tags;
    const category = patch.category ?? existing.category;
    const importance = patch.importance ?? existing.importance;
    const accent = patch.accent ?? existing.accent;
    const deckId = patch.deckId !== undefined ? patch.deckId : existing.deckId;
    const bookmarked = patch.bookmarked ?? existing.bookmarked;

    await db.runAsync(
      `UPDATE cards SET title = ?, summary = ?, body = ?, tags_json = ?, category = ?, importance = ?, accent = ?, deck_id = ?, bookmarked = ?, updated_at = ? WHERE id = ?`,
      title,
      summary,
      body,
      JSON.stringify(tags),
      category,
      importance,
      accent,
      deckId,
      bookmarked ? 1 : 0,
      now,
      id,
    );

    return {
      id: existing.id,
      noteId: existing.noteId,
      deckId,
      title,
      summary,
      body,
      tags,
      category,
      importance,
      accent,
      bookmarked,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  },

  async setBookmarked(id: string, bookmarked: boolean): Promise<Card> {
    return this.update(id, { bookmarked });
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM cards WHERE id = ?', id);
  },
};
