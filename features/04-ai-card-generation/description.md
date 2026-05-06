# Feature 04 — AI Card Generation

## Spec

### Goal
Take a transcript + context (existing decks + categories) and produce a structured `CardDraft` via the user's chosen AI provider (OpenAI / Anthropic / OpenRouter). Persist it as a `Card` row, auto-assigning a deck (existing or new). Hook the pipeline into the `/record` save flow so a card materializes after a note is saved.

### Acceptance criteria
- `LLMClient` interface with three adapters (`openaiClient`, `anthropicClient`, `openrouterClient`). Each implements `generateCard(input) → Promise<CardDraft>`.
- `getActiveLLMClient()` factory reads `useSettings.getState().provider` + `secureStore.getApiKey()` and returns the right adapter.
- `generateCardFromTranscript(transcript, ctx)`: orchestrates one call, returns CardDraft.
- `saveCardFromDraft(noteId, draft, decks)`: resolves the deck (existing match by name, or `decksRepo.create`), inserts via `cardsRepo.create`, returns `Card`.
- `/record` save flow extended: after `notesRepo.create` + `setTranscript`, invokes the AI pipeline and persists the card. UX: shows a "Conjuring..." overlay during the call.
- All gates green; tests use mocked `fetch`.

### Out of scope
- Streaming responses, retries with exponential backoff (basic single retry only), multi-turn refinement.

### Dependencies
- Features 00, 01, 08, 09. Story 03 (transcription) provides the transcript.

### Stories
1. `01-llm-client-interface-and-types` — types, factory, prompt builder, parser.
2. `02-openai-adapter` — OpenAI Chat Completions + JSON schema response_format.
3. `03-anthropic-adapter` — Anthropic Messages + tool use for structured output.
4. `04-openrouter-adapter` — OpenRouter (OpenAI-compatible chat) with model from settings or default `google/gemini-2.5-flash`.
5. `05-pipeline-and-record-integration` — `saveCardFromDraft` + `generateCardFromTranscript` + record screen wiring + "Conjuring..." overlay.

## Summary (shipped)

`LLMClient` interface + 3 adapters (OpenAI json_schema, Anthropic tool_use, OpenRouter OpenAI-compatible). `parseCardDraft` defends against bad model output (clamps importance, truncates tags, defaults accent). Factory selects adapter from settings + SecureStore key. Pipeline (`generateCardFromTranscript` → `saveCardFromDraft` → `transcribeAndPersist`) handles deck dedup-or-create. `/record` save flow shows "Conjuring..." overlay during the AI call; errors surface as a peach toast and don't block navigation. All HTTP behavior tested with mocked `fetch`.
