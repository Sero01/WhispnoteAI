# Story 01: `useCards` query hook

**Tier:** flash

## Goal
TanStack Query hook for cards with optional filter. Plus `useCategories` for the chip row.

## Files in scope
- `src/features/library/useCards.ts` — create
- `src/features/library/useCategories.ts` — create
- `__tests__/features/library/useCards.test.tsx` — create
- `__tests__/features/library/useCategories.test.tsx` — create

## Do not touch
- All other files

## Interface contracts

```ts
// src/features/library/useCards.ts
import type { CardFilter } from '@/lib/db/cardsRepo';
export function useCards(filter?: CardFilter): {
  data: Card[] | undefined;
  isLoading: boolean;
  refetch(): void;
};
```
- queryKey: `['cards', filter ?? {}]`. queryFn: `cardsRepo.list(filter)`.

```ts
// src/features/library/useCategories.ts
export function useCategories(): { data: string[] | undefined; isLoading: boolean };
```
- queryKey: `['cards-categories']`. queryFn: `cardsRepo.listCategories()`.

## Tests
- `useCards()` no filter returns all (mock repo).
- `useCards({ bookmarked: true })` passes filter to repo.
- `useCategories()` returns the list from the repo.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/features/library/useCards.ts` — created: TanStack Query hook wrapping `cardsRepo.list(filter)` with queryKey `['cards', filter ?? {}]`
- `src/features/library/useCategories.ts` — created: TanStack Query hook wrapping `cardsRepo.listCategories()` with queryKey `['cards-categories']`
- `__tests__/features/library/useCards.test.tsx` — created: tests for no-filter (returns all), filter pass-through, isLoading state
- `__tests__/features/library/useCategories.test.tsx` — created: tests for returns categories, isLoading state

**Public interfaces added/modified:**
- `useCards(filter?: CardFilter): { data: Card[] | undefined; isLoading: boolean; refetch(): void }` at `src/features/library/useCards.ts`
- `useCategories(): { data: string[] | undefined; isLoading: boolean }` at `src/features/library/useCategories.ts`

**Decisions made:**
- Followed existing pattern from `useDecksWithCount` / `useDeckWithCards`: import `useQuery` from `@tanstack/react-query`, call repo directly, return destructured properties.
- Test pattern matches existing hook tests: `jest.mock('@/lib/db')`, `createWrapper()` with `retry: false`, `renderHook` + `waitFor`.

**Gotchas discovered:**
- `src/features/library/` and `__tests__/features/library/` did not exist; both had to be created.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 38 suites, 232 tests passed (including 5 new tests across useCards and useCategories)
- Lint: 0 errors, 12 pre-existing warnings
- Typecheck: 0 errors
