# Story 03: Move-to-deck sheet

**Tier:** flash

## Goal
Add the move-to-deck modal sheet wired to the deck pill set up in story 02. Users tap "in {deck.name}" → sheet shows every existing deck plus an "Unfiled" option → tap one → card's `deckId` updates and the sheet closes.

## Files in scope
- `src/features/card-detail/MoveToDeckSheet.tsx` — create
- `app/card/[id].tsx` — modify (mount the sheet, wire `onSelect`)
- `__tests__/features/card-detail/MoveToDeckSheet.test.tsx` — create
- `__tests__/app/card-detail.test.tsx` — extend (one new test for move-deck flow)

## Do not touch
- `src/features/card-detail/useCard.ts`
- Primitives, theme, db, library, decks-list screen.

## Interface contracts

```tsx
// src/features/card-detail/MoveToDeckSheet.tsx
type MoveToDeckSheetProps = {
  visible: boolean;
  currentDeckId: string | null;
  onClose(): void;
  onSelect(deckId: string | null): void;
};
export function MoveToDeckSheet(props: MoveToDeckSheetProps): React.ReactElement;
```

Behavior:
- Renders an RN `<Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>`.
- Loads decks via `useQuery(['decks'], () => decksRepo.list())` (matches existing key used elsewhere — DO NOT introduce a new key).
- Body: `<Card accent="surface" size="lg">` with `<Text variant="title">Move to deck</Text>` then a vertical list:
  - First row: "Unfiled" — `currentDeckId === null` shows it as selected (e.g. extra `bordered` Card or a chip-style accent).
  - Subsequent rows: one row per deck with the deck name and a small accent swatch (`<View style={{ width:12, height:12, borderRadius:6, backgroundColor: theme.colors.accent[deck.accent] }} />`). Selected when `deck.id === currentDeckId`.
- Each row is a `<Pressable>` that calls `onSelect(deckId | null)` then `onClose()`.
- Bottom: `<Button variant="ghost" label="Cancel" onPress={onClose} />`.

### Integration in `app/card/[id].tsx`
- Import `MoveToDeckSheet`.
- Pass the existing `moveSheetVisible` state, `card.deckId`, an `onClose` setter, and an `onSelect` handler:
  ```ts
  async function handleMove(deckId: string | null) {
    await cardsRepo.update(card.id, { deckId });
    queryClient.invalidateQueries({ queryKey: ['card', card.id] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['deck', card.deckId] });
    if (deckId) queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    queryClient.invalidateQueries({ queryKey: ['decks-with-count'] });
  }
  ```

## Implementation notes
- Mirror the look/feel of `DeckEditSheet` in `src/features/decks/DeckEditSheet.tsx` (modal style, layout, padding) but simpler — no form fields, just rows.
- Use `<Text>` from `@/components`, theme tokens, no inline hex.

## Tests

`MoveToDeckSheet.test.tsx`:
- Mock `@/lib/db` so `decksRepo.list` returns 2 decks.
- Render with `visible={true}, currentDeckId={null}, onClose, onSelect`.
- Renders "Unfiled" + both deck names.
- Tap "Unfiled" → onSelect called with null, onClose called.
- Tap deck row → onSelect called with that deck.id, onClose called.
- Cancel → onClose called.

Extend `__tests__/app/card-detail.test.tsx`:
- Mock `decksRepo.list`, `cardsRepo.update`.
- Tap deck pill → sheet opens (assert "Move to deck" text visible).
- Tap a deck row → `cardsRepo.update` called with `{ deckId: <selected> }`.

## Acceptance criteria
- [ ] `npm test` exits 0
- [ ] `npm run lint` no new errors
- [ ] `npm run typecheck` clean
- [ ] No edits outside scope

## Session log

**Status:** complete
**Files changed:**
- `src/features/card-detail/MoveToDeckSheet.tsx` — created modal sheet with Unfiled + per-deck rows, accent swatches, selection indicator, Cancel
- `app/card/[id].tsx` — renamed `_moveSheetVisible` → `moveSheetVisible`, added `handleMove` (cardsRepo.update + 5 query invalidations), mounted `<MoveToDeckSheet>` inside the card branch
- `__tests__/features/card-detail/MoveToDeckSheet.test.tsx` — created 4 tests (render, Unfiled, deck row, Cancel)
- `__tests__/app/card-detail.test.tsx` — added `decksRepo.list` + `cardsRepo.update` mocks + test for pill → sheet → row → update flow

**Public interfaces added/modified:**
- `MoveToDeckSheet({ visible, currentDeckId, onClose, onSelect }): React.ReactElement`

**Decisions made:**
- Used `weight="regular"` (not `'body'`) for non-selected rows after typecheck flagged invalid weight value — `Text` weight enum is `'regular'|'medium'|'semibold'|'bold'`.

**Gotchas discovered:**
- `Text` weight is independent of variant; `'body'` is a variant value, not a weight value.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 42 suites, 260 tests passed (story added 5 tests).
- `npm run lint`: 0 errors, 12 pre-existing warnings.
- `npm run typecheck`: clean.

(Session log appended by orchestrator — implementer completed the work but did not append the log itself.)
