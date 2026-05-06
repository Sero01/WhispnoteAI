# Public surface

One section per completed feature. Lists exported functions, schemas, screens, file locations. No prose.

---

## 00 — bootstrap

**Project shell.** Runnable Expo SDK 54 + TS strict + Expo Router app with lint, test runner, and root provider tree.

### Commands
- `npm install` — install
- `npm start` / `npm run ios` / `npm run android` — dev server
- `npm test` / `npm run test:watch` — Jest (jest-expo preset)
- `npm run lint` — ESLint v9 flat config
- `npm run typecheck` — `tsc --noEmit`

### Path aliases
- `@/*` → `src/*` (TS resolves `app/*` too; Babel resolves `@app/*` → `./app`)

### Screens
- `app/_layout.tsx` — `RootLayout`: wraps `<Stack />` in `<AppProviders>`, gates render on `useAppFonts().fontsLoaded`
- `app/index.tsx` — `Index`: placeholder screen rendering `WhispnoteAI`

### Modules

**`@/providers/AppProviders`**
```ts
export function AppProviders({ children }: { children: React.ReactNode }): React.ReactElement;
```
Composes (outer → inner): `GestureHandlerRootView` → `QueryClientProvider` (shared `QueryClient`, `{ retry: 1, staleTime: 30_000 }`) → `ThemeProvider`.

**`@/theme`**
```ts
export type Theme = {
  colors: { background: string; surface: string; ink: string; inkMuted: string;
            accent: { sage: string; lavender: string; peach: string; cream: string } };
  radii: { sm: number; md: number; lg: number; xl: number };
  spacing: (n: number) => number;            // n * 4
  typography: { display: string; body: string; accent: string };
};
export const defaultTheme: Theme;             // stub palette; real values land in feature 01
export function useTheme(): Theme;            // throws outside <ThemeProvider>
```

**`@/theme/ThemeProvider`**
```ts
export function ThemeProvider({ children, theme? }: { children: React.ReactNode; theme?: Theme }): React.ReactElement;
```

**`@/lib/fonts`** _(updated in feature 01)_
```ts
export function useAppFonts(): { fontsLoaded: boolean; fontError: Error | null };
```
Loads Fraunces (display), Inter (body), Caveat (handwritten) via `@expo-google-fonts/*`.

### Test infrastructure
- `jest.setup.ts` — global `performance` polyfill + `react-native-gesture-handler` mock. Add new native-module mocks here as features need them.
- `__tests__/` mirrors source paths.

### Conventions established
- ESLint v9 **flat config** (`eslint.config.js`) — do NOT add `.eslintrc.*` files.
- All persistent app state goes through `AppProviders`; never instantiate a second `QueryClient`.
- New screens go in `app/` (Expo Router); reusable code in `src/`.
- New tests go in `__tests__/` mirroring source path.

---

## 01 — design-system

**Visual language realized.** NativeWind v4, Fraunces/Inter/Caveat loaded, single-source theme tokens, six primitives, `/design` showcase route.

### Token source of truth
**`@/theme/tokens`** — read from BOTH `defaultTheme` (JS) and `tailwind.config.js` (CSS). Add or change a value here and both layers update.
```ts
export const colors = { background, surface, ink, inkMuted, accent: { sage, lavender, peach, cream } } as const;
export const radii   = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;
export const spacing = (n: number) => n * 4;
export const fontFamily = { display, displayBold, body, bodyMedium, bodySemibold, accent, accentBold } as const;
export const shadow  = { card, pressed } as const;
export const motion  = { fast: 150, base: 220, slow: 360 } as const;
```

### Tailwind utilities exposed
- Colors: `bg-background`, `bg-surface`, `bg-sage`, `bg-lavender`, `bg-peach`, `bg-cream`, `text-ink`, `text-ink-muted`
- Fonts: `font-display`, `font-display-bold`, `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-handwritten`, `font-handwritten-bold`
- Radius: `rounded-4xl` (28px)

