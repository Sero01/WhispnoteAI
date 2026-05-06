# Story 01: NativeWind v4 setup

**Tier:** flash

## Goal
Install NativeWind v4 with Tailwind, wire it through Babel + Metro + Jest, and prove a `<View className="bg-[#F4EDE0]" />` renders without throwing in tests.

## Context
Feature 01 establishes the design system. Subsequent stories add fonts, theme tokens, and primitive components — all of which assume NativeWind works. This story sets the runtime up cleanly.

## Files in scope
- `package.json` — modify (add deps + scripts)
- `tailwind.config.js` — create
- `metro.config.js` — create (Expo's `getDefaultConfig` + NativeWind's `withNativeWind`)
- `babel.config.js` — modify (add `nativewind/babel` preset)
- `global.css` — create (Tailwind directives)
- `nativewind-env.d.ts` — create (`/// <reference types="nativewind/types" />`)
- `app/_layout.tsx` — modify (import `'../global.css'` at top)
- `__tests__/nativewind-smoke.test.tsx` — create (renders `<View className="bg-[#F4EDE0]" />` and asserts no throw)
- `jest.setup.ts` — modify (mock `nativewind` to identity passthrough so tests don't depend on the runtime)

## Do not touch
- `tsconfig.json`, `app.json`, `eslint.config.js`, `.prettierrc`
- `app/index.tsx`, `src/**` — primitives land in later stories
- `architecture.md`, `index.md`, `features/**` outside this story file

## Interface contracts

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
```
Theme extension is empty in this story; story 02 fills it from `src/theme/tokens.ts`.

`metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

`babel.config.js` — add `'nativewind/babel'` to `presets` AFTER `'babel-preset-expo'`.

`global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`jest.setup.ts` mock (append, do not remove existing mocks):
```ts
jest.mock('nativewind', () => ({
  cssInterop: () => undefined,
  remapProps: () => undefined,
  styled: (Component: unknown) => Component,
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: () => {}, toggleColorScheme: () => {} }),
  vars: () => ({}),
}));
```

`__tests__/nativewind-smoke.test.tsx`:
```tsx
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

describe('nativewind smoke', () => {
  it('renders a className-tagged View without throwing', () => {
    const { getByText } = render(
      <View className="bg-[#F4EDE0] p-4">
        <Text>ok</Text>
      </View>
    );
    expect(getByText('ok')).toBeTruthy();
  });
});
```

## Implementation notes
- Use NativeWind v4 (latest). Pin `tailwindcss` to the major version NativeWind v4 supports (currently 3.x — let npm resolve via NativeWind's peer dep).
- Expo SDK 54: `metro.config.js` may not exist yet — create it.
- The Babel preset order matters: NativeWind preset must follow `babel-preset-expo`.
- The test mock for `nativewind` is a pragmatic shim. Real RN testing of NativeWind classes is brittle; we only need import resolution to succeed.

## Acceptance criteria
- [ ] `npm install` exits 0.
- [ ] `npm test` exits 0 (the smoke test passes; existing tests still pass).
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] `app/_layout.tsx` includes `import '../global.css';` as the first import.
- [ ] No edits to files outside "Files in scope".

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `nativewind` and `tailwindcss@3.4.17` deps (indirectly via npm install)
- `tailwind.config.js` — created with NativeWind preset and content paths
- `metro.config.js` — created with `getDefaultConfig` + `withNativeWind`
- `babel.config.js` — appended `'nativewind/babel'` to presets after `'babel-preset-expo'`
- `global.css` — created with `@tailwind base/components/utilities` directives
- `nativewind-env.d.ts` — created with `/// <reference types="nativewind/types" />`
- `app/_layout.tsx` — added `import '../global.css';` as first import
- `__tests__/nativewind-smoke.test.tsx` — created smoke test for className-tagged View
- `jest.setup.ts` — appended nativewind mock (cssInterop, remapProps, styled, useColorScheme, vars)

**Public interfaces added/modified:**
- `tailwind.config.js`: module exports with NativeWind preset
- `metro.config.js`: module exports with NativeWind Metro integration
- `babel.config.js`: presets now `['babel-preset-expo', 'nativewind/babel']`
- `global.css`: standard Tailwind directives
- `nativewind-env.d.ts`: TypeScript reference for nativewind types

**Decisions made:**
- Pinned `tailwindcss@3.4.17` explicitly (nativewind v4 peer-dep expects 3.x)
- Placed `import '../global.css'` before all other imports in `_layout.tsx` as requested
- Appended jest mock rather than removing existing gesture-handler mock

**Gotchas discovered:**
- `transformIgnorePatterns` in `package.json` already includes `nativewind` and `react-native-css-interop`, so no config change needed for test transforms
- No existing `__tests__/` directory needed creation — it already existed with other test files

**Deferred work:**
- None — this story is self-contained

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 4 suites passed, 5 tests passed (including the new smoke test)
- Command: `npm run lint`
- Exit: 0
- Output summary: 0 errors, 1 warning (existing `require()` style in jest.setup.ts — pre-existing, not introduced by this story)
- Command: `npm run typecheck`
- Exit: 0
- Output summary: clean, no errors
