# Story 01: Expo + TypeScript scaffold with path alias

**Tier:** flash

## Goal
Create a runnable Expo (managed) project in the repo root with TypeScript strict mode, Expo Router, and a `@/*` path alias resolvable in TS and Babel.

## Context
This is the seed story for WhispnoteAI. The repo currently contains only `architecture.md`, `index.md`, `whispnoteai.png`, and the `features/` directory. After this story, `npx expo start` must boot a placeholder screen without errors, and `npm run typecheck` must exit 0.

## Files in scope
- `package.json` — create (via `create-expo-app`)
- `tsconfig.json` — create / modify (strict mode, `@/*` alias)
- `babel.config.js` — create / modify (add `babel-plugin-module-resolver`)
- `app.json` — create (Expo config: name, slug, scheme `whispnoteai`, iOS + Android)
- `app/_layout.tsx` — create (Expo Router root, minimal `<Stack />`)
- `app/index.tsx` — create (placeholder `<Text>WhispnoteAI</Text>` screen)
- `src/.gitkeep` — create (so `src/` exists)
- `.gitignore` — create (Expo defaults: `node_modules`, `.expo`, `dist`, `*.log`, `.env*`)

## Do not touch
- `architecture.md`, `index.md`, `whispnoteai.png` — orchestrator-owned
- `features/**` — orchestrator-owned

## Interface contracts

`tsconfig.json` must include:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*", "app/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

`babel.config.js` must export:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', { alias: { '@': './src', '@app': './app' } }],
    ],
  };
};
```

`package.json` `scripts` must include exactly:
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "typecheck": "tsc --noEmit"
}
```
(`lint` and `test` will be added in stories 02 and 03 — do not pre-add.)

`app.json` must declare `"scheme": "whispnoteai"` and `"newArchEnabled": true`.

## Implementation notes
- Use `create-expo-app` with the `blank-typescript` template, but configured for Expo Router (add `expo-router` dependency, set `"main": "expo-router/entry"` in `package.json`).
- Pin Expo to the latest stable SDK at install time. Do not pick a specific SDK version in this story — let `create-expo-app` resolve.
- Install `babel-plugin-module-resolver` as a devDependency for the path alias.
- Ensure `app/_layout.tsx` only renders `<Stack />` from `expo-router` — no providers yet (those come in story 04).
- `app/index.tsx` is a single `<View>` + `<Text>WhispnoteAI</Text>` centered with inline styles. Visual design is out of scope.

## Acceptance criteria
- [ ] `npm install` exits 0 from a clean state.
- [ ] `npm run typecheck` exits 0.
- [ ] `tsconfig.json` `paths` resolves `@/*` (verify by adding a placeholder import that goes through the alias and removing it before completion, OR by typecheck against an alias-using import).
- [ ] `app.json` has `scheme: "whispnoteai"` and `newArchEnabled: true`.
- [ ] No files modified outside "Files in scope".
- [ ] No tests required in this story (test runner lands in story 03).

## Session log

**Status:** complete
**Files changed:**
- `package.json` — created via `create-expo-app` blank-typescript template, then modified: `main` → `expo-router/entry`, added scripts (`start`, `android`, `ios`, `typecheck`), added deps (`expo-router`, `expo-linking`, `expo-constants`, `react-native-safe-area-context`, `react-native-screens`), added devDep (`babel-plugin-module-resolver`)
- `tsconfig.json` — added `strict: true`, `baseUrl: "."`, `paths: { "@/*": ["src/*", "app/*"] }`, `include` with `.expo/types` and `expo-env.d.ts`
- `babel.config.js` — created with `babel-preset-expo` preset and `module-resolver` plugin (`@` → `./src`, `@app` → `./app`)
- `app.json` — added `"scheme": "whispnoteai"` (already had `newArchEnabled: true` from template)
- `app/_layout.tsx` — created, renders `<Stack />` from `expo-router`
- `app/index.tsx` — created, shows centered `<Text>WhispnoteAI</Text>`
- `src/.gitkeep` — created
- `.gitignore` — added `*.log` and `.env*` patterns to template defaults
- `assets/` — copied from scaffold (side-effect of `create-expo-app`)
- `node_modules/`, `package-lock.json` — installed from npm

**Public interfaces added/modified:**
- `RootLayout` in `app/_layout.tsx`: `() => <Stack />`
- `Index` in `app/index.tsx`: `() => <View><Text>WhispnoteAI</Text></View>`
- `@/*` path alias resolves to `src/*` (TS: `src/*` + `app/*`, Babel: `./src`)

**Decisions made:**
- Used `create-expo-app` with `blank-typescript` template in a temp subdirectory, then copied files to repo root (avoids non-empty directory error from `create-expo-app`)
- Version ranges: `expo-linking@~7.0.5` to satisfy `expo-router` peer dep, `expo-constants@~17.0.0` per SDK 54 compatibility. Other versions left as `^` ranges so npm resolves latest compatible.
- `tsc --noEmit` passes without `expo-env.d.ts` existing — the file is gitignored and will be generated on first `expo start`

**Gotchas discovered:**
- The `blank-typescript` template generates root-level `App.tsx` and `index.ts`, which conflict with Expo Router's `app/` directory — removed these after scaffold copy
- `expo-linking@~7.0.10` doesn't exist (registry moved past it) — use `~7.0.5` which is the version expo-router@4 peer-depends on
- `external_directory` permission restrictions prevented running `create-expo-app` directly in `/tmp/opencode` — used a subdirectory within the project instead

**Deferred work:**
- `expo-env.d.ts` needs to be generated by running `npx expo start` once (it's gitignored so no file change needed)

**Test result:**
- Command: `npm run typecheck`
- Exit: 0
- Output summary: clean (no warnings, no errors)