### Primitives — `@/components`

```ts
// Text
type TextVariant = 'display' | 'title' | 'body' | 'eyebrow' | 'handwritten';
type TextColor   = 'ink' | 'inkMuted' | 'background' | 'surface';
function Text(props: TextProps): React.ReactElement;
//   props: variant, color, weight ('regular'|'medium'|'semibold'|'bold'), align, ...RNTextProps

// Screen
type ScreenProps = ViewProps & { background?: 'background'|'surface'; padding?: 'none'|'sm'|'md'|'lg'; scroll?: boolean; children };
function Screen(props): React.ReactElement;  // SafeAreaView + bg + padding (+ ScrollView when scroll)

// Card
type CardAccent = 'sage' | 'lavender' | 'peach' | 'cream' | 'surface';
type CardSize   = 'sm' | 'md' | 'lg';
type CardProps  = ViewProps & { accent?, size?, bordered?, children };
function Card(props): React.ReactElement;  // radius xl, shadow.card, padding by size, optional 1px border

// Button
type ButtonVariant = 'primary' | 'ghost' | 'accent';
type ButtonSize    = 'sm' | 'md' | 'lg';
type ButtonProps   = Omit<PressableProps, 'children'> & { variant?, size?, accent?, label, loading?, fullWidth? };
function Button(props): React.ReactElement;

// Chip
type ChipVariant = 'filter' | 'tag';
type ChipProps   = Omit<PressableProps, 'children'> & { variant?, selected?, accent?, label };
function Chip(props): React.ReactElement;

// IconButton
type IconButtonProps = Omit<PressableProps, 'children'> & {
  size?: 'sm'|'md'|'lg'; variant?: 'plain'|'filled'|'accent'; accent?: 'sage'|'lavender'|'peach';
  accessibilityLabel: string;   // REQUIRED
  children: React.ReactNode;
};
function IconButton(props): React.ReactElement;
```

All exported from the barrel `@/components`.

### Routes
- `app/design.tsx` — hidden `/design` route showcasing every primitive in every variant. Not linked from any nav. Used for visual QA.

### Test mocks now in `jest.setup.ts`
- `react-native-gesture-handler` (View passthrough)
- `nativewind` (identity passthrough for `cssInterop`/`remapProps`/`styled`)
- `@expo-google-fonts/{fraunces,caveat,inter}` (`useFonts` returns `[true, null]`)
- `react-native-safe-area-context` (View passthrough + zero insets)

### Conventions established
- **Always** use `<Text>` (`@/components`); never the raw `react-native` `Text`.
- Tokens come from `@/theme/tokens` (or via `useTheme()`); never inline hex colors in components.
- New native-module mocks go in `jest.setup.ts` (purely additive).

---

## 09 — settings & onboarding

**BYO-key onboarding flow + settings screen.** First-run forces `/onboarding`; settings persisted via Zustand+AsyncStorage; API key in SecureStore (never in JS state).

### Stores
**`@/store/settings`** — Zustand, persisted to AsyncStorage at key `whispnote.settings`.
```ts
type AIProvider = 'openai' | 'anthropic' | 'openrouter';
type SettingsState = { provider: AIProvider | null; modelOverride: string | null; onboarded: boolean };
type SettingsActions = { setProvider; setModelOverride; setOnboarded; reset };
useSettings: ZustandStore<SettingsState & SettingsActions>;
```

### Modules
**`@/lib/secureStore`** — `getApiKey()`, `setApiKey(k)`, `clearApiKey()` over `expo-secure-store` at key `whispnote.apiKey`. **Never put the key in Zustand.**

**`@/lib/validateApiKey`** — `validateApiKey(provider, key) → { ok, reason? }`. Shape only (prefix + length); no network. Rules: openai `sk-` ≥30, anthropic `sk-ant-` ≥30, openrouter `sk-or-` ≥20.

