# Story 03: Deck edit + delete

**Tier:** flash

## Goal
"Edit" affordance on each deck → opens a sheet to rename + change accent. "Delete" with confirmation prompt; deletion sets `cards.deck_id = NULL` (FK SET NULL handles this).

## Files in scope
- `app/deck/[id].tsx` — modify (add edit + delete buttons)
- `src/features/decks/DeckEditSheet.tsx` — create
- `__tests__/app/deck-detail.test.tsx` — modify
- `__tests__/features/decks/DeckEditSheet.test.tsx` — create

## Do not touch
- Decks list, card detail, primitives, repos.

## Interface contracts

```tsx
// src/features/decks/DeckEditSheet.tsx
type Props = {
  deck: Deck;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: Deck) => void;
  onDeleted: (id: string) => void;
};
export function DeckEditSheet(props: Props): React.ReactElement;
```
- Renders a `Modal` (RN's built-in) with `transparent`, slide animation.
- Inside: `<Card accent="surface" size="lg">` with rename TextInput, accent picker (4 swatches: sage/lavender/peach/cream), Save Button (calls `decksRepo.update`), Delete Button (variant ghost) → opens `Alert.alert` confirm; on confirm calls `decksRepo.delete` + `onDeleted`.

`app/deck/[id].tsx` mod:
- Add `<IconButton accessibilityLabel="Edit deck">…</IconButton>` to the right of the header. Tap opens the sheet.
- After save, optimistically update state and refetch.
- After delete, `router.replace('/decks')`.

## Tests
- DeckEditSheet renders rename input prefilled.
- Selecting an accent swatch updates state.
- Save calls `decksRepo.update` with `{ name, accent }`.
- Delete confirms via `Alert.alert` mock and calls `decksRepo.delete` then `onDeleted`.
- deck-detail: tapping the Edit IconButton shows the sheet.
- deck-detail: after delete, `router.replace('/decks')` is called.

Mock `Alert.alert` with `jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1]?.onPress?.())` to auto-confirm.

## Acceptance criteria
- [x] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/features/decks/DeckEditSheet.tsx` — create: Modal sheet with rename TextInput, accent picker, Save/Delete buttons
- `app/deck/[id].tsx` — modify: add edit IconButton + DeckEditSheet integration with optimistic update and delete redirect
- `__tests__/features/decks/DeckEditSheet.test.tsx` — create: tests for render, save calling decksRepo.update, delete calling decksRepo.delete + onDeleted, Alert.alert confirm
- `__tests__/app/deck-detail.test.tsx` — modify: add tests for edit button showing sheet and router.replace('/decks') on delete

**Public interfaces added/modified:**
- `src/features/decks/DeckEditSheet.tsx` — `export function DeckEditSheet(props: Props): React.ReactElement` where `Props = { deck: Deck; visible: boolean; onClose: () => void; onSaved: (updated: Deck) => void; onDeleted: (id: string) => void }`

**Decisions made:**
- Used `localDeck` state for optimistic update + `queryClient.invalidateQueries` for refetch after save, matching story requirement
- Used `"..."` text for the edit IconButton since no icon library is present in the project (consistent with existing patterns)

**Gotchas discovered:**
- DeckEditSheet uses `useTheme()` so tests must render inside `AppProviders` (which includes `ThemeProvider`)
- Mock `require('@/components/Text')` inside `jest.mock` factory works fine with jest moduleNameMapper
- RN Modal content renders correctly in test environment with `transparent` + slide animation

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 36 suites passed, 227 tests passed
- Command: `npm run lint` — 0 errors, 12 warnings (all pre-existing)
- Command: `npm run typecheck` — 0 errors
