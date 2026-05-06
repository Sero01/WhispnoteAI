# Story 01: `useCard` hook

**Tier:** flash

## Goal
TanStack Query hook to fetch a single card by id. The screen will call mutations directly (`cardsRepo.setBookmarked`, `cardsRepo.update`, `cardsRepo.delete`) and invalidate manually — keep this hook tiny.

## Files in scope
- `src/features/card-detail/useCard.ts` — create
- `__tests__/features/card-detail/useCard.test.tsx` — create

## Do not touch
- All other files

## Interface contracts

```ts
// src/features/card-detail/useCard.ts
import type { Card } from '@/types';
export function useCard(id: string | undefined): {
  data: Card | null | undefined;
  isLoading: boolean;
  refetch(): void;
};
```
- queryKey: `['card', id]`. queryFn: `cardsRepo.get(id)`.
- `enabled: !!id` so the hook is safe before the route param resolves.

## Implementation notes
- Mirror the pattern of `src/features/library/useCards.ts`.
- `cardsRepo.get` returns `Card | null`; preserve null in the hook return.

## Tests
- Mock `@/lib/db` and assert `cardsRepo.get` is called with the id.
- Returns the card from the mocked repo.
- When id is undefined, the query is disabled (no repo call, isLoading stays false / data undefined).

## Acceptance criteria
- [ ] `npm test` exits 0
- [ ] `npm run lint` no new errors
- [ ] `npm run typecheck` clean
- [ ] No edits outside scope

## Session log

**Status:** complete
**Files changed:**
- `src/features/card-detail/useCard.ts` — created
- `__tests__/features/card-detail/useCard.test.tsx` — created

**Public interfaces added/modified:**
- `export function useCard(id: string | undefined): { data: Card | null | undefined; isLoading: boolean; refetch(): void }`

**Decisions made:**
- Used `enabled: !!id` so the query is gated on a resolved id (matches spec).
- Used `id!` non-null assertion in queryFn since `enabled` guarantees id is defined when called.
- Imported `Card` type despite the spec showing the import — not strictly needed since the return is inferred, but included for documentation clarity.

**Gotchas discovered:**
- None

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 40 suites, 249 tests, all passed. New test file contributed 3 tests.
- Also verified: `npm run lint` — 0 errors (12 pre-existing warnings), `npm run typecheck` — clean.
