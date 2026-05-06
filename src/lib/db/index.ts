import { openDatabaseAsync, deleteDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';

let db: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (db) return db;
  if (opening) return opening;
  opening = (async () => {
    const database = await openDatabaseAsync('whispnote.db');
    await runMigrations(database);
    db = database;
    return database;
  })();
  return opening;
}

export async function resetDb(): Promise<void> {
  db = null;
  opening = null;
  try {
    await deleteDatabaseAsync('whispnote.db');
  } catch {
    // ignore if doesn't exist
  }
}

export { decksRepo } from './decksRepo';
export { notesRepo } from './notesRepo';
export { cardsRepo } from './cardsRepo';
