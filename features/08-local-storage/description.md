# Feature 08 — Local storage

## Spec

### Goal
SQLite schema (via `expo-sqlite`) + typed repositories for `notes`, `cards`, `decks`. All app data is local; no backend.

### Acceptance criteria
- `src/lib/db/index.ts` exposes `getDb()` returning a singleton `expo-sqlite` instance.
- Migrations run on first access, idempotent on subsequent calls.
- Tables:
  - `decks(id, name, accent, created_at, updated_at)`
  - `notes(id, audio_uri, transcript, duration_ms, created_at)` — raw note record (audio + transcript before AI)
  - `cards(id, note_id, deck_id, title, summary, body, tags_json, category, importance, accent, bookmarked, created_at, updated_at)`
- Typed repositories: `decksRepo`, `notesRepo`, `cardsRepo`. Each with CRUD + listing methods.
- All public repo methods return Promises and use parameterized SQL (no string concat).
- `__tests__/lib/db/*` covers each repo's CRUD round-trip.

### Out of scope
- Sync, encryption beyond what SQLite provides, full-text search.

### Dependencies
- Feature 00. Independent of others.

### Stories
1. `01-db-init-and-migrations` — `expo-sqlite` singleton + migration runner + first migration creating all 3 tables.
2. `02-decks-repo` — typed `decksRepo` with create/list/update/delete + tests.
3. `03-notes-repo` — typed `notesRepo` with create/get/list/delete + tests.
4. `04-cards-repo` — typed `cardsRepo` with create/get/list/update/delete + filtering by deck/category/bookmarked + tests.

## Summary (shipped)

`expo-sqlite` singleton + idempotent migrations + 3 typed repos (`decksRepo`, `notesRepo`, `cardsRepo`). Test environment runs real SQL via `better-sqlite3` in-memory backing the `expo-sqlite` mock — every CRUD test exercises actual SQL. FK cascades (`cards.note_id`) and SET NULL (`cards.deck_id`) enforced. `tags` stored as JSON string column, deserialized at the repo boundary.