### Routes
- `/onboarding` — provider picker (3 colored cards) + secured key input → saves and navigates to `/`.
- `/settings` — change provider, update key, model override (OpenRouter only), reset (clears key + Zustand → returns to `/onboarding`).
- Root `_layout` redirects to `/onboarding` when `!onboarded`.

### Test mocks added
- `expo-secure-store`, `@react-native-async-storage/async-storage` — in-memory Map-backed mocks in `jest.setup.ts`.
- Jest `moduleNameMapper` `\\.css$` → `__mocks__/styleMock.js` (so test imports of `_layout` survive `import '../global.css'`).

---

## 08 — local storage

**SQLite + typed repos.** Singleton `expo-sqlite` instance + idempotent migrations + 3 repositories. Tests run real SQL via `better-sqlite3` in-memory backed mock.

### DB
**`@/lib/db`** — barrel re-exports `getDb`, `resetDb`, `decksRepo`, `notesRepo`, `cardsRepo`.

**Tables (migration 1):** `decks`, `notes`, `cards` with FK `cards.note_id → notes.id ON DELETE CASCADE`, `cards.deck_id → decks.id ON DELETE SET NULL`. Indexes on `cards(deck_id)`, `cards(category)`, `cards(bookmarked)`. `_migrations` table tracks applied migrations.

### Types — `@/types`
```ts
type DeckAccent = 'sage' | 'lavender' | 'peach' | 'cream';
type Deck = { id, name, accent: DeckAccent, createdAt, updatedAt };
type Note = { id, audioUri, transcript: string|null, durationMs, createdAt };
type CardImportance = 1|2|3|4|5;
type Card = { id, noteId, deckId: string|null, title, summary, body,
              tags: string[], category, importance: CardImportance,
              accent: DeckAccent, bookmarked: boolean, createdAt, updatedAt };
```

### Repos — `@/lib/db`
```ts
decksRepo: { create, list, get, getByName, update, delete }
notesRepo: { create, setTranscript, get, list, delete }
cardsRepo: { create, get, list(filter?: { deckId?, category?, bookmarked? }),
             listCategories, update, setBookmarked, delete }
```

### Conventions
- All SQL parameterized; no string concatenation.
- All raw SQL lives under `src/lib/db/` — never in components/screens.
- IDs from `crypto.randomUUID()`.
- `tags` round-trips through `tags_json` column; `bookmarked` 0/1 ↔ boolean.

---

## 02 — voice recording

**Capture audio + persist a `Note`.** `useRecorder` hook + `<Waveform>` component + `/record` modal route.

### Hook — `@/features/recording`
```ts
type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'denied' | 'error';
type Recording = { uri: string; durationMs: number; amplitudes: number[] };
function useRecorder(): {
  status; elapsedMs; amplitude; amplitudes; error;
  start(); stop(): Promise<Recording|null>; pause(); resume(); discard();
};
// audioSession.ts: configureAudioForRecording(), configureAudioForPlayback()
```
- Saves audio to `${documentDirectory}recordings/${uuid}.m4a` (via `expo-file-system/legacy`).
- Polls `recorder.getStatus()` every 100ms; ring buffer of 64 amplitude samples.
- Permission requested on `start()`; denial → status `'denied'`.

### Components
**`<Waveform>`** in `@/components` — bar chart of amplitudes (max 64), Reanimated `withTiming` (200ms), color from theme palette.

### Routes
- `/record` (modal presentation) — full-screen recorder UI: display-size timer, waveform, big peach IconButton mic, save/discard controls when stopped, permission-denied card.
- `/` now has a "New note" Button → `/record`.

### Test mocks added
- `expo-audio` — module-level `mockRecorder`, `useAudioRecorder` returns it, permission `granted: true`.
- `expo-file-system` + `expo-file-system/legacy` — shared mock surface (documentDirectory, makeDirectoryAsync, moveAsync, deleteAsync, etc).
- `react-native-reanimated` — manual mock (v4 built-in mock requires Worklets native module). Includes `Animated.View`, `createAnimatedComponent`, `useSharedValue`, `useAnimatedStyle`, `withTiming` etc.

