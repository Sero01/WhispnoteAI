# Story 02: OpenAI adapter

**Tier:** flash

## Goal
`openaiClient(apiKey, modelOverride?)` → `LLMClient` calling OpenAI Chat Completions with structured JSON output via `response_format: { type: 'json_schema', json_schema: { schema: CARD_SCHEMA } }`.

## Files in scope
- `src/lib/ai/openai.ts` — create
- `src/lib/ai/factory.ts` — modify (wire OpenAI case)
- `__tests__/lib/ai/openai.test.ts` — create

## Do not touch
- `prompt.ts`, `parse.ts`, `types.ts` — settled
- Other adapters

## Interface contracts

```ts
// src/lib/ai/openai.ts
import type { LLMClient, LLMGenerateInput } from './types';
export function openaiClient(apiKey: string, modelOverride?: string): LLMClient;
```
- `provider: 'openai'`, default `model: 'gpt-4o-mini'`.
- `generateCard(input)` makes a `POST https://api.openai.com/v1/chat/completions` with:
  - headers: `Authorization: Bearer ${apiKey}`, `Content-Type: application/json`
  - body:
    ```json
    {
      "model": "<model>",
      "messages": [
        { "role": "system", "content": "<system prompt>" },
        { "role": "user", "content": "<user prompt>" }
      ],
      "response_format": { "type": "json_schema", "json_schema": { "name": "card_draft", "strict": true, "schema": <CARD_SCHEMA> } },
      "temperature": 0.4
    }
    ```
- Parses `response.choices[0].message.content` as JSON, passes to `parseCardDraft`.
- On HTTP error, throws `Error('OpenAI ${status}: ${body}')`.
- Single retry on network/5xx errors.

## Tests
- Successful response → returns parsed `CardDraft`.
- Sends model + headers + system/user prompts in body (assert via mock `fetch`).
- HTTP 429 throws an error with status.
- Network error retries once and succeeds the second time.

Mock `fetch` globally per test:
```ts
beforeEach(() => { global.fetch = jest.fn(); });
```

## Acceptance criteria
- [x] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/lib/ai/openai.ts` — created `openaiClient(apiKey, modelOverride?)` function
- `src/lib/ai/factory.ts` — wired OpenAI case in `getActiveLLMClient` switch, passing `modelOverride` from settings
- `__tests__/lib/ai/openai.test.ts` — created tests for client construction, successful response, request body structure, HTTP 429, network retry, retry exhaustion, and 5xx retry
- `__tests__/lib/ai/factory.test.ts` — updated "not implemented" test to expect a valid openai client instead

**Public interfaces added/modified:**
- `src/lib/ai/openai.ts` — `export function openaiClient(apiKey: string, modelOverride?: string): LLMClient`

**Decisions made:**
- Retry logic: retries on network errors (TypeError from fetch) and 5xx status codes only; 4xx errors (including 429) throw immediately.
- Loop uses up to 2 attempts; non-retryable errors throw on first attempt, retryable errors get one retry then throw.

**Gotchas discovered:**
- None.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 29 suites, 177 tests, all passed
- `npm run lint` — 0 errors, 10 pre-existing warnings
- `npm run typecheck` — clean exit
