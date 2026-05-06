# Story 02: `/deck/[id]` detail screen

**Tier:** flash

## Goal
Per-deck screen listing the deck's cards in a vertical list, with the deck's accent color as the header.

## Files in scope
- `app/deck/[id].tsx` — create
- `src/features/decks/useDeckWithCards.ts` — create
- `__tests__/app/deck-detail.test.tsx` — create

## Do not touch
- Other primitives, db, settings, ai, recording, decks list (settled in story 01)

## Interface contracts

```ts
// src/features/decks/useDeckWithCards.ts
export function useDeckWithCards(deckId: string | undefined): {
  deck: Deck | null | undefined;
  cards: Card[] | undefined;
  isLoading: boolean;
};
```
- Two parallel queries: `decksRepo.get(deckId)` and `cardsRepo.list({ deckId })`.
- Returns `deck: null` if the id doesn't exist.

`app/deck/[id].tsx`:
- Reads `useLocalSearchParams<{ id: string }>()` from `expo-router`.
- `<Screen scroll>` with header: `<Text variant="display">{deck?.name ?? '...'}</Text>` and an eyebrow `{cards.length} cards`.
- For each card: a `<Pressable>` wrapping `<Card accent={card.accent} size="md">` showing `<Text variant="title">{title}</Text>` + `<Text variant="body" color="inkMuted">{summary}</Text>`. Tap → `router.push('/card/' + card.id)`.
- Empty state: handwritten "No cards in this deck yet."
- Deck-not-found: render a card with "This deck no longer exists." and a Button back.

## Tests
- Mocks `useLocalSearchParams` to return `{ id: 'd1' }`.
- Mocks `decksRepo.get` + `cardsRepo.list` via `useDeckWithCards` mock.
- Asserts deck name appears, all cards rendered.
- Empty cards list shows the empty state.
- Missing deck shows "This deck no longer exists."

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete

**Files changed:**
- `src/features/decks/useDeckWithCards.ts` — created; parallel queries for deck + cards via React Query
- `app/deck/[id].tsx` — created; deck detail screen with header, card list, empty state, not-found state
- `__tests__/app/deck-detail.test.tsx` — created; 6 tests covering render, navigation, empty, not-found

**Public interfaces added/modified:**
- `useDeckWithCards(deckId: string | undefined): { deck: Deck | null | undefined; cards: Card[] | undefined; isLoading: boolean }`

**Decisions made:**
- Used two separate `useQuery` calls (parallel) rather than a single combined query, matching the story spec of "two parallel queries" and keeping cache granularity per entity type.
- Disabled queries when `deckId` is undefined (type-safe for when `useLocalSearchParams` returns undefined on first render in Expo Router).

**Gotchas discovered:**
- `useLocalSearchParams` can return `undefined` for param values before the route is fully resolved — the hook handles this gracefully via `enabled: !!deckId`.
- `@/` alias resolves to `app/*` in addition to `src/*` (per tsconfig `paths`), so `@/lib/db` works from both `app/` and `src/` files.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 35 suites, 220 tests, all passed

**Validation:**
- `npm run lint`: 0 errors, 11 warnings (all pre-existing, none from this story)
- `npm run typecheck`: exit 0 (clean)
