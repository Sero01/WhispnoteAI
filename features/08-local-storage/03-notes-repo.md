# Story 03: `notesRepo`

**Tier:** flash

## Goal
Typed repository for raw `notes` (audio + transcript before AI). Cards reference notes via `note_id`.

## Files in scope
- `src/lib/db/notesRepo.ts` — create
- `src/types/index.ts` — modify (add `Note` type)
- `__tests__/lib/db/notesRepo.test.ts` — create

## Do not touch
- `src/lib/db/index.ts`, `migrations.ts`, `decksRepo.ts` — settled

## Interface contracts

```ts
// src/types/index.ts (add)
export type Note = {
  id: string;
  audioUri: string;
  transcript: string | null;
  durationMs: number;
  createdAt: number;
};

// src/lib/db/notesRepo.ts
export const notesRepo = {
  async create(input: { audioUri: string; durationMs: number; transcript?: string | null }): Promise<Note>,
  async setTranscript(id: string, transcript: string): Promise<Note>,
  async get(id: string): Promise<Note | null>,
  async list(): Promise<Note[]>,             // ordered by created_at desc
  async delete(id: string): Promise<void>,   // CASCADE removes related cards
};
```

## Implementation notes
- Mirror the patterns in `decksRepo.ts`.
- `create` accepts optional `transcript` (default null).
- `setTranscript` is a thin update that returns the updated row.
- Deleting a note cascades to its cards via the FK constraint.

## Tests
- `create` then `get` round-trip.
- `setTranscript` updates field.
- `list` ordered by `created_at desc`.
- `delete` removes the note.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/types/index.ts` — added `Note` type
- `src/lib/db/notesRepo.ts` — created with `create`, `setTranscript`, `get`, `list`, `delete`
- `__tests__/lib/db/notesRepo.test.ts` — 8 tests covering round-trip, transcripts, ordering, delete, edge cases

**Public interfaces added/modified:**
- `export type Note = { id: string; audioUri: string; transcript: string | null; durationMs: number; createdAt: number }`
- `export const notesRepo = { create, setTranscript, get, list, delete }` — signatures match spec verbatim

**Decisions made:**
- `setTranscript` re-fetches the row after update to return full `Note` (mirrors `decksRepo.update` pattern)

**Gotchas discovered:**
- None.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 20 suites, 115 tests passed (includes 8 new notesRepo tests)
- `npm run lint` — 0 errors, 5 pre-existing warnings (none from new code)
- `npm run typecheck` — exit 0
