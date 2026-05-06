# Story 05: `<Button>`, `<Chip>`, `<IconButton>`

**Tier:** flash

## Goal
Add interactive primitives matching the design language: `<Button>` (primary/ghost variants, 3 sizes), `<Chip>` (filter and tag variants), `<IconButton>` (circular touch target, used for +new, mic, more, etc.).

## Context
Stories 03–04 shipped Text and layout primitives. This story closes out the interactive primitives. Future screens compose these — recording screen needs `<IconButton>` for the mic, library screen needs `<Chip>` for filters and `<Button>` for the FAB.

## Files in scope
- `src/components/Button.tsx` — create
- `src/components/Chip.tsx` — create
- `src/components/IconButton.tsx` — create
- `src/components/index.ts` — modify (export the three)
- `__tests__/components/Button.test.tsx` — create
- `__tests__/components/Chip.test.tsx` — create
- `__tests__/components/IconButton.test.tsx` — create

## Do not touch
- Existing primitives (Text, Screen, Card)
- All config files

## Interface contracts

```tsx
// src/components/Button.tsx
import { type PressableProps } from 'react-native';

export type ButtonVariant = 'primary' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;        // default: 'primary'
  size?: ButtonSize;              // default: 'md'
  accent?: 'sage' | 'lavender' | 'peach';   // only used when variant='accent'; default 'sage'
  label: string;                  // required; rendered via <Text variant="body" weight="semibold">
  loading?: boolean;              // shows ActivityIndicator and disables press
  fullWidth?: boolean;            // default: false
};

export function Button(props: ButtonProps): React.ReactElement;
```
- Primary: bg `theme.colors.ink`, label color `theme.colors.background`.
- Ghost: transparent bg, ink border (1px), label `theme.colors.ink`.
- Accent: bg `theme.colors.accent[accent]`, label `theme.colors.ink`.
- Heights by size: sm=36, md=44, lg=56. Horizontal padding: sm=12, md=16, lg=24.
- Border radius `theme.radii.pill` (999).
- Pressed state: opacity 0.85.

```tsx
// src/components/Chip.tsx
import { type PressableProps } from 'react-native';

export type ChipVariant = 'filter' | 'tag';
export type ChipProps = Omit<PressableProps, 'children'> & {
  variant?: ChipVariant;            // default: 'filter'
  selected?: boolean;               // applies only to 'filter' variant; default false
  accent?: 'sage' | 'lavender' | 'peach' | 'cream'; // only used by 'tag' variant; default 'cream'
  label: string;
};

export function Chip(props: ChipProps): React.ReactElement;
```
- Filter selected: bg `theme.colors.ink`, label `theme.colors.background`.
- Filter unselected: bg `theme.colors.surface`, label `theme.colors.ink`, border 1px `inkMuted` at 25% opacity.
- Tag: bg `theme.colors.accent[accent]`, label `theme.colors.ink`, no border.
- Height 30, horizontal padding 12, border radius `theme.radii.pill`.
- Label rendered via `<Text variant="body" weight="medium">`.

```tsx
// src/components/IconButton.tsx
import { type PressableProps } from 'react-native';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  size?: 'sm' | 'md' | 'lg';        // default: 'md'  (32, 44, 64)
  variant?: 'plain' | 'filled' | 'accent';  // default: 'plain'
  accent?: 'sage' | 'lavender' | 'peach';
  accessibilityLabel: string;       // REQUIRED — IconButtons have no visible label
  children: React.ReactNode;        // expected: a single icon node
};

export function IconButton(props: IconButtonProps): React.ReactElement;
```
- Plain: transparent bg.
- Filled: bg `theme.colors.surface`, soft shadow (theme.shadow.pressed).
- Accent: bg `theme.colors.accent[accent]`, soft shadow.
- Border radius: full circle (`size/2`).
- Pressed state: scale to 0.95 via `style` callback.

`src/components/index.ts` add:
```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { Chip } from './Chip';
export type { ChipProps, ChipVariant } from './Chip';
export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';
```

## Implementation notes
- Use `Pressable` from `react-native`. Never `TouchableOpacity` — Pressable is the modern API.
- Buttons render their label via the `<Text>` primitive from story 03 (do NOT import RN Text directly).
- For `loading` Button, render `<ActivityIndicator color={labelColor} />` instead of label and set `disabled` on Pressable.
- For pressed state on Pressable, use the function form of `style`: `style={({ pressed }) => [base, pressed && pressedStyle]}`.
- Memoize style derivations.

## Acceptance criteria
- [ ] `npm test` exits 0 with new tests covering at minimum:
  - Button primary renders label and applies primary bg
  - Button ghost has 1px border
  - Button loading renders an ActivityIndicator (not the label)
  - Button onPress fires when pressed (use `fireEvent.press`)
  - Chip filter selected uses ink bg
  - Chip tag with accent="sage" uses sage bg
  - IconButton requires `accessibilityLabel` (TS-level — verify by passing it and reading via `getByLabelText`)
  - IconButton onPress fires when pressed
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] No edits to files outside "Files in scope".

## Session log

**Status:** complete
**Files changed:**
- `src/components/Button.tsx` — create: primary/ghost/accent variants, sm/md/lg sizes, loading, fullWidth
- `src/components/Chip.tsx` — create: filter (selected/unselected) and tag variants, accent colors
- `src/components/IconButton.tsx` — create: plain/filled/accent variants, circular, sm/md/lg sizes
- `src/components/index.ts` — modify: add Button, Chip, IconButton exports
- `__tests__/components/Button.test.tsx` — create: 11 test cases covering all variants, sizes, loading, onPress
- `__tests__/components/Chip.test.tsx` — create: 9 test cases covering all variants, selected state, accent colors, onPress
- `__tests__/components/IconButton.test.tsx` — create: 12 test cases covering all variants, sizes, accessibilityLabel, onPress, children

**Public interfaces added/modified:**
- `Button(props: ButtonProps): ReactElement` — from `@/components/Button`
- `Chip(props: ChipProps): ReactElement` — from `@/components/Chip`
- `IconButton(props: IconButtonProps): ReactElement` — from `@/components/IconButton`

**Decisions made:**
- Used `Pressable` (not `TouchableOpacity`) per spec. Pressed states: opacity 0.85 for Button/Chip, scale 0.95 for IconButton.
- Button loading renders `ActivityIndicator` with color matching label color, disables Pressable.
- Chip filter unselected border uses `hexToRgba(inkMuted, 0.25)` to match the 25% opacity spec (reused existing `hexToRgba` helper from Card.tsx pattern).
- IconButton border radius computed as `dim / 2` for a perfect circle.
- All components memoize style derivations with `useMemo`.

**Gotchas discovered:**
- `hexToRgba` helper didn't exist as a shared utility; duplicated the existing pattern from `src/components/Card.tsx` into `Chip.tsx`.
- The theme's `shadow.pressed` token already exists and was reused for IconButton filled/accent variants.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 10 suites, 53 tests passed (30 new)
- Lint: 0 errors, 3 pre-existing warnings — exit 0
- Typecheck: exit 0
