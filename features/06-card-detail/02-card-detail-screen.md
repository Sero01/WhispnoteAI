# Story 02: Card detail screen

**Tier:** pro

## Goal
Build `app/card/[id].tsx`. Render the card, support bookmark toggle and delete, and show a missing-card state when the id is unknown. Move-to-deck is added in story 03 — leave a stable hook for it (the deck pill should be a `Pressable` whose `onPress` is a TODO no-op for now, or wired to a local `setMoveSheetVisible` that story 03 will wire to a real component).

## Files in scope
- `app/card/[id].tsx` — create
- `__tests__/app/card-detail.test.tsx` — create

## Do not touch
- Hooks (settled in story 01)
- Primitives, theme, db, ai, recording, decks, library.
- `app/index.tsx`, `app/deck/[id].tsx` — they already navigate here; leave them alone.

## Interface contracts

`app/card/[id].tsx` is a default-exported screen. Route params: `{ id: string }` via `useLocalSearchParams`.

Layout (top to bottom inside `<Screen scroll padding="md">`):

1. `<Stack.Screen options={{ headerShown: false }} />`
2. Header row:
   - Left column (`flex: 1`): `<Text variant="eyebrow" color="inkMuted">{category} · importance {importance}</Text>` then `<Text variant="display">{title}</Text>`.
   - Right column: bookmark `IconButton` (`variant="filled"` when bookmarked, `variant="plain"` otherwise; `accessibilityLabel="Toggle bookmark"`). Below it the delete `IconButton` (`variant="plain"`, `accessibilityLabel="Delete card"`).
3. `<Text variant="handwritten" color="inkMuted">{summary}</Text>`
4. Deck pill: a `<Pressable onPress={() => setMoveSheetVisible(true)}>` containing `<Text variant="eyebrow" color="inkMuted">in {deckName}</Text>` where `deckName` is the resolved deck name or `"unfiled"` when `card.deckId === null`. (Story 03 will mount the sheet here; for now the press handler can call a `setMoveSheetVisible` setter that does nothing visible — keep the state hook in place.)
5. Body paragraphs: split `card.body` on `/\n\n+/`, trim each, drop empties, render each as `<Text variant="body">`. Wrap in a `<View style={{ gap: theme.spacing(3) }}>`.
6. Tag row: `<Chip variant="tag" label={tag} />` per tag, wrapped in a flex-row with `flexWrap: 'wrap'`, gap from theme.

Missing-card state (when `data === null`): same peach error Card pattern as `/deck/[id]`:
```tsx
<Card accent="peach" size="md" style={{ alignItems: 'center', gap: theme.spacing(3), width: '100%' }}>
  <Text variant="title" align="center">This card no longer exists.</Text>
  <Button label="Back" variant="primary" onPress={() => router.back()} />
</Card>
```

Loading state (data === undefined && isLoading): render nothing or a centered eyebrow "Loading…" — your call, keep it minimal.

### Resolving the deck name

Use `useQuery(['deck', card.deckId], () => decksRepo.get(card.deckId!))` with `enabled: !!card?.deckId`. If `data` is null/undefined or `card.deckId` is null, fall back to `'unfiled'`.

### Mutations
- Bookmark toggle handler:
  ```ts
  await cardsRepo.setBookmarked(card.id, !card.bookmarked);
  queryClient.invalidateQueries({ queryKey: ['card', card.id] });
  queryClient.invalidateQueries({ queryKey: ['cards'] });
  ```
- Delete handler: `Alert.alert('Delete card?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: doDelete }])`. `doDelete` calls `cardsRepo.delete(card.id)`, invalidates `['cards']` and `['decks-with-count']`, then `router.replace('/')`.

## Implementation notes
- Reuse the structure of `app/deck/[id].tsx` (header layout, missing-state Card, IconButtons).
- All colors via theme tokens / accent props — no inline hex.
- Use `<Text>` from `@/components`, never RN `Text`.
- The bookmark IconButton's child can be a `<Text variant="body">★</Text>` (filled-state) or `<Text>☆</Text>` (plain). Don't reach for vector icons here.
- Delete IconButton child can be a `<Text>×</Text>` for now.
- For the move-to-deck pill in this story: include a `useState` for `moveSheetVisible`, expose `setMoveSheetVisible`, but no visible sheet yet. Story 03 will mount the sheet under the screen tree.

## Tests

`__tests__/app/card-detail.test.tsx` should:
- Mock `expo-router`'s `useRouter`, `useLocalSearchParams` (return `{ id: 'card-1' }`), and `Stack.Screen`.
- Mock `@/features/card-detail/useCard` to return a fixed card.
- Mock `@/lib/db` (`cardsRepo.setBookmarked`, `cardsRepo.delete`, `decksRepo.get`).
- Mock `react-native`'s `Alert.alert` to invoke the destructive button immediately when triggered.
- Cover:
  1. Renders title, summary, category, importance, body paragraphs, tags.
  2. Renders "in {deckName}" when deck is resolved; "in unfiled" when `deckId` is null.
  3. Tapping the bookmark IconButton calls `cardsRepo.setBookmarked(id, !bookmarked)`.
  4. Tapping delete + confirming calls `cardsRepo.delete(id)` and `router.replace('/')`.
  5. Missing-card state: when `useCard` returns `data: null, isLoading: false`, "This card no longer exists." renders and Back button calls `router.back()`.

## Acceptance criteria
- [ ] `npm test` exits 0
- [ ] `npm run lint` no new errors
- [ ] `npm run typecheck` clean
- [ ] No edits outside scope

## Session log

**Status:** complete
**Files changed:**
- `app/card/[id].tsx` — created CardDetailScreen with card rendering, bookmark toggle, delete with Alert confirm, deck pill placeholder, and loading/missing-card states
- `__tests__/app/card-detail.test.tsx` — created 6 tests covering all acceptance criteria

**Public interfaces added/modified:**
- `app/card/[id].tsx` — default exported screen, route param `{ id: string }`

**Decisions made:**
- Used `_moveSheetVisible` prefix to satisfy ESLint `no-unused-vars` while keeping `setMoveSheetVisible` exposed for story 03
- Extracted mock repos via `jest.requireMock('@/lib/db')` pattern (standard for this codebase) to avoid Jest hoisting issues with `const` references in `jest.mock` factories
- Used `jest.spyOn(Alert, 'alert')` with `AlertButton[]` type import instead of mocking entire `react-native` module (which conflicted with built-in RN Jest mocks)

**Gotchas discovered:**
- Direct `jest.mock('react-native', ...)` with `jest.requireActual` conflicts with React Native's built-in Jest mocks and causes `react-native-css-interop` resolution errors
- `const` variables declared after `jest.mock` calls CAN be referenced in mock factories but the convention in this codebase is to use `jest.requireMock` to extract them — using `const` references directly caused `is not a function` errors at runtime

**Deferred work:**
- Story 03 (`06-card-detail/03-move-to-deck-sheet`) will mount the `MoveToDeckSheet` component when `setMoveSheetVisible(true)` is called

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 41 suites, 255 tests, all passed. New test file contributed 6 tests.
- Also verified: `npm run lint` — 0 errors (12 pre-existing warnings), `npm run typecheck` — clean.
