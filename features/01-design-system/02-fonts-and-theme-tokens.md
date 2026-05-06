# Story 02: Google Fonts + finalized theme tokens

**Tier:** flash

## Goal
Load Fraunces (display), Caveat (handwritten accent), and Inter (body) via `@expo-google-fonts/*`. Centralize theme tokens in `src/theme/tokens.ts` consumed by both the JS theme object and `tailwind.config.js`. Replace the synchronous `useAppFonts` stub with a real loader.

## Context
Feature 00 shipped `defaultTheme` with placeholder font families and `useAppFonts()` returning `{ fontsLoaded: true }` synchronously. This story makes them real. NativeWind is already wired (story 01); its Tailwind config now reads palette/typography from the same tokens file the JS theme uses.

## Files in scope
- `package.json` — modify (add `@expo-google-fonts/fraunces`, `@expo-google-fonts/caveat`, `@expo-google-fonts/inter`)
- `src/theme/tokens.ts` — create (single source of truth: colors, radii, spacing scale, typography family names, shadow tuples, motion durations)
- `src/theme/index.ts` — modify (consume `tokens.ts` for `defaultTheme`; keep `Theme` shape & `useTheme` signature)
- `src/lib/fonts.ts` — modify (real `useAppFonts()` using `useFonts` from `@expo-google-fonts/*`)
- `tailwind.config.js` — modify (`theme.extend` populated from `tokens.ts` — colors + fontFamily)
- `__tests__/theme/ThemeProvider.test.tsx` — modify (assert `defaultTheme.typography.body === 'Inter_400Regular'` etc.)
- `jest.setup.ts` — modify (mock `useFonts` from each `@expo-google-fonts/*` package to return `[true]` synchronously)

## Do not touch
- `app/**` — no screen edits
- `src/providers/**`, other primitives — handled in later stories
- All other config files

## Interface contracts

`src/theme/tokens.ts` must export:
```ts
export const colors = {
  background: '#F4EDE0',
  surface: '#FFFFFF',
  ink: '#1F1B16',
  inkMuted: '#6B6358',
  accent: {
    sage: '#C7D9B5',
    lavender: '#D6CFE8',
    peach: '#F2C9B0',
    cream: '#F4EDE0',
  },
} as const;

export const radii = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;
export const spacing = (n: number) => n * 4;
export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  accent: 'Caveat_400Regular',
  accentBold: 'Caveat_700Bold',
} as const;
export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  pressed: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
} as const;
export const motion = { fast: 150, base: 220, slow: 360 } as const;
```

`src/theme/index.ts` — `Theme` type extends to:
```ts
export type Theme = {
  colors: typeof tokens.colors;
  radii: typeof tokens.radii;
  spacing: (n: number) => number;
  typography: {                          // narrowed from feature 00 — now exposes the full font set
    display: string; displayBold: string;
    body: string; bodyMedium: string; bodySemibold: string;
    accent: string; accentBold: string;
  };
  shadow: typeof tokens.shadow;
  motion: typeof tokens.motion;
};
export const defaultTheme: Theme; // built from tokens
export function useTheme(): Theme;
```
`useTheme`/`ThemeProvider` API surface unchanged from feature 00 (still throws outside provider).

`src/lib/fonts.ts`:
```ts
export function useAppFonts(): { fontsLoaded: boolean; fontError: Error | null };
```
Implementation calls `useFonts` (from `@expo-google-fonts/fraunces`, `@expo-google-fonts/caveat`, `@expo-google-fonts/inter` — combine the maps into a single `useFonts({...})` call). The return tuple `[loaded, error]` maps to `{ fontsLoaded: loaded, fontError: error }`.

`tailwind.config.js` `theme.extend`:
```js
const tokens = require('./src/theme/tokens');
module.exports = {
  // ... existing fields from story 01
  theme: {
    extend: {
      colors: {
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        ink: tokens.colors.ink,
        'ink-muted': tokens.colors.inkMuted,
        sage: tokens.colors.accent.sage,
        lavender: tokens.colors.accent.lavender,
        peach: tokens.colors.accent.peach,
        cream: tokens.colors.accent.cream,
      },
      fontFamily: {
        display: [tokens.fontFamily.display],
        'display-bold': [tokens.fontFamily.displayBold],
        sans: [tokens.fontFamily.body],
        'sans-medium': [tokens.fontFamily.bodyMedium],
        'sans-semibold': [tokens.fontFamily.bodySemibold],
        handwritten: [tokens.fontFamily.accent],
        'handwritten-bold': [tokens.fontFamily.accentBold],
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
};
```

