# Story 06: `/design` showcase route

**Tier:** flash

## Goal
Add a hidden Expo Router route at `app/design.tsx` that renders every primitive in every variant, used for visual QA in dev. Verified by a render test that asserts the page mounts without throwing.

## Context
Closes feature 01. The route is unlinked (no nav from `app/index.tsx`) — accessed manually via the dev URL `whispnoteai://design` or by typing `/design` in the dev menu.

## Files in scope
- `app/design.tsx` — create
- `__tests__/app/design.test.tsx` — create

## Do not touch
- `app/index.tsx`, `app/_layout.tsx`
- `src/components/**` — primitives are settled
- All config files

## Interface contracts

`app/design.tsx`:
- Default export is a React component that uses `<Screen scroll>` and renders sections (one per primitive) using existing primitives.
- Sections (use `<Text variant="eyebrow">` as section heading):
  - **TYPOGRAPHY** — one of each Text variant (`display`, `title`, `body`, `eyebrow`, `handwritten`) and one body in each color (`ink`, `inkMuted`).
  - **CARDS** — one Card per accent (`surface`, `sage`, `lavender`, `peach`, `cream`) and one bordered. Each contains a `<Text variant="title">` and a `<Text variant="body" color="inkMuted">`.
  - **BUTTONS** — primary/ghost/accent in sm/md/lg, plus a `loading` and a `fullWidth`.
  - **CHIPS** — filter selected/unselected, tags in each accent.
  - **ICON BUTTONS** — plain/filled/accent in sm/md/lg. Use `<Text>•</Text>` as the inner node since no icon library is set up yet.

`__tests__/app/design.test.tsx`:
- Renders the design route inside `<AppProviders>`.
- Asserts no error thrown.
- Asserts the page contains the literal text "TYPOGRAPHY" (eyebrow heading).

## Implementation notes
- The page is intentionally long. Use simple `<View>` spacing between sections (`marginBottom: theme.spacing(8)`).
- No animations, no navigation links — purely a static showcase.
- Don't add this to a tab bar; the route remains accessible only by URL.

## Acceptance criteria
- [ ] `npm test` exits 0 — the showcase mounts and contains "TYPOGRAPHY".
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] No edits to files outside "Files in scope".

## Session log

**Status:** complete
**Files changed:**
- `app/design.tsx` — created showcase route with 5 sections (TYPOGRAPHY, CARDS, BUTTONS, CHIPS, ICON BUTTONS)
- `__tests__/app/design.test.tsx` — created render test asserting mount succeeds and "TYPOGRAPHY" heading is present

**Public interfaces added/modified:**
- `app/design.tsx` — default export `<DesignShowcase />` component

**Decisions made:**
- Used a local `Section` helper component for consistent section spacing with `<Text variant="eyebrow">` headings and `marginBottom: spacing(8)`.
- Used a local `Row` helper for horizontal wrapping layouts with `gap` support.
- Cards are stacked vertically with `spacing(2)` separators between each card instance.

**Gotchas discovered:**
- None.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 11 suites passed, 54 tests passed

- Command: `npm run lint`
- Exit: 0
- Output summary: 0 errors, 3 warnings (pre-existing in `jest.setup.ts`)

- Command: `npm run typecheck`
- Exit: 0
