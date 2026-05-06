# Story 02: LLM adapter retry structure + remove redundant client guard

**Tier:** flash

## Goal

Make the retry logic in all three LLM adapters structurally correct (retriable detection separated from the throw, so the retry loop scales correctly if the count is bumped), and remove the redundant `getActiveLLMClient()` call in `app/record.tsx` so SecureStore is read once per save.

## Context

All three adapters share the same retry shape:

```ts
for (let attempt = 0; attempt < 2; attempt++) {
  try { ... return; }
  catch (err) {
    if (attempt === 0) {
      const isNetworkError = err instanceof TypeError;
      const isServerError = error.message.startsWith('<Provider> 5');
      if (isNetworkError || isServerError) continue;
    }
    throw error;
  }
}
throw lastError;
```

Today this works (loop bound is 2), but the inner `throw error` runs on attempt 1 unconditionally — so the trailing `throw lastError` is dead code, and the loop is broken if anyone ever raises the bound. We want a clean separation so the same code is correct at any retry count.

Separately, `app/record.tsx`'s `handleSave` calls `getActiveLLMClient()` purely as a guard, and then `transcribeAndPersist` calls it again. Two SecureStore reads per save, plus a TOCTOU window. The pipeline already throws `Error('No LLM client configured')` when the client is absent, so we can drop the guard and special-case that error.

## Files in scope
- `src/lib/ai/openai.ts` — modify (retry structure)
- `src/lib/ai/anthropic.ts` — modify (retry structure)
- `src/lib/ai/openrouter.ts` — modify (retry structure)
- `app/record.tsx` — modify (remove redundant `getActiveLLMClient`, special-case the "No LLM client configured" error)
- `__tests__/lib/ai/openai.test.ts` — modify (add a test asserting non-retriable second-attempt errors propagate)
- `__tests__/lib/ai/anthropic.test.ts` — modify (same)
- `__tests__/lib/ai/openrouter.test.ts` — modify (same)

## Do not touch
- `src/lib/ai/prompt.ts`, `parse.ts`, `factory.ts`, `pipeline.ts`, `types.ts`
- `src/features/recording/*`
- `src/features/transcription/*`
- Any other route under `app/`
- Mock setup in `jest.setup.ts`

## Interface contracts

### Retry structure (apply identically to all three adapters)

Replace the inner catch block so retriable detection is separate from the throw, and the loop body is well-defined for any `MAX_ATTEMPTS`:

```ts
const MAX_ATTEMPTS = 2;
let lastError: Error | null = null;

for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  try {
    // ... existing fetch + parse, returning on success ...
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    lastError = error;

    const isNetworkError = err instanceof TypeError;
    const isServerError = error.message.startsWith('<Provider> 5');
    const retriable = isNetworkError || isServerError;
    const hasMoreAttempts = attempt < MAX_ATTEMPTS - 1;

    if (retriable && hasMoreAttempts) continue;
    throw error;
  }
}

throw lastError ?? new Error('<Provider>: exhausted retries');
```

Where `<Provider>` is `OpenAI`, `Anthropic`, `OpenRouter` respectively (the existing `'OpenAI 5'`, `'Anthropic 5'`, `'OpenRouter 5'` prefixes are unchanged).

Public exports (`openaiClient`, `anthropicClient`, `openrouterClient`) and their HTTP behavior are unchanged. Default models, headers, body shape, error message format — all unchanged.

### `app/record.tsx` change

In `handleSave`:

1. Remove the call to `getActiveLLMClient()` and its associated `if (client)` branch.
2. Always set `phase` to `'conjuring'` before calling `transcribeAndPersist`, only when `transcript` is truthy (existing condition).
3. In the `catch` for the `transcribeAndPersist` call, if `err instanceof Error && err.message === 'No LLM client configured'`, do not set the error toast (silent skip, since the user explicitly hasn't configured a key — this is expected). For any other error, keep the existing behavior (set the error message + auto-clear after 2.5s).
4. Remove the `import { getActiveLLMClient } from '@/lib/ai/factory';` line — it is no longer used.

No other changes to `record.tsx`.

## Implementation notes

- Keep the existing fetch / parse code inside the `try` body verbatim. Only the catch block and the post-loop throw change.
- Do not add new helpers or constants beyond `MAX_ATTEMPTS` (local to each adapter is fine; do not export it).
- The `hasMoreAttempts` flag is what makes the structure correct at any `MAX_ATTEMPTS`.
- For the test additions: simulate a non-5xx HTTP error (e.g. 400) on the *second* fetch call by chaining mocks. With the new structure, attempt 0 (network error) retries, attempt 1 (400) throws immediately. The throw should surface as `Error('<Provider> 400: ...')` from the loop, not from `lastError`. A simple way to assert this is: call should reject with `/400/`, and `fetch` should have been called exactly twice.
- Do not add tests that exercise `record.tsx` directly (no test infra for that route exists; do not add it in this story).

## Acceptance criteria

- [x] All three adapters use the new retry structure with separated retriable detection.
- [x] `app/record.tsx` no longer imports `getActiveLLMClient`.
- [x] `app/record.tsx` silently skips card generation when the pipeline throws `'No LLM client configured'`; all other errors still surface as the existing toast.
- [x] New tests in each adapter test file: network error on attempt 0 → retried, 400 on attempt 1 → rejects with `/<Provider> 400/`, `fetch` called exactly 2 times.
- [x] All previously passing tests still pass.
- [x] `npm test` exits 0
- [x] `npm run typecheck` exits 0
- [x] No changes to files outside "Files in scope"

## Session log

**Status:** complete
**Files changed:**
- `src/lib/ai/openai.ts` — replaced retry block with `MAX_ATTEMPTS` + separated retriable detection using `hasMoreAttempts` + `throw lastError ?? new Error('OpenAI: exhausted retries')`
- `src/lib/ai/anthropic.ts` — same structural change with `Anthropic` prefix
- `src/lib/ai/openrouter.ts` — same structural change with `OpenRouter` prefix
- `app/record.tsx` — removed `getActiveLLMClient` import; removed guard block; always sets phase `'conjuring'` and calls `transcribeAndPersist`; silent-skip on `'No LLM client configured'` error
- `__tests__/lib/ai/openai.test.ts` — added test: network error retried, then 400 propagates, fetch called twice
- `__tests__/lib/ai/anthropic.test.ts` — same test for Anthropic
- `__tests__/lib/ai/openrouter.test.ts` — same test for OpenRouter
- `__tests__/app/record.test.tsx` — updated "when client is null" test: now expects `transcribeAndPersist` IS called and silently skips, instead of not being called at all

**Public interfaces added/modified:**
- None (all public exports unchanged)

**Decisions made:**
- None — followed spec verbatim

**Gotchas discovered:**
- The existing record.test.tsx test "when client is null, save completes without calling transcribeAndPersist" needed updating because the guard was removed — `transcribeAndPersist` is now always called (and the "No LLM client configured" error is silently swallowed)

**Deferred work:**
- None

**Test result:**
- Command: `npm test -- --watchAll=false`
- Exit: 0
- Output summary: 42 suites passed, 268 tests passed
- Typecheck: `npm run typecheck` — exit 0
