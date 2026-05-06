import { getDb } from '@/lib/db';
import type { Note } from '@/types';

type Row = {
  id: string;
  audio_uri: string;
  transcript: string | null;
  duration_ms: number;
  created_at: number;
};

function rowToNote(row: Row): Note {
  return {
    id: row.id,
    audioUri: row.audio_uri,
    transcript: row.transcript,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

export const notesRepo = {
  async create(input: { audioUri: string; durationMs: number; transcript?: string | null }): Promise<Note> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const now = Date.now();
    const transcript = input.transcript ?? null;
    await db.runAsync(
      'INSERT INTO notes (id, audio_uri, transcript, duration_ms, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      input.audioUri,
      transcript,
      input.durationMs,
      now,
    );
    return { id, audioUri: input.audioUri, transcript, durationMs: input.durationMs, createdAt: now };
  },

  async setTranscript(id: string, transcript: string): Promise<Note> {
    const db = await getDb();
    await db.runAsync('UPDATE notes SET transcript = ? WHERE id = ?', transcript, id);
    const row = await db.getFirstAsync<Row | null>(
      'SELECT id, audio_uri, transcript, duration_ms, created_at FROM notes WHERE id = ?',
      id,
    );
    if (!row) throw new Error(`Note not found: ${id}`);
    return rowToNote(row);
  },

  async get(id: string): Promise<Note | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row | null>(
      'SELECT id, audio_uri, transcript, duration_ms, created_at FROM notes WHERE id = ?',
      id,
    );
    return row ? rowToNote(row) : null;
  },

  async list(): Promise<Note[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT id, audio_uri, transcript, duration_ms, created_at FROM notes ORDER BY created_at DESC',
    );
    return rows.map(rowToNote);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  },
};
