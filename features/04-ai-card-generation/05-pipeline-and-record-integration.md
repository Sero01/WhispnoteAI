# Story 05: Pipeline + `/record` integration

**Tier:** pro

## Goal
Top-level pipeline: take a transcript and a noteId, produce a persisted `Card`. Wire into `/record` save flow with a "Conjuring..." overlay.

## Files in scope
- `src/lib/ai/pipeline.ts` — create
- `app/record.tsx` — modify
- `__tests__/lib/ai/pipeline.test.ts` — create
- `__tests__/app/record.test.tsx` — modify

## Do not touch
- Adapters, prompt, parse, factory, types, primitives, db — settled.

## Interface contracts

```ts
// src/lib/ai/pipeline.ts
import type { Card, CardDraft } from '@/types';

export async function generateCardFromTranscript(transcript: string): Promise<CardDraft>;
// Reads context from decksRepo.list() + cardsRepo.listCategories(), calls getActiveLLMClient(),
// invokes generateCard(). Throws if no client configured or API fails.

export async function saveCardFromDraft(noteId: string, draft: CardDraft): Promise<Card>;
// Resolves deck:
//   - if !draft.deck.isNew: tries decksRepo.getByName(draft.deck.name); falls back to creating one.
//   - if isNew: decksRepo.create({ name, accent: draft.deck.accent ?? 'sage' }) (using getByName first to dedupe).
// Inserts via cardsRepo.create({ noteId, deckId, ...draft fields, accent: draft.accent }).
// Returns the saved Card.

export async function transcribeAndPersist(noteId: string, transcript: string): Promise<Card>;
// Composes the two: generate then save. Errors propagate.
```

## `/record` change
- Track a `phase` state: `'recording' | 'saving' | 'conjuring' | 'idle'`.
- On Save press:
  1. set `phase = 'saving'`.
  2. await stop + transcript handling (existing flow).
  3. await `notesRepo.create` + optional `setTranscript`.
  4. If transcript non-empty AND a client is configured (check via `getActiveLLMClient()`): set `phase='conjuring'`, await `transcribeAndPersist(noteId, transcript)`. Catch errors gracefully: log + continue.
  5. `router.replace('/')`.
- Render a full-screen overlay when `phase === 'conjuring'`: dimmed background + `<Card accent="lavender"><Text variant="handwritten">Conjuring a card...</Text></Card>` centered.
- Errors are surfaced via a small toast-style `<Card accent="peach">` at the bottom for ~2.5s before navigating.

## Tests

`pipeline.test.ts`:
- `saveCardFromDraft` with `isNew: true` creates a new deck and uses its id.
- `saveCardFromDraft` with `isNew: false` matches an existing deck by name.
- `generateCardFromTranscript` reads decks + categories from repos and forwards them to the client.
- `transcribeAndPersist` end-to-end with mocked client returns a Card.

Mock `cardsRepo`, `decksRepo`, and `getActiveLLMClient` per test.

`record.test.tsx` adjustments:
- Save flow now also calls `transcribeAndPersist` when transcript and client exist (mock `getActiveLLMClient` to return a stub).
- "Conjuring" overlay appears during the AI call (assert via `findByText('Conjuring a card...')`).
- When client is null, save still completes without calling pipeline.

## Acceptance criteria
- [ ] All gates green.
- [ ] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `src/lib/ai/pipeline.ts` — created: `generateCardFromTranscript`, `saveCardFromDraft`, `transcribeAndPersist`
- `app/record.tsx` — added `phase` state, conjuring overlay, error toast, LLM client check in save flow
- `__tests__/lib/ai/pipeline.test.ts` — created: 8 tests covering all three exports
- `__tests__/app/record.test.tsx` — added `transcribeAndPersist` + `getActiveLLMClient` mocks, 3 new tests for conjuring overlay and null-client branch

**Public interfaces added/modified:**
```ts
// src/lib/ai/pipeline.ts
export async function generateCardFromTranscript(transcript: string): Promise<CardDraft>;
export async function saveCardFromDraft(noteId: string, draft: CardDraft): Promise<Card>;
export async function transcribeAndPersist(noteId: string, transcript: string): Promise<Card>;
```

**Decisions made:**
- `saveCardFromDraft` always calls `getByName` first for deduplication regardless of `isNew` flag; if not found, creates a new deck. This matches the spec's intent for both branches.
- Record screen sets `phase='saving'` before the note create, then `phase='conjuring'` before the AI call. The conjuring overlay is a full-screen absolute-fill View with `rgba(31,27,22,0.5)` dim. Error toast auto-clears after 2500ms.
- Pipeline module imports `decksRepo`/`cardsRepo` directly from their individual files (not the barrel) to avoid circular dependencies with the repo mocks in tests.

**Gotchas discovered:**
- `require()` is needed in test files to lazy-load the pipeline module after mocks are installed — direct `import` at top level evaluates mocks before `jest.mock()` runs. This is the pre-existing pattern in the test suite.
- The conjuring overlay needed `StyleSheet.absoluteFill` to cover the entire screen including the safe area, since it lives inside the `<Screen>` component's padding.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 32 suites, 206 tests, all passed

**Lint result:**
- Command: `npm run lint`
- Exit: 0
- Output summary: 0 errors, 11 warnings (all pre-existing)

**Typecheck result:**
- Command: `npm run typecheck`
- Exit: 0
- Output summary: clean
