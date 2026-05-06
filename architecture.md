# Architecture

Durable decisions for WhispnoteAI. Edit in place; collapse superseded decisions.

## Product

Mobile-first AI voice note app. User records a voice note → audio is transcribed → an AI organizes the transcript into a visually rich "card." Cards are grouped into "decks." iOS + Android.

## Stack

- **Runtime / framework:** React Native via Expo SDK (managed workflow). Targets iOS and Android from a single codebase.
- **Language:** TypeScript (strict mode).
- **Navigation:** Expo Router (file-based). Chosen over React Navigation directly because Expo Router is now the default for new Expo projects and removes navigator boilerplate.
- **State:** Zustand for app state. React Query (TanStack Query) for server/AI calls with caching.
- **Local persistence:** `expo-sqlite` for relational data (decks, cards, notes). `expo-secure-store` for API keys. `expo-file-system` for audio files.
- **Audio capture:** `expo-audio` (modern replacement for expo-av recording APIs).
- **AI providers (user-selected at first run, BYO key):**
  - User picks **one** of: OpenAI, Anthropic, OpenRouter. Key stored in `expo-secure-store`.
  - **Transcription is on-device**, not provider-based. Uses `expo-speech-recognition` (iOS `Speech` framework + Android `SpeechRecognizer`). Free, offline-capable, works with all three provider choices. No audio leaves the device.
  - **Card generation** uses the chosen provider via a unified `LLMClient` interface in `src/lib/ai/`. Each provider adapter implements `generateCard(transcript, opts) → CardDraft`.
    - OpenAI: `gpt-4o-mini` (cheap tier, supports JSON schema response format).
    - Anthropic: `claude-haiku-4-5` (cheap tier, supports tool use for structured output).
    - OpenRouter: select cost-effective model with tool-use support — default `google/gemini-2.5-flash` (cheapest tier-1 model with reliable tool use). Allow override in settings.
  - Audio recordings are still saved locally (so the user can replay them); transcription happens on the saved file or in real time via the speech recognizer.
- **Styling:** NativeWind (Tailwind for React Native) + a custom theme module for the pastel palette and typography. Reanimated 3 for motion.
- **Icons:** `@expo/vector-icons` (Lucide set).
- **Fonts:** `expo-font` loading a serif display face + a handwritten accent face + a clean sans-serif body face (specific families chosen in feature 01).
- **Testing:** Jest with `jest-expo` preset + React Native Testing Library. Unit tests for logic, component tests for UI primitives. No e2e in MVP (Detox deferred).
- **Lint / format:** ESLint (`eslint-config-expo`) + Prettier.

## Commands

- **Install:** `npm install`
- **Dev:** `npx expo start`
- **Test:** `npm test` (runs `jest`)
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`)

The validation gate uses `npm test` exit code as the pass signal.

## Directory layout

```
app/                      # Expo Router routes (screens)
  (tabs)/                 # bottom-tab group
    index.tsx             # My Notes / library
    decks.tsx             # decks list
  card/[id].tsx           # card detail
  record.tsx              # recording screen (modal)
  _layout.tsx             # root layout, font loading, providers
src/
  components/             # reusable UI (Card, DeckChip, WaveformBars, ...)
  features/               # feature-scoped logic (recording/, cards/, decks/)
  lib/                    # cross-cutting: db, ai clients, audio, utils
  theme/                  # colors, typography, spacing
  store/                  # zustand stores
  types/                  # shared TS types
assets/                   # fonts, images
__tests__/                # tests mirror src/ structure
```

## Key conventions

- **Files:** `kebab-case.ts` for modules, `PascalCase.tsx` for components.
- **Components:** function components, named exports, props typed inline.
- **Imports:** absolute imports via `@/` alias (configured in `tsconfig.json` + `babel.config.js`).
- **DB access:** all SQLite goes through `src/lib/db/` — no raw queries in components or screens.
- **AI calls:** all network calls to AI providers go through `src/lib/ai/` clients with retry + timeout. Components never call `fetch` directly.
- **Errors:** thrown errors at boundary; UI surfaces via toast (sonner-native or custom). Never silently swallow.
- **Tests:** colocated under `__tests__/` mirroring `src/` paths. Filename: `<module>.test.ts(x)`.

## Visual identity (codified for cross-feature consistency)

Reference: `whispnoteai.png` in repo root.

- **Palette:** cream `#F4EDE0` background; sage/mint `#C7D9B5`; lavender `#D6CFE8`; peach `#F2C9B0`; ink `#1F1B16`; muted ink `#6B6358`.
- **Type:** serif display (e.g. Fraunces) for card titles + screen headers; handwritten (e.g. Caveat) for accents/annotations; geometric sans (Inter) for body.
- **Cards:** rounded-3xl, soft drop shadow, generous padding, single accent color per card from palette rotation.
- **Motion:** spring-based; cards animate in on creation; recording waveform pulses.

Locked in feature 01; later features must follow.

## Card generation contract (cross-cuts features 04, 05, 07)

A single Claude/OpenAI/OpenRouter call returns a structured `CardDraft`:

```ts
type CardDraft = {
  title: string;                 // <= 60 chars, serif display
  summary: string;               // 1–2 sentence hook for the library card
  body: string;                  // markdown, the organized content
  tags: string[];                // 1–5 short tags
  category: string;              // single AI-assigned category, used as a filter
                                 // (e.g. "Engineering", "Journal", "Idea", "Meeting").
                                 // The set is open — categories are clustered post-hoc.
  importance: 1 | 2 | 3 | 4 | 5; // drives card visual size in the library
  deck: { name: string; isNew: boolean }; // AI auto-assigns; if no existing deck fits, isNew=true
  accentColor: "sage" | "lavender" | "peach" | "cream"; // rotated by provider, not chosen by AI
}
```

Constraints baked into the prompt:
- The AI is given the list of existing deck names and either picks one or proposes a new one.
- The AI is given the list of existing categories so categorization is consistent (but may add a new one if needed).
- Importance maps to a card-size variant in the library grid (1–2 = small, 3 = medium, 4–5 = large).

## Rejected alternatives

- **Bare React Native (no Expo):** rejected — Expo modules cover audio, fonts, secure store, file system out of box; OTA updates and EAS Build save weeks.
- **Firebase / Supabase backend:** deferred — MVP is fully on-device. Sync is a post-MVP feature.
- **MMKV for relational data:** rejected — cards/decks have relations and need queries; SQLite fits.
- **Whisper API for transcription:** rejected — would force every user to hold an OpenAI key even if they chose Anthropic/OpenRouter. On-device speech recognition is free, offline-capable, and provider-agnostic. Quality is sufficient for short voice notes.
- **On-device LLM for card generation:** rejected — model sizes (3B+) bloat install and quality is below cloud cheap-tier for structured output.
- **Realm:** rejected — heavier than needed; SQLite + a thin query layer is simpler.
- **Multi-provider per session:** rejected — user picks one provider in settings, can change later. Avoids a provider-routing UI.

## Test runner contract for stories

Every story's acceptance criteria includes: `npm test` exits 0. Stories that add code add tests in the same PR. The bootstrap feature establishes the runner; subsequent features extend it.
