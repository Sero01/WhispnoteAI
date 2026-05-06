# Story 01: `/decks` list screen

**Tier:** flash

## Goal
Decks list as a 2-column grid of colorful `<Card accent={accent}>` tiles. Each shows deck name + count of cards. Tap navigates to `/deck/[id]`.

## Files in scope
- `app/decks.tsx` — create
- `src/features/decks/useDecksWithCount.ts` — create (TanStack Query hook returning decks + count)
- `__tests__/app/decks.test.tsx` — create
- `__tests__/features/decks/useDecksWithCount.test.tsx` — create

## Do not touch
- Other routes, repos, primitives.

## Interface contracts

```ts
// src/features/decks/useDecksWithCount.ts
import type { Deck } from '@/types';
export type DeckWithCount = Deck & { cardCount: number };
export function useDecksWithCount(): {
  data: DeckWithCount[] | undefined;
  isLoading: boolean;
  refetch: () => void;
};
```
- Uses `useQuery({ queryKey: ['decks-with-count'], queryFn })`.
- queryFn: parallel `decksRepo.list()` and a tally derived from `cardsRepo.list()` grouped by deckId. (Could also be a per-deck `cardsRepo.list({ deckId }).then(r => r.length)` — pick whichever is simpler.)

`app/decks.tsx`:
- `<Screen scroll>` with `<Text variant="display">Decks</Text>` and a 2-column grid.
- Empty state: `<Text variant="handwritten">No decks yet — record your first note.</Text>`
- Each tile is a `<Pressable>` wrapping `<Card accent={deck.accent} size="md">` containing `<Text variant="title">{deck.name}</Text>` + `<Text variant="body" color="inkMuted">{cardCount} {cardCount === 1 ? 'card' : 'cards'}</Text>`.
- Tap → `router.push('/deck/' + deck.id)`.

## Tests
- `useDecksWithCount` returns aggregated counts (mock both repos).
- `decks.tsx` renders all decks with their counts and accents.
- Empty list shows the empty state.
- Tap on a tile calls `router.push`.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/features/decks/useDecksWithCount.ts` — create: TanStack Query hook returning `DeckWithCount[]` with aggregated card counts
- `app/decks.tsx` — create: 2-column grid of `<Card accent={accent}>` tiles with deck name + card count, empty state, tap navigation
- `__tests__/features/decks/useDecksWithCount.test.tsx` — create: tests for counts, empty, loading
- `__tests__/app/decks.test.tsx` — create: tests for rendering, empty state, tap navigation

**Public interfaces added/modified:**
- `src/features/decks/useDecksWithCount.ts` — `useDecksWithCount(): { data: DeckWithCount[] | undefined; isLoading: boolean; refetch: () => void }`
- `app/decks.tsx` — `DecksScreen` (default export)

**Decisions made:**
- Used parallel `decksRepo.list()` + `cardsRepo.list()` and grouped by `deckId` client-side instead of per-deck queries (single round-trip, simpler).
- Used 47% width with `flexWrap` for the 2-column grid instead of a FlatList (cleaner for a simple static grid).

**Gotchas discovered:**
- The lint rule `react/display-name` flags anonymous function returns; had to use a named `Wrapper` component in the `createWrapper()` helper for hook tests.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 34 suites, 214 tests passed

- Command: `npm run lint`
- Exit: 0 (0 errors, 11 pre-existing warnings)

- Command: `npm run typecheck`
- Exit: 0
