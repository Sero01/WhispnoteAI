# Feature 06 — Card detail

## Spec

### Goal
Build the `/card/[id]` route the library and deck-detail screens already link to. Show the full card content (title, summary, body, tags, deck, category, importance) and let the user toggle bookmark, delete the card, or move it to a different deck.

### Acceptance criteria
- `/card/[id]` renders the card from `cardsRepo.get(id)`:
  - Header: title (`<Text variant="display">`), eyebrow with category + importance, handwritten "in {deck.name}" line (or "unfiled" when `deckId === null`).
  - Body: markdown text rendered as paragraph-split body (split on blank lines, render each as `<Text variant="body">`). No external markdown lib.
  - Tag row: `<Chip variant="tag">` per tag.
  - Summary surfaced once near the top under the header in `<Text variant="handwritten" color="inkMuted">`.
- Bookmark toggle (`IconButton`, accessibilityLabel "Toggle bookmark") flips `bookmarked` via `cardsRepo.setBookmarked` and refreshes the query. Filled vs. plain reflects state.
- Delete (`IconButton` "Delete card") triggers `Alert.alert` confirm; on confirm calls `cardsRepo.delete` and `router.replace('/')`.
- Move-to-deck: tapping the "in {deck.name}" line opens a modal sheet showing every existing deck plus an "Unfiled" option. Choosing one writes via `cardsRepo.update(id, { deckId })` and closes.
- Missing-card state: when `cardsRepo.get` resolves null, render the same peach error Card pattern used in `/deck/[id]` ("This card no longer exists." + Back button).
- Tap a tag chip → no-op for now (out of scope).
- Library and deck-detail screens already navigate here; do not modify them.

### Out of scope
- Editing title/summary/body inline.
- Changing accent color or importance from this screen.
- Markdown rendering beyond paragraph splits (no headings, lists, bold, code).
- Replaying the original audio note.
- Tag-based filtering jump from a chip tap.

### Dependencies
- Feature 08 (cards repo, decks repo).
- Feature 01 (primitives, theme).

### Stories
1. `01-card-query-and-mutations` — `useCard(id)` hook + invalidation helpers; mutation wrappers are intentionally thin so the screen drives them directly.
2. `02-card-detail-screen` — `app/card/[id].tsx` with header, body, tags, bookmark + delete + missing-card state.
3. `03-move-to-deck-sheet` — modal sheet component + integration on the deck pill.

## Summary

Shipped the `/card/[id]` detail screen wired to the cards already linked from `/` and `/deck/[id]`.

- `useCard(id)` hook in `src/features/card-detail/useCard.ts` — TanStack Query wrapping `cardsRepo.get(id)` with key `['card', id]`, gated on `enabled: !!id`.
- `app/card/[id].tsx` — full screen: eyebrow (`category · importance N`), display title, bookmark + delete IconButtons, handwritten summary, deck pill ("in {deckName}" or "unfiled"), body paragraphs (split on `\n\n+`), tag chip row. Bookmark calls `cardsRepo.setBookmarked` + invalidates `['card', id]` and `['cards']`. Delete uses `Alert.alert` confirm → `cardsRepo.delete` + invalidates `['cards']` and `['decks-with-count']` → `router.replace('/')`. Missing-card state mirrors `/deck/[id]` (peach error Card + Back button). Loading state renders a centered eyebrow.
- `MoveToDeckSheet` in `src/features/card-detail/MoveToDeckSheet.tsx` — slide-up modal: "Unfiled" row + one row per deck (name + accent swatch), selection highlight, Cancel. Wired into the screen via the deck pill; `handleMove(deckId)` calls `cardsRepo.update(id, { deckId })` and invalidates `['card', id]`, `['cards']`, both old + new `['deck', ...]`, and `['decks-with-count']`.
- Tests: 42 suites, 260 tests at feature close. Story 03 implementer skipped appending its session log; orchestrator validated and appended on its behalf.

Notable conventions confirmed: `Text` `weight` enum is `'regular'|'medium'|'semibold'|'bold'` (not variant values); modal backdrop `rgba(0,0,0,0.3)` is the only inline color allowed and matches `DeckEditSheet`.
