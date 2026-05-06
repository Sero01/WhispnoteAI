# Story 04: `<Screen>` and `<Card>` primitives

**Tier:** flash

## Goal
Add layout primitives: `<Screen>` (safe-area + background + padding shell) and `<Card>` (rounded surface with accent color rotation, soft shadow, generous padding). These match the visual language in `whispnoteai.png`.

## Context
Story 03 shipped the `<Text>` primitive. This story builds the layout containers screens use to compose content. `<Card>` is the central visual motif of the app (each AI-generated note becomes a card).

## Files in scope
- `src/components/Screen.tsx` — create
- `src/components/Card.tsx` — create
- `src/components/index.ts` — modify (export Screen + Card)
- `__tests__/components/Screen.test.tsx` — create
- `__tests__/components/Card.test.tsx` — create

## Do not touch
- `src/components/Text.tsx` — settled
- `app/**`, `src/theme/**`, `src/lib/**`, `src/providers/**`
- All config files

## Interface contracts

```tsx
// src/components/Screen.tsx
import { type ViewProps } from 'react-native';

export type ScreenProps = ViewProps & {
  background?: 'background' | 'surface';   // default: 'background' (cream)
  padding?: 'none' | 'sm' | 'md' | 'lg';   // default: 'md' (theme.spacing(5) = 20)
  scroll?: boolean;                        // default: false; if true, wraps content in ScrollView
  children: React.ReactNode;
};

export function Screen(props: ScreenProps): React.ReactElement;
```
- Wraps children in `SafeAreaView` (from `react-native-safe-area-context`).
- Applies `flex: 1`, background color from theme, and horizontal+vertical padding from spacing scale.
- When `scroll`, wraps content in `<ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(8) }}>`.

```tsx
// src/components/Card.tsx
import { type ViewProps } from 'react-native';

export type CardAccent = 'sage' | 'lavender' | 'peach' | 'cream' | 'surface';
export type CardSize = 'sm' | 'md' | 'lg';   // drives padding + min height; maps from importance later

export type CardProps = ViewProps & {
  accent?: CardAccent;            // default: 'surface' (white)
  size?: CardSize;                // default: 'md'
  bordered?: boolean;             // default: false; thin ink-muted border
  children: React.ReactNode;
};

export function Card(props: CardProps): React.ReactElement;
```
- Border radius `theme.radii.xl` (28).
- Background = accent color (theme.colors.surface for 'surface', theme.colors.accent[*] otherwise).
- Padding by size: sm=`spacing(4)`, md=`spacing(5)`, lg=`spacing(6)`.
- minHeight by size: sm=96, md=140, lg=200.
- Shadow: theme.shadow.card (cross-platform — works on iOS via `shadow*`, Android via `elevation`).
- If `bordered`: `borderWidth: 1, borderColor: theme.colors.inkMuted` with 30% opacity. Use `'rgba(...)'` form.

`src/components/index.ts` exports add:
```ts
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
export { Card } from './Card';
export type { CardProps, CardAccent, CardSize } from './Card';
```

## Implementation notes
- For `SafeAreaView`, use `react-native-safe-area-context` (already a transitive dep of `expo-router`).
- For ScrollView, use the `react-native` import (not gesture-handler's), since we're not nesting in nav surfaces yet.
- Memoize style objects on `[theme, ...props]`.
- Tests should wrap in `<AppProviders>` for theme + safe area context. Mock `react-native-safe-area-context` if it gets in the way:
  ```ts
  jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
      SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
      SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: unknown }) =>
        require('react-native').createElement('View', { style }, children),
      useSafeAreaInsets: () => inset,
    };
  });
  ```
  Add this mock to `jest.setup.ts` once and reuse across tests in this story and future ones.

## Acceptance criteria
- [ ] `npm test` exits 0 with new tests:
  - Screen renders children inside SafeAreaView with background color = `theme.colors.background`
  - Screen with `scroll` wraps in ScrollView (assert via component tree or testID)
  - Card default has `borderRadius: 28` and `backgroundColor: theme.colors.surface`
  - Card with `accent="sage"` uses `theme.colors.accent.sage` as background
  - Card with `bordered` has a 1px border
  - Card sizes apply expected `padding` and `minHeight`
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] No edits to files outside "Files in scope" (except `jest.setup.ts` IF you choose to add the safe-area mock there — that's allowed).
- [ ] If `jest.setup.ts` is modified, the modification is purely additive (the new mock).

## Session log

**Status:** complete
**Files changed:**
- `src/components/Screen.tsx` — created
- `src/components/Card.tsx` — created
- `src/components/index.ts` — added Screen and Card exports
- `jest.setup.ts` — added react-native-safe-area-context mock
- `__tests__/components/Screen.test.tsx` — created
- `__tests__/components/Card.test.tsx` — created

**Public interfaces added/modified:**
- `ScreenProps` (`src/components/Screen.tsx:5`): `{ background?, padding?, scroll?, children, ...ViewProps }`
- `Screen(props: ScreenProps): React.ReactElement` (`src/components/Screen.tsx:16`)
- `CardAccent = 'sage' | 'lavender' | 'peach' | 'cream' | 'surface'` (`src/components/Card.tsx:5`)
- `CardSize = 'sm' | 'md' | 'lg'` (`src/components/Card.tsx:6`)
- `CardProps` (`src/components/Card.tsx:8`): `{ accent?, size?, bordered?, children, ...ViewProps }`
- `Card(props: CardProps): React.ReactElement` (`src/components/Card.tsx:49`)

**Decisions made:**
- Used `react-native-safe-area-context`'s `SafeAreaView` as the root element for `Screen`, passing `{...rest}` through for testID etc.
- For `Card.bordered`, used `hexToRgba` helper to convert `theme.colors.inkMuted` (`#6B6358`) to `rgba(107, 99, 88, 0.3)` since the spec required 30% opacity via `rgba(...)` form.
- `paddingHorizontal` and `paddingVertical` set identically in Screen, derived from `spacing(n)` via a lookup map.

**Gotchas discovered:**
- `require('react-native').createElement` does not exist (createElement is from React, not RN). The mock SafeAreaView needed `require('react').createElement(require('react-native').View, ...)` instead.
- `@testing-library/react-native`'s `getByText` only finds text inside `<Text>` components, not bare text children of `<View>`. Tests were updated to use `getByTestId` on child `<Text>` elements.
- Mock `SafeAreaView` needed to forward `testID` and `...rest` so that Screen testID assertions work.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 7 suites passed, 21 tests passed
- Command: `npm run lint`
- Exit: 0 (3 warnings: `require()` usage in jest.setup.ts mock — acceptable)
- Command: `npm run typecheck`
- Exit: 0