`jest.setup.ts` mock additions:
```ts
jest.mock('@expo-google-fonts/fraunces', () => ({ useFonts: () => [true, null], Fraunces_600SemiBold: 'Fraunces_600SemiBold', Fraunces_700Bold: 'Fraunces_700Bold' }));
jest.mock('@expo-google-fonts/caveat', () => ({ useFonts: () => [true, null], Caveat_400Regular: 'Caveat_400Regular', Caveat_700Bold: 'Caveat_700Bold' }));
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true, null], Inter_400Regular: 'Inter_400Regular', Inter_500Medium: 'Inter_500Medium', Inter_600SemiBold: 'Inter_600SemiBold' }));
```

## Implementation notes
- `tailwind.config.js` is `require`-based (CommonJS) so `require('./src/theme/tokens')` works because `tokens.ts` only exports plain values (TS compiles to JS at build time; Tailwind reads via Metro/Babel pipeline). If TS interop fails at config load, create a `.cjs` mirror or change `tokens.ts` extension — but try `require` first.
- The `useFonts` call in `src/lib/fonts.ts` should combine all family maps:
  ```ts
  const [loaded, error] = useFonts({
    Fraunces_600SemiBold, Fraunces_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Caveat_400Regular, Caveat_700Bold,
  });
  ```
- `defaultTheme.typography` keys must match `Theme.typography` shape exactly. Update the `ThemeProvider.test.tsx` consumer to read `theme.typography.body` and assert `Inter_400Regular`.
- Do not remove the existing test asserting the throw on `useTheme()` outside provider; keep it.

## Acceptance criteria
- [ ] `npm install` exits 0.
- [ ] `npm test` exits 0 — all existing tests + updated theme test pass.
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] `defaultTheme.typography.body === 'Inter_400Regular'` (asserted in test).
- [ ] `useAppFonts()` returns `{ fontsLoaded: true, fontError: null }` under the mocked `useFonts`.
- [ ] `tailwind.config.js` exposes `text-ink`, `bg-background`, `bg-sage`, `font-display`, `font-handwritten` utilities derivable from `tokens.ts` (verified by inspection — no runtime test required).
- [ ] No edits to files outside "Files in scope".

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `@expo-google-fonts/fraunces`, `@expo-google-fonts/caveat`, `@expo-google-fonts/inter` to dependencies
- `src/theme/tokens.ts` — created (single source of truth for colors, radii, spacing, fontFamily, shadow, motion)
- `src/theme/index.ts` — consume tokens; expanded `Theme` type to include `displayBold`, `bodyMedium`, `bodySemibold`, `accentBold`, `shadow`, `motion`; `defaultTheme` built from tokens
- `src/lib/fonts.ts` — real `useAppFonts()` using `useFonts` from `@expo-google-fonts/inter` with all 7 font assets
- `tailwind.config.js` — `theme.extend` populated from `tokens.ts` (colors, fontFamily, borderRadius)
- `jest.setup.ts` — added mocks for all three `@expo-google-fonts/*` packages
- `__tests__/theme/ThemeProvider.test.tsx` — added assertion: `theme.typography.body === 'Inter_400Regular'`

**Public interfaces added/modified:**
- `src/theme/tokens.ts` exports `colors`, `radii`, `spacing`, `fontFamily`, `shadow`, `motion` (all `as const`)
- `Theme` type expanded with `displayBold`, `bodyMedium`, `bodySemibold`, `accentBold` in `typography`, plus `shadow` and `motion`
- `useAppFonts()` return type changed from `{ fontsLoaded: boolean }` to `{ fontsLoaded: boolean; fontError: Error | null }`

**Decisions made:**
- `tokens.ts` is a plain-value module so it can be `require()`-d by CommonJS `tailwind.config.js` (works because the module only exports primitives and `as const` objects)
- Imported `useFonts` from `@expo-google-fonts/inter` only (avoids duplicate) — all `@expo-google-fonts/*` packages re-export the same hook

**Gotchas discovered:**
- Lint flagged duplicate import from `@expo-google-fonts/inter` when `useFonts` and the individual font assets were imported on separate lines; merged into one import to fix

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 4 suites, 5 tests, all passed

**Lint result:**
- Command: `npm run lint`
- Exit: 0
- Output summary: 0 errors, 1 pre-existing warning (`require()` in jest.setup.ts — outside this story's scope)

**Typecheck result:**
- Command: `npm run typecheck`
- Exit: 0
