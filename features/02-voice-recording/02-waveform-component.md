# Story 02: `<Waveform>` component

**Tier:** flash

## Goal
Visual waveform from a list of amplitude samples (0..1). Bars animate height changes via Reanimated.

## Files in scope
- `package.json` — modify (add `react-native-reanimated` if not already)
- `babel.config.js` — modify (add `react-native-reanimated/plugin` if not already)
- `src/components/Waveform.tsx` — create
- `src/components/index.ts` — modify (export Waveform)
- `__tests__/components/Waveform.test.tsx` — create
- `jest.setup.ts` — modify (mock `react-native-reanimated` if not already mocked by NativeWind setup)

## Do not touch
- Other primitives, theme, db, recording hook (settled)

## Interface contracts

```tsx
// src/components/Waveform.tsx
export type WaveformProps = {
  amplitudes: number[];      // values in [0..1]; component renders at most 64
  color?: 'ink' | 'sage' | 'lavender' | 'peach';   // default 'ink'
  height?: number;           // default 80
  barWidth?: number;         // default 3
  barGap?: number;           // default 4
  testID?: string;
};
export function Waveform(props: WaveformProps): React.ReactElement;
```
- Right-anchored: newest sample appears on the right; older slide left.
- Each bar height = `max(2, amplitude * height)`; bar background = theme color resolved from `color` prop.
- Use Reanimated `withTiming` (200ms) for smooth height transitions when `amplitudes` array changes.
- If amplitudes is empty, renders an empty Row with the given height.

## Implementation notes
- Use `Animated.View` from `react-native-reanimated`. Each bar is keyed by index in the latest `amplitudes` slice.
- `useDerivedValue` per bar would be cleaner — but a simple approach (component-per-bar with `useSharedValue` set in `useEffect`) is fine and easier to test.
- For tests, the reanimated mock from `react-native-reanimated/mock` should already be in `jest.setup.ts` from earlier feature work; if not, implementer adds:
  ```ts
  jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
  ```
  Note the require reference must be string-literal (the babel transform processes this).

## Tests
- Renders the right number of bars equal to `min(amplitudes.length, 64)`.
- Empty amplitudes renders no bars but the container with the given height (assert via `getByTestId(testID).props.style.height === 80`).
- Color prop affects bar background (snapshot or style assertion).

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `react-native-reanimated` to dependencies
- `babel.config.js` — added `react-native-reanimated/plugin`
- `jest.setup.ts` — added manual `react-native-reanimated` mock (built-in mock in v4 imports native modules, so manual `__esModule` mock with `createAnimatedComponent` passthrough was needed); also required by `react-native-gesture-handler` `jest.requireActual`
- `src/components/Waveform.tsx` — created
- `src/components/index.ts` — exported Waveform
- `__tests__/components/Waveform.test.tsx` — created with 7 tests

**Public interfaces added/modified:**
- `src/components/Waveform.tsx` — `Waveform(props: WaveformProps): React.ReactElement`
- `src/components/index.ts` — re-exports `Waveform` + `WaveformProps`

**Decisions made:**
- Manual reanimated mock instead of `require('react-native-reanimated/mock')` because Reanimated v4's built-in mock triggers Worklets native module initialization. Also needed `createAnimatedComponent` passthrough for `react-native-gesture-handler`'s `jest.requireActual`.
- Component-per-bar pattern with `useSharedValue` + `useEffect` + `withTiming` as suggested in the story notes.
- Bars anchored at bottom via container `alignItems: 'flex-end'`.
- Right-anchored by natural LTR iteration (newest = last element).

**Gotchas discovered:**
- Reanimated v4 mock file (`mock.js`) imports from `./src/mock` which reaches into `react-native-worklets` native module — unusable in test. Manual mock required.
- `react-native-gesture-handler`'s mock uses `jest.requireActual` which in v2.31.2 imports reanimated's `createAnimatedComponent`. The mock's `default` export must include this to avoid "is not a function" errors in 5 app test suites.

**Deferred work:**
- ESLint `react-hooks/exhaustive-deps` warning on `Waveform.tsx:29` (`svHeight` not in deps) — this is expected since `svHeight` is a `useSharedValue` ref, not a reactive value. The `targetHeight` dependency is correct.

**Test result:**
- Command: `npm test -- --no-coverage`
- Exit: 0
- Output summary: 23 suites, 138 tests passed
- Lint: 0 errors, 7 warnings (all pre-existing)
- Typecheck: 0 errors
