# Feature 00 — Bootstrap

## Spec

### Goal
Establish a runnable Expo + TypeScript project skeleton with lint, test runner, root layout, and path aliases — the floor every later feature builds on.

### Acceptance criteria
- `npm install` succeeds from a clean clone.
- `npm run typecheck` exits 0.
- `npm run lint` exits 0.
- `npm test` exits 0 with at least one passing smoke test.
- `npx expo start --tunnel` (manual check, not gated) boots without runtime errors on iOS Simulator and Android Emulator.
- Path alias `@/*` resolves in TS, Jest, and Babel.
- Root layout (`app/_layout.tsx`) wires: TanStack Query provider, theme provider stub, font loader stub, gesture handler root.
- Project structure matches the layout in `architecture.md`.

### Out of scope
- Any visual design work (palette, fonts, components) — handled in feature 01.
- Audio recording, AI clients, persistence — later features.
- EAS Build / CI configuration — post-MVP.

### Dependencies
None. This is the seed feature.

### Stories
1. `01-expo-typescript-scaffold` — init Expo blank-ts template, strict TS, path alias.
2. `02-lint-format-config` — ESLint (`eslint-config-expo`) + Prettier.
3. `03-jest-test-runner` — Jest + jest-expo + RNTL + smoke test.
4. `04-root-layout-providers` — TanStack Query, theme stub, font loader stub, gesture handler in `app/_layout.tsx`.

## Summary (shipped)

Runnable Expo SDK 54 app skeleton with TypeScript strict, Expo Router, ESLint (flat config), Prettier, Jest + RNTL, and the root provider tree (TanStack Query + ThemeProvider stub + GestureHandlerRootView + font-loader gate). 4 passing tests; `npm test`, `npm run lint`, `npm run typecheck` all exit 0.

### Key decisions made during execution
- **ESLint v9 flat config** (`eslint.config.js`) replaced the originally specified `.eslintrc.js` — `eslint-config-expo@55` pulls in ESLint v9, which dropped legacy config support. `eslint-config-expo/flat` and `eslint-config-prettier/flat` are used.
- **`babel-preset-expo`** is now a top-level devDep (Jest's `babel-jest` couldn't resolve it nested inside `expo`'s `node_modules`).
- **`jest.setup.ts` is a living file** for native-module mocks. It currently contains a `react-native-gesture-handler` mock (the native module crashes in Jest) and a `global.performance` polyfill for Reanimated. Future stories may add to it.
- **`@testing-library/jest-native/extend-expect`** is *not* loaded — RNTL v13+ ships its own Jest matchers, and the original `setupFilesAfterEach` Jest key was invalid.
- **`expo-env.d.ts`** is gitignored; it's auto-generated on first `expo start`. Typecheck passes without it.

### Known carry-overs
- Lint emits one cosmetic deprecation warning about `.eslintignore` — superseded by `ignores` in `eslint.config.js`. Cleanup deferred (no functional impact, exits 0).
- Lint emits one warning on `jest.setup.ts` for `require()` style import (`@typescript-eslint/no-require-imports`). Cleanup deferred.

### Test surface after feature 00
- `__tests__/smoke.test.ts` — sanity
- `__tests__/app/index.test.tsx` — root screen renders inside `<AppProviders>` and shows "WhispnoteAI"
- `__tests__/theme/ThemeProvider.test.tsx` — `useTheme()` returns `defaultTheme` inside provider; throws outside
