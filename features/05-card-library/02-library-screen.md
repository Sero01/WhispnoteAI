# Story 02: My Notes home screen

**Tier:** pro

## Goal
Rewrite `app/index.tsx` to be the "My Notes" library screen from `whispnoteai.png`. Tabs (Recent / Bookmarked), category chip filter, masonry-ish 2-column grid sized by importance.

## Files in scope
- `app/index.tsx` — modify (full rewrite, but keep the route name)
- `src/features/library/CardTile.tsx` — create (the visual card-as-tile)
- `__tests__/app/index.test.tsx` — modify
- `__tests__/features/library/CardTile.test.tsx` — create

## Do not touch
- Hooks (settled in story 01)
- Primitives, theme, db, ai, recording, decks.

## Interface contracts

```tsx
// src/features/library/CardTile.tsx
type CardTileProps = { card: Card; onPress: () => void };
export function CardTile(props: CardTileProps): React.ReactElement;
```
- Wraps a `<Card accent={card.accent} size={importanceToSize(card.importance)}>` in a `<Pressable>`.
- Renders: `<Text variant="title">{card.title}</Text>`, then `<Text variant="body" color="inkMuted" numberOfLines={3}>{card.summary}</Text>`, then a small footer row with `<Text variant="eyebrow">{card.category}</Text>` and a bookmark dot when `card.bookmarked`.
- `importanceToSize`: 1–2 → 'sm', 3 → 'md', 4–5 → 'lg'.

`app/index.tsx`:
- `<Screen scroll>`.
- Header: `<Text variant="display">My Notes</Text>` + a small accent line below using `<Text variant="handwritten" color="inkMuted">{date.toLocaleDateString(...)}</Text>` (today's date).
- Tab row: two `<Chip variant="filter">` for "Recent" and "Bookmarked" — selected state binds to local state.
- Chip row: horizontal scroll (`<ScrollView horizontal>`) of `<Chip variant="filter">` — first chip is "All", then one per category from `useCategories`.
- Below: 2-column grid of `<CardTile>` flowing top-to-bottom, left-to-right. Use simple alternation (even index → left col, odd → right col) into two `<View>` columns to mimic masonry without a heavy dep. (Acceptable approximation.)
- "New note" `<Button variant="accent" accent="peach" size="lg" fullWidth label="Record a note">` near the bottom or pinned (your call — keep it visible). Pushes to `/record`.
- Empty state: handwritten "Your notes will appear here. Tap the mic to capture one."
- Cards: tap → `router.push('/card/' + card.id)`.

## Tests
- Renders "My Notes" heading.
- Renders all cards from mocked `useCards`.
- Switching to Bookmarked tab calls `useCards({ bookmarked: true })`.
- Tapping a category chip filters to that category (assert via mock).
- Tap on card → `router.push('/card/...')`.
- Empty state when `useCards` returns `[]`.
- "Record a note" Button → `/record`.

## Acceptance criteria
- [x] All gates green.
- [x] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `src/features/library/CardTile.tsx` — created: CardTile component wrapping Card in Pressable with title, summary, category eyebrow, bookmark dot, and importance-to-size mapping
- `app/index.tsx` — rewritten: My Notes home screen with tabs (Recent/Bookmarked), horizontal category chip row, two-column masonry grid of CardTile, Record a note button, empty state
- `__tests__/features/library/CardTile.test.tsx` — created: tests for title, summary, category, bookmark dot presence/absence, and onPress
- `__tests__/app/index.test.tsx` — rewritten: tests for heading, card rendering, tab switch filter, category chip filter (with getAllByText for duplicate text), card navigation, empty state (both [] and undefined), and Record button navigation

**Public interfaces added/modified:**
- `CardTile(props: { card: Card; onPress: () => void }): React.ReactElement` at `src/features/library/CardTile.tsx`
- `importanceToSize(importance: number): CardSize` at `src/features/library/CardTile.tsx` (module-private)

**Decisions made:**
- Two-column grid implemented via index parity split into left/right View columns (even → left, odd → right) per spec's "simple alternation" guidance
- Bookmark dot rendered as unicode `\u25CF` (●) in inkMuted color
- Time interval slightly smaller (20px top-level gap) for spacing control; Screen padding and card gaps follow project conventions
- `useCards` filter built conditionally: `bookmarked` tab adds `{ bookmarked: true }`, category chip adds `{ category }`, combined when both active
- Tests used `getAllByText('Idea')[0]` because "Idea" appears both as a category chip label and as a card eyebrow in mock data

**Gotchas discovered:**
- Screen test pattern must mock both `useCards` and `useCategories` hooks even for tests that only exercise card-related assertions, because the screen always calls `useCategories()` for the chip row

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 39 suites, 246 tests passed (15 new tests: 6 CardTile, 9 index screen)
- Lint: 0 errors, 12 pre-existing warnings (no new)
- Typecheck: 0 errors
