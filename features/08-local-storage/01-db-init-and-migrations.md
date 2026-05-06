# Story 01: DB init + migrations

**Tier:** flash

## Goal
`expo-sqlite` singleton DB at `whispnote.db` with an idempotent migration runner. First migration creates `decks`, `notes`, `cards` tables.

## Files in scope
- `package.json` — modify (add `expo-sqlite`)
- `src/lib/db/index.ts` — create (singleton + `getDb()`)
- `src/lib/db/migrations.ts` — create (migration list + runner)
- `__tests__/lib/db/migrations.test.ts` — create
- `jest.setup.ts` — modify (mock `expo-sqlite` with an in-memory implementation)

## Do not touch
- All other files.

## Interface contracts

```ts
// src/lib/db/index.ts
import type { SQLiteDatabase } from 'expo-sqlite';
export async function getDb(): Promise<SQLiteDatabase>; // creates + runs migrations on first call, cached after
export async function resetDb(): Promise<void>;          // drops & recreates (test helper; do not use in app code)
```

```ts
// src/lib/db/migrations.ts
export type Migration = { id: number; up: string };
export const migrations: Migration[];                    // ordered by id; first migration creates tables
export async function runMigrations(db: SQLiteDatabase): Promise<void>;
```

Migration 1 SQL:
```sql
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
```

`runMigrations` should: (1) ensure `_migrations` exists; (2) read applied ids; (3) for each migration not applied, run its `up` and insert a row in `_migrations`. All inside one transaction per migration.

## jest.setup.ts mock (additive)
Use `better-sqlite3` if installed; otherwise emulate with a Map-based fake. Simplest path: emulate the minimal `expo-sqlite` API surface used by repos:
```ts
jest.mock('expo-sqlite', () => {
  const dbs: Record<string, any> = {};
  function makeDb() {
    const tables: Record<string, any[]> = {};
    // Minimal SQL-ish fake: parse simple CREATE/INSERT/SELECT/UPDATE/DELETE.
    // Implementer: use an in-memory better-sqlite3 ('better-sqlite3') wrapper
    //   if available so tests run real SQL. Otherwise stub minimal behavior.
    return { /* implementer fills */ };
  }
  return {
    openDatabaseAsync: jest.fn(async (name: string) => (dbs[name] ??= makeDb())),
  };
});
```
**Implementer:** install `better-sqlite3` as a devDep and back the mock with it. The mock's `runAsync`/`getAllAsync`/`getFirstAsync`/`execAsync`/`withTransactionAsync` should delegate to `better-sqlite3`. This is the only sane path because emulating SQL by hand explodes in scope.

The wrapper API expected by repos:
```ts
type SQLiteDatabase = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
};
```

## Tests
- `runMigrations` on an empty db creates all 3 tables (assert by `SELECT name FROM sqlite_master WHERE type='table'`).
- Calling `runMigrations` twice doesn't error and doesn't re-apply.
- `getDb()` returns the same instance on repeat calls.
- `resetDb()` followed by `getDb()` re-creates tables.

## Acceptance criteria
- [ ] `npm test` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `expo-sqlite` dep, `better-sqlite3` + `@types/better-sqlite3` devDeps
- `src/lib/db/index.ts` — create (singleton `getDb()` + `resetDb()`)
- `src/lib/db/migrations.ts` — create (migration list + `runMigrations()`)
- `__tests__/lib/db/migrations.test.ts` — create (4 test cases)
- `jest.setup.ts` — modify (add `expo-sqlite` mock backed by `better-sqlite3` in-memory)

**Public interfaces added/modified:**
- `export async function getDb(): Promise<SQLiteDatabase>` — `src/lib/db/index.ts:5`
- `export async function resetDb(): Promise<void>` — `src/lib/db/index.ts:20`
- `export type Migration = { id: number; up: string }` — `src/lib/db/migrations.ts:3`
- `export const migrations: Migration[]` — `src/lib/db/migrations.ts:42`
- `export async function runMigrations(db: SQLiteDatabase): Promise<void>` — `src/lib/db/migrations.ts:44`

**Decisions made:**
- Used static imports (`from 'expo-sqlite'`) instead of dynamic `import()` in `index.ts` because jest without `--experimental-vm-modules` rejects dynamic imports in the module scope.
- Named the better-sqlite3 variable `mockBetterSqlite3` and db registry `mockExpoSqliteDbs` (both prefixed with `mock`) to satisfy jest's factory scope restriction.

**Gotchas discovered:**
- jest's `babel-jest` transform enforces that `jest.mock()` factory callbacks cannot reference outer-scope variables unless their names are prefixed with `mock` (case-insensitive). Both the `require()` result and the db registry map need the prefix.
- The `withTransactionAsync` mock uses manual `BEGIN`/`COMMIT`/`ROLLBACK` rather than `better-sqlite3`'s `db.transaction()` because the latter requires a synchronous callback, but `runMigrations` passes an async function (which resolves synchronously under the hood since `better-sqlite3` is synchronous).

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 18 suites passed, 95 tests passed

- Command: `npm run lint`
- Exit: 0 (5 pre-existing warnings, 0 errors)

- Command: `npm run typecheck`
- Exit: 0
