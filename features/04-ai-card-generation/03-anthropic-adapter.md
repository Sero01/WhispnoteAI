# Story 03: Anthropic adapter

**Tier:** flash

## Goal
`anthropicClient(apiKey, modelOverride?)` → `LLMClient` calling Anthropic Messages API with **tool use** for structured output.

## Files in scope
- `src/lib/ai/anthropic.ts` — create
- `src/lib/ai/factory.ts` — modify (wire Anthropic case)
- `__tests__/lib/ai/anthropic.test.ts` — create

## Do not touch
- `prompt.ts`, `parse.ts`, `types.ts`, `openai.ts` — settled

## Interface contracts

```ts
// src/lib/ai/anthropic.ts
import type { LLMClient } from './types';
export function anthropicClient(apiKey: string, modelOverride?: string): LLMClient;
```
- `provider: 'anthropic'`, default `model: 'claude-haiku-4-5'`.
- `generateCard(input)`: `POST https://api.anthropic.com/v1/messages` with:
  - headers: `x-api-key: ${apiKey}`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
  - body:
    ```json
    {
      "model": "<model>",
      "max_tokens": 2048,
      "system": "<system prompt>",
      "messages": [{ "role": "user", "content": "<user prompt>" }],
      "tools": [{
        "name": "emit_card",
        "description": "Emit the structured card.",
        "input_schema": <CARD_SCHEMA>
      }],
      "tool_choice": { "type": "tool", "name": "emit_card" }
    }
    ```
- Looks for the `tool_use` block in `response.content` array (`.type === 'tool_use'`); reads its `input` field; passes to `parseCardDraft`.
- HTTP error → throws `Error('Anthropic ${status}: ${body}')`.
- Single retry on network/5xx.

## Tests
- Successful tool_use response → returns parsed CardDraft.
- Headers include `x-api-key` and `anthropic-version`.
- Body includes `tool_choice` forcing the `emit_card` tool.
- HTTP 401 throws.
- Network error retries once.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `src/lib/ai/anthropic.ts` — new Anthropic adapter implementing `LLMClient` with tool use for structured output
- `src/lib/ai/factory.ts` — wired `anthropic` case to call `anthropicClient()` instead of throwing
- `__tests__/lib/ai/anthropic.test.ts` — new test suite (8 tests)
- `__tests__/lib/ai/factory.test.ts` — replaced "still throws not-implemented for anthropic" test with two tests: returns client + passes modelOverride

**Public interfaces added/modified:**
- `anthropicClient(apiKey: string, modelOverride?: string): LLMClient` at `src/lib/ai/anthropic.ts`
- `getActiveLLMClient()` now returns Anthropic client for `provider: 'anthropic'`

**Decisions made:**
- Followed the exact same retry/error pattern as `openaiClient` for consistency
- Default model `'claude-haiku-4-5'` per architecture.md
- Used `input_schema` (not `inputSchema`) in the tools array — Anthropic API uses snake_case for that field
- Parses `response.content` array for `.type === 'tool_use'` block, reads `.input`, passes to `parseCardDraft`

**Gotchas discovered:**
- Anthropic Messages API uses `x-api-key` header (not `Authorization: Bearer`), and requires `anthropic-version` header
- Tool use response structure has `content` as an array of blocks, not a flat `choices[0].message.content` string like OpenAI
- The `modelOverride` in factory needed `?? undefined` to preserve optionality (same pattern as openai case)

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 30 suites, 186 tests passed (8 new tests in anthropic.test.ts, 2 updated in factory.test.ts)
