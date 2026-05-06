# Feature 07 — Deck management

## Spec

### Goal
Decks tab/screen for browsing and managing decks: list, rename, change accent, delete (with cards reassigned to null deck via SET NULL FK).

### Acceptance criteria
- `/decks` route showing all decks as colorful cards with the deck name + a card count.
- Tap a deck → drills into `/deck/[id]` route showing its cards (filter applied).
- "Edit" affordance on each deck → modal/sheet to rename + change accent.
- Delete with confirmation prompt.
- All gates green.

### Out of scope
- Drag-and-drop reordering.
- Sharing.

### Dependencies
- Features 00, 01, 08.

### Stories
1. `01-decks-list-screen` — `/decks` route with deck cards + count + tap-through.
2. `02-deck-detail-screen` — `/deck/[id]` lists cards in that deck.
3. `03-deck-edit-and-delete` — edit sheet + delete confirmation.

## Summary (shipped)

`/decks` 2-column grid with `useDecksWithCount`. `/deck/[id]` detail with `useDeckWithCards`, missing-deck state, edit IconButton header. `DeckEditSheet` Modal for rename + accent change + delete (Alert.alert confirm). Edit IconButton uses "..." text since no icon library is present. After delete, `router.replace('/decks')`.
