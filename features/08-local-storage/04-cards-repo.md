# Story 04: `cardsRepo`

**Tier:** flash

## Goal
Typed repository for `cards` with CRUD + filtering by deck/category/bookmarked.

## Files in scope
- `src/lib/db/cardsRepo.ts` — create
- `src/types/index.ts` — modify (add `Card`, `CardImportance` types)
- `src/lib/db/index.ts` — modify (re-export `decksRepo`, `notesRepo`, `cardsRepo` for convenience)
- `__tests__/lib/db/cardsRepo.test.ts` — create

## Do not touch
- `migrations.ts`, `decksRepo.ts`, `notesRepo.ts` — settled (only `index.ts` re-exports added)

## Interface contracts

```ts
// src/types/index.ts (add)
export type CardImportance = 1 | 2 | 3 | 4 | 5;
export type Card = {
  id: string;
  noteId: string;
  deckId: string | null;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  category: string;
  importance: CardImportance;
  accent: DeckAccent;
  bookmarked: boolean;
  createdAt: number;
  updatedAt: number;
};

// src/lib/db/cardsRepo.ts
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
  async create(input: CreateCardInput): Promise<Card>,
  async get(id: string): Promise<Card | null>,
  async list(filter?: CardFilter): Promise<Card[]>,    // ordered by updated_at desc
  async listCategories(): Promise<string[]>,           // distinct categories present
  async update(id: string, patch: Partial<Omit<Card, 'id' | 'noteId' | 'createdAt'>>): Promise<Card>,
  async setBookmarked(id: string, bookmarked: boolean): Promise<Card>,
  async delete(id: string): Promise<void>,
};
```

## Implementation notes
- `tags` round-trips through `tags_json` (JSON string).
- `bookmarked` boolean ↔ integer 0/1.
- `list` builds WHERE clauses dynamically based on filter keys present, but always with parameterized values.
- `listCategories` returns `SELECT DISTINCT category FROM cards ORDER BY category ASC`.
- `update` — accept any subset of mutable fields; bumps `updated_at`. Re-serialize `tags` if provided.

## Tests
- Create + get round-trip preserves all fields including `tags` array.
- `list` with no filter returns all in updated_at desc order.
- `list({ deckId })` filters correctly.
- `list({ category })` filters correctly.
- `list({ bookmarked: true })` filters correctly.
- `setBookmarked` toggles the flag.
- `update` patches multiple fields.
- `delete` removes.
- `listCategories` returns sorted distinct values.

## Acceptance criteria
- [ ] All gates green.
- [ ] `src/lib/db/index.ts` re-exports the three repos so consumers can `import { cardsRepo, decksRepo, notesRepo } from '@/lib/db'`.

## Session log

**Status:** complete
**Files changed:**
- `src/types/index.ts` — added `CardImportance` and `Card` types
- `src/lib/db/cardsRepo.ts` — created with `cardsRepo` object (create, get, list, listCategories, update, setBookmarked, delete)
- `src/lib/db/index.ts` — re-exports `cardsRepo` alongside `decksRepo` and `notesRepo`
- `__tests__/lib/db/cardsRepo.test.ts` — 12 tests covering all CRUD + filter + toggle scenarios

**Public interfaces added/modified:**
```ts
// src/types/index.ts
export type CardImportance = 1 | 2 | 3 | 4 | 5;
export type Card = { id, noteId, deckId, title, summary, body, tags, category, importance, accent, bookmarked, createdAt, updatedAt };

// src/lib/db/cardsRepo.ts
export type CreateCardInput = { noteId, deckId?, title, summary, body, tags, category, importance, accent };
export type CardFilter = { deckId?, category?, bookmarked? };
export const cardsRepo = { create, get, list, listCategories, update, setBookmarked, delete };

// src/lib/db/index.ts
export { decksRepo, notesRepo, cardsRepo } from './...';
```

**Decisions made:**
- Followed same pattern as `decksRepo`/`notesRepo`: Row type, rowToCard mapper, object literal with arrow functions.
- `tags` serialized via `JSON.stringify`/`JSON.parse` through `tags_json` column.
- `bookmarked` stored as integer 0/1, mapped to boolean.
- `list` builds WHERE clause dynamically with parameterized values.
- `listCategories` uses `SELECT DISTINCT category ... ORDER BY category ASC`.
- `update` accepts any subset of mutable fields, bumps `updatedAt`, re-serializes tags.

**Gotchas discovered:**
- The mock SQLite (`better-sqlite3` in `:memory:` mode) enforces foreign key constraints. Tests that insert cards with a `deckId` must create a deck first, otherwise `FOREIGN KEY constraint failed`.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 21 suites, 126 tests passed

**Lint result:**
- Command: `npm run lint`
- Exit: 0 (0 errors, 5 pre-existing warnings from jest.setup.ts and test setup requires)

**Typecheck result:**
- Command: `npm run typecheck`
- Exit: 0