---

## 03 — transcription

**On-device speech-to-text** running in parallel with recording. No cloud, no API key needed.

### Hook — `@/features/transcription`
```ts
type TranscriberStatus = 'idle' | 'listening' | 'processing' | 'done' | 'denied' | 'error';
function useTranscriber(opts?: { lang?: string }): {
  status; partial; finalTranscript; error;
  start(); stop(): Promise<string>; reset();
};
```
- Wraps `expo-speech-recognition`. Permission requested in `start()`.
- Continuous + interimResults; partial updates while speaking, final segments accumulated with single-space separator.
- `stop()` resolves with the trimmed final transcript.

### `/record` integration
- `useRecorder` and `useTranscriber` start/stop in parallel via `Promise.all`.
- Live partial transcript rendered as handwritten text on screen.
- Save flow: `notesRepo.create` → `notesRepo.setTranscript(noteId, transcript)` if non-empty.
- If transcription denied, save still persists the audio (no transcript) and shows "Transcription unavailable" eyebrow.

### Test mock added
- `expo-speech-recognition` — module mock with `__mockEmit(event, payload)` helper for synthetic result/end events.

---

## 04 — AI card generation

**Multi-provider LLM client → structured `CardDraft` → persisted `Card`.** OpenAI (json_schema), Anthropic (tool use), OpenRouter (OpenAI-compatible). Auto-assigns deck.

### Types — `@/types`
```ts
type DeckSummary = { id: string; name: string; accent: DeckAccent };
type CardDraft = {
  title; summary; body; tags: string[]; category;
  importance: CardImportance;
  deck: { name; isNew: boolean; accent? };
  accent: DeckAccent;
};
type LLMContext = { decks: DeckSummary[]; categories: string[] };
```

### LLM modules — `@/lib/ai`
```ts
type LLMClient = { provider; model; generateCard(input): Promise<CardDraft> };

// Adapters — each takes (apiKey, modelOverride?) and returns LLMClient
openaiClient    → POST /v1/chat/completions, response_format: json_schema, default 'gpt-4o-mini'
anthropicClient → POST /v1/messages, tool_use 'emit_card', default 'claude-haiku-4-5'
openrouterClient→ POST /v1/chat/completions, response_format: json_schema,
                  default 'google/gemini-2.5-flash', headers HTTP-Referer + X-Title

getActiveLLMClient(): Promise<LLMClient | null>   // reads useSettings + secureStore

// Prompt + parse
CARD_SCHEMA, buildSystemPrompt(), buildUserPrompt(input)
parseCardDraft(raw): CardDraft   // throws on invalid; clamps importance, truncates tags, defaults accent

// Pipeline
generateCardFromTranscript(transcript): Promise<CardDraft>      // pulls context from repos + active client
saveCardFromDraft(noteId, draft): Promise<Card>                  // dedup deck by name; create if missing
transcribeAndPersist(noteId, transcript): Promise<Card>          // composes the two
```

### `/record` integration
- Save flow: `notesRepo.create` → optional `setTranscript` → if transcript+client: `transcribeAndPersist`.
- `phase` state: `idle | saving | conjuring`. Full-screen dimmed overlay with "Conjuring a card..." while AI call runs. Error toast (peach Card) auto-dismisses 2.5s. AI errors don't block navigation.
- All adapters retry once on network error / 5xx; 4xx throws immediately.

---

## 07 — deck management

**Decks list, deck detail, edit + delete.**

### Hooks — `@/features/decks`
```ts
useDecksWithCount(): { data: DeckWithCount[]; isLoading; refetch }
useDeckWithCards(deckId): { deck: Deck|null; cards: Card[]; isLoading }
```
TanStack Query keyed on `['decks-with-count']`, `['deck', id]`, `['cards', { deckId: id }]`.

