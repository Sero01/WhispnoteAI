# Story 02: `decksRepo`

**Tier:** flash

## Goal
Typed repository for the `decks` table with CRUD methods. All access goes through this repo; no raw SQL outside `src/lib/db/`.

## Files in scope
- `src/lib/db/decksRepo.ts` — create
- `src/types/index.ts` — create (shared types if not yet existing) or modify
- `__tests__/lib/db/decksRepo.test.ts` — create

## Do not touch
- `src/lib/db/index.ts`, `migrations.ts` — settled
- All other files

## Interface contracts

```ts
// src/types/index.ts (add)
export type DeckAccent = 'sage' | 'lavender' | 'peach' | 'cream';
export type Deck = {
  id: string;
  name: string;
  accent: DeckAccent;
  createdAt: number;       // unix ms
  updatedAt: number;
};

// src/lib/db/decksRepo.ts
export const decksRepo = {
  async create(input: { name: string; accent?: DeckAccent }): Promise<Deck>,
  async list(): Promise<Deck[]>,                                  // ordered by updated_at desc
  async get(id: string): Promise<Deck | null>,
  async getByName(name: string): Promise<Deck | null>,            // case-insensitive
  async update(id: string, patch: Partial<Pick<Deck, 'name' | 'accent'>>): Promise<Deck>,
  async delete(id: string): Promise<void>,
};
```

## Implementation notes
- IDs: use `crypto.randomUUID()` if available; otherwise import `nanoid` (devDep). The test should be deterministic — the implementer can pass `_idGenerator` as an internal injection or just trust unique values within the test scope.
- Each method calls `await getDb()` to obtain the singleton.
- `created_at`/`updated_at` set to `Date.now()` on create/update.
- All SQL parameterized.
- Convert SQL row → `Deck` via a small `rowToDeck` helper.

## Tests
- `create` → `get` round-trip returns the same record.
- `list` returns in `updated_at desc` order (insert two with delay, assert order).
- `getByName` case-insensitive match.
- `update` mutates fields and bumps `updated_at`.
- `delete` removes; subsequent `get` returns null.

## Acceptance criteria
- [ ] `npm test` exits 0.
- [ ] Lint, typecheck exit 0.
- [ ] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `src/types/index.ts` — created with `DeckAccent` and `Deck` type exports
- `src/lib/db/decksRepo.ts` — created with CRUD methods (`create`, `list`, `get`, `getByName`, `update`, `delete`)
- `__tests__/lib/db/decksRepo.test.ts` — created with 10 test cases covering all CRUD operations

**Public interfaces added/modified:**
- `src/types/index.ts`: `DeckAccent`, `Deck`
- `src/lib/db/decksRepo.ts`: `decksRepo` object with 6 async methods per spec

**Decisions made:**
- Used `crypto.randomUUID()` for ID generation (available in test env via Node built-in)
- `update` throws `Error('Deck not found: {id}')` on missing deck (not silent)
- `getByName` uses `LOWER(name) = LOWER(?)` for case-insensitive matching
- Default accent in `create` is `'sage'` when not provided
- `rowToDeck` helper converts snake_case DB columns to camelCase TS types

**Gotchas discovered:**
- The expo-sqlite mock in `jest.setup.ts` uses `better-sqlite3` in-memory, which handles real SQL correctly — this repo works in both test and production
- `getFirstAsync` in the mock expects params as individual args, same as `runAsync` / `getAllAsync`

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 19 suites, 106 tests passed (including 10 new decksRepo tests)
- `npm run lint`: 0 errors, 5 pre-existing warnings
- `npm run typecheck`: 0 errors
