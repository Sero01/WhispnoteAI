# Story 03: Jest + RNTL test runner with smoke test

**Tier:** flash

## Goal
Add Jest (with `jest-expo` preset) and React Native Testing Library, plus one passing smoke test. After this story, `npm test` is the canonical validation gate for every subsequent story.

## Context
Stories 01 and 02 set up Expo + TS + lint. This story establishes the test runner. The validation gate for all later stories is `npm test` exiting 0.

## Files in scope
- `package.json` — modify (add devDeps, `test` script, `jest` config)
- `jest.setup.ts` — create (RNTL `cleanup` after each test, silence Reanimated warning)
- `__tests__/smoke.test.ts` — create (one passing assertion)
- `__tests__/app/index.test.tsx` — create (renders `app/index.tsx`, asserts "WhispnoteAI" appears)

## Do not touch
- `app/**`, `src/**` — no source edits
- `.eslintrc.js`, `.prettierrc`, `tsconfig.json`, `babel.config.js`, `app.json` — established earlier
- Anything outside "Files in scope"

## Interface contracts

`package.json` `scripts` must add:
```json
{ "test": "jest", "test:watch": "jest --watch" }
```

DevDependencies to add (latest stable):
- `jest`
- `jest-expo`
- `@testing-library/react-native`
- `@testing-library/jest-native`
- `@types/jest`
- `react-test-renderer` (matching the React version in the project)

`package.json` must include a `jest` block:
```json
{
  "preset": "jest-expo",
  "setupFilesAfterEach": ["@testing-library/jest-native/extend-expect"],
  "setupFiles": ["<rootDir>/jest.setup.ts"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-router|@react-native/js-polyfills|nativewind|react-native-css-interop))"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@app/(.*)$": "<rootDir>/app/$1"
  }
}
```

`__tests__/smoke.test.ts`:
```ts
describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

`__tests__/app/index.test.tsx` must:
- Import the default export of `app/index.tsx`.
- Render it with `@testing-library/react-native`.
- Assert `screen.getByText('WhispnoteAI')` does not throw.

## Implementation notes
- `jest.setup.ts` should call `import '@testing-library/jest-native/extend-expect'` and silence Reanimated's logger if needed (consult `jest-expo` docs for the canonical incantation).
- If `expo-router` testing requires extra mocking, mock the bare minimum needed for the screen import (e.g. mock `expo-router` to a stub if `app/index.tsx` imports anything from it). Do not edit `app/index.tsx`.
- If the React Test Renderer version cannot be resolved cleanly, choose the version matching `react` in `package.json` and pin it as a devDep.

## Acceptance criteria
- [ ] `npm install` exits 0.
- [ ] `npm test` exits 0.
- [ ] At least 2 tests pass: smoke + app/index render.
- [ ] `npm run lint` still exits 0 (regression).
- [ ] `npm run typecheck` still exits 0 (regression).
- [ ] No edits to files outside "Files in scope".

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `test`/`test:watch` scripts, `jest` config block, devDeps (jest, jest-expo, @testing-library/react-native, @testing-library/jest-native, @types/jest, react-test-renderer, babel-preset-expo)
- `jest.setup.ts` — created with global.performance polyfill for Reanimated
- `__tests__/smoke.test.ts` — created with one passing assertion (1+1=2)
- `__tests__/app/index.test.tsx` — created, renders `app/index.tsx` and asserts "WhispnoteAI" is present

**Decisions made:**
- `setupFilesAfterEach` removed from jest config — it is not a valid Jest configuration key. Jest only supports `setupFiles`. The `@testing-library/jest-native/extend-expect` import cannot be used in `setupFiles` because `expect` is not yet available at that point. Since `@testing-library/react-native` v13+ has built-in jest matchers, `@testing-library/jest-native` is retained as a devDep per the spec but its `extend-expect` is not imported at setup time.
- Added `babel-preset-expo` as a top-level devDependency because it is nested inside `expo`'s node_modules and Jest's babel-jest cannot resolve it there.

**Gotchas discovered:**
- `setupFiles` runs before the test framework is installed; `expect` is not available. Any module calling `expect.extend()` at import time (like `@testing-library/jest-native/extend-expect`) will fail with `ReferenceError: expect is not defined`.
- `babel-preset-expo` is a dependency of `expo` but lives in `node_modules/expo/node_modules/`, invisible to Jest's babel-jest transformer. It must be a top-level dep.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 2 passed, 0 failed (smoke + app/index render)
- Command: `npm run lint`
- Exit: 0
- Output summary: ESLint warning about .eslintignore deprecation only; no errors.
- Command: `npm run typecheck`
- Exit: 0