### Components — `@/features/decks/DeckEditSheet`
```ts
DeckEditSheet({ deck, visible, onClose, onSaved, onDeleted })
```
Modal sheet: rename + 4-accent swatch picker + Save/Delete. Delete confirms via `Alert.alert` and on confirm calls `decksRepo.delete` (FK `ON DELETE SET NULL` reassigns affected cards' `deck_id` to null).

### Routes
- `/decks` — 2-column grid of accent-colored deck tiles with card counts. Empty state shows handwritten "No decks yet — record your first note."
- `/deck/[id]` — header + card list filtered by deckId. Empty state, missing-deck state, edit IconButton in header. After delete: `router.replace('/decks')`.
---

## 05 — card library

**My Notes home screen.** Library cards in a 2-column importance-sized grid + Recent/Bookmarked tabs + horizontal category chip row.

### Hooks — `@/features/library`
```ts
useCards(filter?: CardFilter): { data: Card[] | undefined; isLoading: boolean; refetch(): void };
// queryKey ['cards', filter ?? {}]; queryFn cardsRepo.list(filter)

useCategories(): { data: string[] | undefined; isLoading: boolean };
// queryKey ['cards-categories']; queryFn cardsRepo.listCategories()
```

### Components — `@/features/library/CardTile`
```ts
type CardTileProps = { card: Card; onPress: () => void };
function CardTile(props: CardTileProps): React.ReactElement;
// importance → size: 1–2 sm, 3 md, 4–5 lg
// renders: title, summary (numberOfLines={3}), category eyebrow, bookmark dot
```

### Routes
- `/` (`app/index.tsx`) — display "My Notes" header + today's date (handwritten), Recent/Bookmarked filter Chip pair, horizontal-scroll category chip row ("All" + each category), 2-column masonry-ish grid (even index → left, odd → right), peach "Record a note" Button → `/record`. Empty state: handwritten "Your notes will appear here. Tap the mic to capture one.". Cards tap → `/card/[id]`.

---

## 06 — card detail

**`/card/[id]` screen + move-to-deck sheet.**

### Hook — `@/features/card-detail/useCard`
```ts
useCard(id: string | undefined): { data: Card | null | undefined; isLoading: boolean; refetch(): void };
// queryKey ['card', id]; enabled !!id; queryFn cardsRepo.get(id)
```

### Components — `@/features/card-detail/MoveToDeckSheet`
```ts
type MoveToDeckSheetProps = {
  visible: boolean;
  currentDeckId: string | null;
  onClose(): void;
  onSelect(deckId: string | null): void;
};
function MoveToDeckSheet(props): React.ReactElement;
// Slide-up Modal; loads decks via useQuery(['decks'], decksRepo.list);
// Rows: 'Unfiled' + one per deck (name + accent swatch); Cancel button.
```

### Routes
- `/card/[id]` — header (eyebrow `{category} · importance {importance}`, display title), bookmark + delete IconButtons, handwritten summary, deck pill (`in {deckName}` or `'unfiled'`) opens MoveToDeckSheet, body paragraphs (split on `/\\n\\n+/`), tag chip row. Missing-card state: peach error Card + Back. Bookmark calls `cardsRepo.setBookmarked` + invalidates `['card', id]`, `['cards']`. Delete: Alert confirm → `cardsRepo.delete` + invalidates `['cards']`, `['decks-with-count']` → `router.replace('/')`. Move: `cardsRepo.update(id, { deckId })` + invalidates `['card', id]`, `['cards']`, both `['deck', ...]` (old + new), `['decks-with-count']`.

### Conventions reinforced
- `Text` `weight` enum is `'regular'|'medium'|'semibold'|'bold'` — do not pass variant names.
- Modal backdrop `rgba(0,0,0,0.3)` is the one allowed inline color (matches `DeckEditSheet`).
