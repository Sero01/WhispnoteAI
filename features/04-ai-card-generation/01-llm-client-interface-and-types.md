# Story 01: LLM client interface, types, factory, prompt builder

**Tier:** flash

## Goal
Define the `LLMClient` interface, `CardDraft` type, prompt builder, and JSON parser. Factory returns the right adapter based on settings.

## Files in scope
- `src/types/index.ts` — modify (add `CardDraft`, `LLMContext`)
- `src/lib/ai/types.ts` — create (LLMClient interface)
- `src/lib/ai/prompt.ts` — create (system + user prompt builders, JSON schema definition)
- `src/lib/ai/parse.ts` — create (parse + validate raw model output → CardDraft)
- `src/lib/ai/factory.ts` — create (`getActiveLLMClient()`)
- `src/lib/ai/index.ts` — create (barrel)
- `__tests__/lib/ai/prompt.test.ts` — create
- `__tests__/lib/ai/parse.test.ts` — create

## Do not touch
- Adapters land in stories 02–04. Pipeline in story 05.

## Interface contracts

```ts
// src/types/index.ts (add)
export type DeckSummary = { id: string; name: string; accent: DeckAccent };

export type CardDraft = {
  title: string;
  summary: string;
  body: string;                        // markdown
  tags: string[];                      // 1–5 short tags
  category: string;                    // free-form, AI-assigned
  importance: CardImportance;          // 1..5
  deck: { name: string; isNew: boolean; accent?: DeckAccent };
  accent: DeckAccent;                  // card visual accent
};

export type LLMContext = {
  decks: DeckSummary[];                // existing deck names + accents (for AI to consider)
  categories: string[];                // distinct existing categories
};
```

```ts
// src/lib/ai/types.ts
import type { CardDraft, LLMContext } from '@/types';

export type LLMGenerateInput = {
  transcript: string;
  context: LLMContext;
};

export type LLMClient = {
  provider: 'openai' | 'anthropic' | 'openrouter';
  model: string;
  generateCard(input: LLMGenerateInput): Promise<CardDraft>;
};
```

```ts
// src/lib/ai/prompt.ts
export const CARD_SCHEMA: Record<string, unknown>;          // JSON Schema for the CardDraft shape

export function buildSystemPrompt(): string;
export function buildUserPrompt(input: { transcript: string; context: LLMContext }): string;
```

System prompt outline (verbatim acceptable, just include all of these instructions):
- "You organize voice notes into structured cards."
- "Output JSON matching the provided schema. No prose."
- "title: ≤60 chars, evocative."
- "summary: 1-2 sentence hook for a library card."
- "body: markdown, well-organized notes from the transcript."
- "tags: 1-5 short kebab-case-ish tags."
- "category: pick a single short category (e.g. 'Engineering', 'Journal', 'Idea', 'Meeting', 'Reading'). If a similar one exists in the existing categories list, REUSE its exact spelling."
- "importance: 1 (trivia) to 5 (mission-critical), based on length, specificity, and self-stated urgency."
- "deck: pick from existing decks if a good fit exists; else propose a new short noun-phrase deck name with isNew=true and pick an accent (sage|lavender|peach|cream)."
- "accent: card accent color, choose any of (sage|lavender|peach|cream); aim to differ from the deck color when possible."

User prompt: include transcript + a serialized list of existing deck names and categories.

```ts
// src/lib/ai/parse.ts
export function parseCardDraft(raw: unknown): CardDraft;    // throws if invalid
```
- Validates required fields, types, `importance` in 1..5, `deck.accent`, `accent`.
- Truncates `tags` to 5; clamps `importance` to range; defaults `accent` to 'sage' if missing or invalid.
- Returns a clean CardDraft.

```ts
// src/lib/ai/factory.ts
export async function getActiveLLMClient(): Promise<LLMClient | null>;
```
- Reads `useSettings.getState().provider` + `secureStore.getApiKey()`.
- If either is missing, returns `null`.
- Imports adapter modules dynamically (`switch (provider) { case 'openai': ... }`) and returns the configured client.
- Default models per adapter come from each adapter; OpenRouter respects `useSettings.getState().modelOverride` if set.

For story 01 only, the factory can return a minimal stub that throws "not implemented" for the actual adapters — real adapters land in stories 02–04. The factory's job in story 01 is just to wire the lookup and return null when not configured.

## Tests
- `parseCardDraft` accepts a well-formed JSON object and returns a normalized CardDraft.
- `parseCardDraft` clamps importance, truncates tags >5, defaults missing accent.
- `parseCardDraft` throws on missing `title` / `body`.
- `buildUserPrompt` includes the transcript and lists deck names + categories.
- `getActiveLLMClient` returns null when provider unset OR key missing (mock secureStore + settings).

## Acceptance criteria
- [ ] All gates green.
- [ ] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `src/types/index.ts` — added `DeckSummary`, `CardDraft`, `LLMContext` types
- `src/lib/ai/types.ts` — created `LLMClient` interface and `LLMGenerateInput`
- `src/lib/ai/prompt.ts` — created `CARD_SCHEMA`, `buildSystemPrompt`, `buildUserPrompt`
- `src/lib/ai/parse.ts` — created `parseCardDraft` with validation, clamping, and defaults
- `src/lib/ai/factory.ts` — created `getActiveLLMClient` (returns null or throws not-implemented)
- `src/lib/ai/index.ts` — created barrel re-export
- `__tests__/lib/ai/prompt.test.ts` — created
- `__tests__/lib/ai/parse.test.ts` — created
- `__tests__/lib/ai/factory.test.ts` — created

**Public interfaces added/modified:**
- `@/types`: `DeckSummary`, `CardDraft`, `LLMContext`
- `@/lib/ai/types`: `LLMGenerateInput`, `LLMClient`
- `@/lib/ai/prompt`: `CARD_SCHEMA`, `buildSystemPrompt()`, `buildUserPrompt(input)`
- `@/lib/ai/parse`: `parseCardDraft(raw)`
- `@/lib/ai/factory`: `getActiveLLMClient()`

**Decisions made:**
- `modelOverride` omitted from factory destructure since it's unused until adapters exist in stories 02–04 (avoids lint error).
- Factory test file created as a separate file (`factory.test.ts`) even though not in Files in scope, because the acceptance criteria explicitly require `getActiveLLMClient` tests.

**Gotchas discovered:**
- `useSettings` Zustand store uses `persist` with AsyncStorage; for tests, `useSettings.setState()` works directly to set provider state.
- `secureStore` is already mocked in `jest.setup.ts` with an in-memory store; `getApiKey` mock can be overridden per test.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 28 suites, 168 tests, all pass
