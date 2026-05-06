# Story 04: OpenRouter adapter

**Tier:** flash

## Goal
`openrouterClient(apiKey, modelOverride?)` → `LLMClient` calling OpenRouter (OpenAI-compatible chat completions). Default model `google/gemini-2.5-flash`.

## Files in scope
- `src/lib/ai/openrouter.ts` — create
- `src/lib/ai/factory.ts` — modify (wire OpenRouter case + read `modelOverride` from settings)
- `__tests__/lib/ai/openrouter.test.ts` — create
- `__tests__/lib/ai/factory.test.ts` — create (now that all 3 adapters exist, test factory dispatch)

## Do not touch
- Other adapters and shared modules — settled.

## Interface contracts

```ts
// src/lib/ai/openrouter.ts
import type { LLMClient } from './types';
export function openrouterClient(apiKey: string, modelOverride?: string): LLMClient;
```
- `provider: 'openrouter'`, default `model: 'google/gemini-2.5-flash'`.
- `POST https://openrouter.ai/api/v1/chat/completions` with:
  - headers: `Authorization: Bearer ${apiKey}`, `Content-Type: application/json`, `HTTP-Referer: https://whispnote.ai`, `X-Title: Whispnote`.
  - body: same shape as OpenAI adapter (system + user messages, `response_format: { type: 'json_schema', json_schema: { name: 'card_draft', strict: true, schema: CARD_SCHEMA } }`, temperature 0.4).
- Parses `response.choices[0].message.content` as JSON via `parseCardDraft`.
- HTTP / network error handling identical to OpenAI adapter.

`factory.ts` updates:
- Reads `useSettings.getState().modelOverride` and passes to `openrouterClient` when provider is `openrouter`.
- For `openai`/`anthropic`, modelOverride is currently ignored (could be added later).
- Unit-test the factory: with each provider + key set, returns the correct client; without key, returns null.

## Tests
- OpenRouter: returns parsed CardDraft; uses model override when supplied.
- OpenRouter: includes the OpenRouter-specific HTTP-Referer + X-Title headers.
- Factory: dispatches to the right adapter for each provider; returns null if no provider OR no key.

## Acceptance criteria
- [x] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/lib/ai/openrouter.ts` — created OpenRouter adapter (OpenAI-compatible, OpenRouter-specific headers, default model `google/gemini-2.5-flash`, retry logic identical to OpenAI adapter)
- `src/lib/ai/factory.ts` — added `openrouterClient` import and wired `openrouter` case in switch (replaced throw)
- `__tests__/lib/ai/openrouter.test.ts` — created with tests for: provider/model, modelOverride, parsed CardDraft, OpenRouter-specific headers (`HTTP-Referer`, `X-Title`), error handling (429, 5xx, network retry, double failure)
- `__tests__/lib/ai/factory.test.ts` — added 2 tests: openrouter client dispatch, modelOverride passed to openrouter

**Public interfaces added/modified:**
- `src/lib/ai/openrouter.ts:export function openrouterClient(apiKey: string, modelOverride?: string): LLMClient`

**Decisions made:**
- Followed OpenAI adapter pattern exactly (same request/response shape, same retry logic) since OpenRouter is an OpenAI-compatible endpoint.
- Error prefix `OpenRouter` for status-based errors (e.g. `OpenRouter 429: ...`).

**Gotchas discovered:**
- `__tests__/lib/ai/factory.test.ts` already existed (story said "create") — only needed to append openrouter test cases.
- ModelOverride was already wired in factory for openai/anthropic (story note said "currently ignored" but code already passes it).

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 31 suites, 196 tests passed
- `npm run lint`: 0 errors, 10 warnings (all pre-existing)
- `npm run typecheck`: clean
