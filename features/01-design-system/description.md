# Feature 01 — Design System

## Spec

### Goal
Establish the visual language and primitive component set that every later screen will compose. Realize the cream/sage/lavender/peach pastel palette, serif+handwritten+sans typography, and the rounded card surfaces from `whispnoteai.png`. Replace stubs from feature 00 (`defaultTheme`, `useAppFonts`) with real implementations.

### Acceptance criteria
- Real fonts loaded: serif display (Fraunces), handwritten accent (Caveat), sans body (Inter), via `@expo-google-fonts/*`. `useAppFonts()` returns `{ fontsLoaded: boolean }` reflecting the actual load state.
- Theme tokens finalized: colors, radii, spacing, typography (with loaded font family names), shadows, motion durations.
- NativeWind v4 wired to the same theme tokens — `tailwind.config.js` reads from a single source-of-truth tokens file.
- Primitive components shipped: `Text`, `Screen`, `Card`, `Button`, `Chip`, `IconButton`. Each:
  - Accepts theme-driven props (color variants from palette, size variants, etc.).
  - Has a unit test covering the main variants render without throwing and apply the expected style/className.
- A hidden `/design` route renders every primitive in every variant for visual QA. Not linked from anywhere else.
- All gates green: `npm test`, `npm run lint`, `npm run typecheck`.
- `__tests__/theme/ThemeProvider.test.tsx` is updated to assert real font family names (not `'System'`).

### Out of scope
- Real screens (My Notes, Card Detail, etc.) — feature 05/06.
- Recording UI — feature 02.
- Persistence — feature 08.
- Animation choreography beyond simple transitions — incremental in later features.

### Dependencies
- Feature 00 (bootstrap) — provides `AppProviders`, `ThemeProvider`, `useAppFonts` stub.

### Stories
1. `01-nativewind-setup` — Install NativeWind v4, configure Tailwind, jest interop, smoke test.
2. `02-fonts-and-theme-tokens` — Google fonts + finalize theme tokens (single source: `src/theme/tokens.ts` consumed by both JS theme and `tailwind.config.js`); replace `useAppFonts` stub.
3. `03-text-primitive` — `<Text>` with variants `display | title | body | eyebrow | handwritten` and color variants from theme.
4. `04-screen-and-card` — `<Screen>` (safe-area, background, padding) and `<Card>` (rounded-3xl, accent color rotation, shadow).
5. `05-action-primitives` — `<Button>` (primary/ghost, sizes), `<Chip>` (filter chip + tag pill), `<IconButton>`.
6. `06-design-showcase` — Hidden `/design` route renders all primitives in all variants; render test asserts mount.

## Summary (shipped)

Visual language realized end-to-end. NativeWind v4 wired to a single source-of-truth tokens file; Fraunces / Inter / Caveat loaded via `@expo-google-fonts/*`; six primitive components (`Text`, `Screen`, `Card`, `Button`, `Chip`, `IconButton`) covering typography, layout, and actions; hidden `/design` route renders every variant for visual QA. **54 tests pass** across 11 suites; lint and typecheck clean.

### Key decisions made during execution
- **Single token source:** `src/theme/tokens.ts` is `require`-able from `tailwind.config.js` (CommonJS interop works because tokens are plain values). The JS `defaultTheme` is built from these same tokens. Adding a token never requires editing two files.
- **Theme shape expanded** from feature 00: `Theme` now exposes `displayBold`, `bodyMedium`, `bodySemibold`, `accentBold` font families, plus `shadow` (card/pressed) and `motion` (fast/base/slow ms) tokens.
- **Style strategy is StyleSheet via `useTheme()`** — primitives compose styles with `useMemo` keyed on theme + props, NOT NativeWind classes. NativeWind is available for future use in screens but the foundational primitives prefer typed tokens for testability.
- **`hexToRgba`** helper duplicated in `Card.tsx` and `Chip.tsx` for opacity-controlled borders. Future cleanup: extract to `src/lib/color.ts` if a third call site appears (rule of three).
- **`accessibilityLabel` is required** on `<IconButton>` at the type level — icon-only controls have no visible affordance for screen readers.

### Test infrastructure additions
- `jest.setup.ts` now mocks: `react-native-gesture-handler`, `nativewind`, `@expo-google-fonts/{fraunces,caveat,inter}`, `react-native-safe-area-context`. All purely additive across stories.

### Known carry-overs
- 3 lint warnings (`@typescript-eslint/no-require-imports`) in `jest.setup.ts` — `require()` is the idiomatic Jest mock pattern; warning is cosmetic and exit code is 0.
- `.eslintignore` deprecation warning carried from feature 00.

### Public surface delta (for `index.md`)
- New: `src/theme/tokens.ts`, primitives `<Text>`, `<Screen>`, `<Card>`, `<Button>`, `<Chip>`, `<IconButton>`, `/design` route.
- Modified: `Theme` type, `defaultTheme`, `useAppFonts()` (now async-aware, returns `{ fontsLoaded, fontError }`).
