# Feature 05 — Card library (My Notes)

## Spec

### Goal
Replace the placeholder `app/index.tsx` with the "My Notes" home screen from `whispnoteai.png`: serif "My Notes" header, recent/bookmarked tabs, category filter chips, and a flowing grid of cards sized by importance.

### Acceptance criteria
- `/` route renders all cards from `cardsRepo.list()` filtered by tab + active category chip.
- Cards displayed as a masonry-ish two-column grid where importance affects card size (sm | md | lg) and visually echoes the cream/sage/lavender/peach palette.
- Tabs: "Recent" (all), "Bookmarked".
- Chip row: distinct categories from `cardsRepo.listCategories()` + an "All" chip; tap toggles active.
- Tap a card → `/card/[id]`.
- Existing index test still asserts something exists (regression).

### Out of scope
- Search.
- Sort options beyond default updated_at desc.

### Dependencies
- Features 00, 01, 08, 04 (cards data).

### Stories
1. `01-cards-query-hook` — `useCards` hook with filters.
2. `02-library-screen` — `app/index.tsx` rewrite with header + tabs + chips + grid + card tap.

## Summary

Shipped the My Notes home screen and the data hooks behind it. The placeholder index is gone — `/` is now the real library.

- `useCards(filter?)` and `useCategories()` hooks in `src/features/library/` wrap `cardsRepo.list` / `cardsRepo.listCategories` via TanStack Query (queryKeys `['cards', filter ?? {}]` and `['cards-categories']`).
- `CardTile` (`src/features/library/CardTile.tsx`) is the reusable tile: importance maps to size (1–2 sm, 3 md, 4–5 lg), surfaces title + truncated summary + category eyebrow + bookmark dot.
- `app/index.tsx` rewritten: display "My Notes" header with today's date, Recent/Bookmarked tabs (filter Chip pair), horizontal category chip row driven by `useCategories`, two-column masonry-ish grid (index parity → left/right column), peach "Record a note" button → `/record`, handwritten empty state.
- Test infra unchanged — only mocks added were per-test mocks of the new hooks. 39 suites, 246 tests at feature close.

Cards tap into `/card/[id]`, which is feature 06.
