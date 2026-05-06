# Story 03: `<Text>` primitive with variants

**Tier:** flash

## Goal
Build the foundational `<Text>` primitive with typographic variants (`display | title | body | eyebrow | handwritten`) and color variants from the theme. Every later screen consumes this — never raw `react-native` `Text`.

## Context
Stories 01–02 wired NativeWind, fonts, and theme tokens. This story creates the typography primitive that every other primitive (Card title, Button label, Chip text) and screen depends on.

## Files in scope
- `src/components/Text.tsx` — create
- `src/components/index.ts` — create (barrel exports for primitives)
- `__tests__/components/Text.test.tsx` — create

## Do not touch
- `app/**`, `src/theme/**`, `src/lib/**`, `src/providers/**`
- All config files
- `src/components/index.ts` if pre-existing — but it isn't yet, so create it

## Interface contracts

```tsx
// src/components/Text.tsx
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'display' | 'title' | 'body' | 'eyebrow' | 'handwritten';
export type TextColor = 'ink' | 'inkMuted' | 'background' | 'surface';

export type TextProps = Omit<RNTextProps, 'children'> & {
  variant?: TextVariant;        // default: 'body'
  color?: TextColor;            // default: 'ink'
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';  // applies to body/title; ignored on display/handwritten/eyebrow which have fixed weights
  align?: 'left' | 'center' | 'right';  // default: 'left'
  children: React.ReactNode;
};

export function Text(props: TextProps): React.ReactElement;
```

Variant style spec (use theme tokens via `useTheme()` — not Tailwind classes for this story; we build everything via `style` prop so tests can assert flattened styles):

| variant | fontFamily | fontSize | lineHeight | letterSpacing |
|---|---|---|---|---|
| `display` | `theme.typography.displayBold` | 40 | 44 | -0.5 |
| `title` | `theme.typography.bodySemibold` (default) / `displayBold` if weight='bold' | 22 | 28 | -0.2 |
| `body` | `theme.typography.body` (default), `bodyMedium` if weight='medium', `bodySemibold` if 'semibold' | 16 | 24 | 0 |
| `eyebrow` | `theme.typography.bodySemibold` | 11 | 14 | 1.2 (uppercase via `textTransform`) |
| `handwritten` | `theme.typography.accent` | 18 | 22 | 0 |

Color resolution: read `theme.colors.ink`, `theme.colors.inkMuted`, `theme.colors.background`, `theme.colors.surface`.

`src/components/index.ts`:
```ts
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor } from './Text';
```

## Implementation notes
- Compose styles inline using `useTheme()`. Memoize with `useMemo` keyed on `[theme, variant, color, weight, align]` to avoid re-allocating on every render.
- Default `variant='body'`, `color='ink'`, `weight='regular'`, `align='left'`.
- For `eyebrow`, set `textTransform: 'uppercase'`.
- Pass through any other RN `TextProps` (numberOfLines, ellipsizeMode, accessibilityRole, etc.).

## Acceptance criteria
- [ ] `npm test` exits 0 with at least 5 new test cases:
  - renders default (body) with `theme.colors.ink` and `Inter_400Regular`
  - renders `variant="display"` with display font + size 40
  - renders `variant="handwritten"` with accent font
  - renders `variant="eyebrow"` with `textTransform: 'uppercase'`
  - renders `color="inkMuted"` and applies the muted color value
  - throws when used outside `<ThemeProvider>` (because `useTheme` does)
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] `Text` is exported from `src/components/index.ts`.
- [ ] No edits to files outside "Files in scope".

### Testing tip
Wrap renders in `<ThemeProvider>` (or `<AppProviders>`) — the test for the throw-outside-provider case should NOT wrap. Use `getByText(...).props.style` (after flattening) to assert font family / color values.

## Session log

**Status:** complete
**Files changed:**
- `src/components/Text.tsx` — created `<Text>` primitive with variant/color/weight/align support
- `src/components/index.ts` — created barrel export for primitives
- `__tests__/components/Text.test.tsx` — created 6 test cases

**Public interfaces added/modified:**
- `Text(props: TextProps): React.ReactElement` in `src/components/Text.tsx`
- Types: `TextVariant`, `TextColor`, `TextProps` exported from `src/components/index.ts`

**Decisions made:**
- For body variant with weight='bold', falls back to `bodySemibold` (Inter_600SemiBold) since no Inter_700Bold is loaded. The spec only lists regular/medium/semibold mappings for body; bold is treated as semibold since it's the heaviest weight available.
- Style composition uses inline style array + `useMemo` keyed on `[theme, variant, color, weight, align, style]` as specified.

**Gotchas discovered:**
- `StyleSheet.flatten()` needs a `style` value, not a `ReactElement` — test helper accesses `element.props.style` directly.
- The pre-existing `jest.setup.ts` uses `require()` which triggers an ESLint warning but this is pre-existing (not in scope).

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 5 suites, 11 tests (6 new + 5 pre-existing), all passed
- Command: `npm run lint`
- Exit: 0 (1 pre-existing warning in `jest.setup.ts`, 0 errors)
- Command: `npm run typecheck`
- Exit: 0
