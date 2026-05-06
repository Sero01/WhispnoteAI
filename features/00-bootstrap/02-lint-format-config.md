# Story 02: ESLint + Prettier config

**Tier:** flash

## Goal
Add ESLint (`eslint-config-expo`) and Prettier with a `lint` npm script that exits 0 on the current source tree.

## Context
Story 01 established the Expo + TS scaffold. This story adds lint/format. After this, `npm run lint` is the second validation gate (alongside `typecheck`). Story 03 will add the test runner.

## Files in scope
- `package.json` — modify (add devDeps + `lint` script)
- `.eslintrc.js` — create
- `.prettierrc` — create
- `.prettierignore` — create
- `.eslintignore` — create

## Do not touch
- `app/**`, `src/**` — no source edits in this story; lint must pass on what story 01 produced
- `tsconfig.json`, `babel.config.js`, `app.json` — established in story 01
- Anything outside "Files in scope"

## Interface contracts

`package.json` `scripts` must add:
```json
{ "lint": "eslint . --ext .ts,.tsx,.js,.jsx" }
```

DevDependencies to add (latest stable, let npm resolve):
- `eslint`
- `eslint-config-expo`
- `eslint-config-prettier`
- `prettier`

`.eslintrc.js` must export:
```js
module.exports = {
  extends: ['expo', 'prettier'],
  ignorePatterns: ['/dist/*', '/node_modules/*', '/.expo/*'],
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
```

`.prettierrc` must export:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

`.eslintignore` and `.prettierignore` must include: `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`.

## Implementation notes
- If `eslint-config-expo` requires `@typescript-eslint/*` peer deps, install them as devDeps too.
- Do NOT auto-fix files in story 01. If lint fails, the spec for story 01 was wrong — flag it in the session log instead of editing those files.

## Acceptance criteria
- [ ] `npm install` exits 0.
- [ ] `npm run lint` exits 0 on the current tree.
- [ ] `npm run typecheck` still exits 0 (regression check).
- [ ] No edits to files outside "Files in scope".
- [ ] No source files (under `app/` or `src/`) were modified.

## Session log

**Status:** complete

**Files changed:**
- `package.json` — added `lint` script and devDependencies (eslint, eslint-config-expo, eslint-config-prettier, prettier)
- `eslint.config.js` — created (flat config, ESLint v9 format)
- `.prettierrc` — created
- `.eslintignore` — created (deprecated by ESLint v9 but kept for compatibility)
- `.prettierignore` — created
- `.eslintrc.js` — created then deleted (ESLint v9 dropped `.eslintrc.*` support; replaced with `eslint.config.js`)

**Public interfaces added/modified:**
- `package.json` scripts: `"lint": "eslint . --ext .ts,.tsx,.js,.jsx"`
- DevDeps added: `eslint`, `eslint-config-expo`, `eslint-config-prettier`, `prettier`

**Decisions made:**
- Used `eslint.config.js` (flat config) instead of `.eslintrc.js` because `eslint-config-expo@55` depends on ESLint v9, which no longer supports `.eslintrc.*` files.
- Imported `@typescript-eslint/eslint-plugin` directly in `eslint.config.js` to override `@typescript-eslint/no-unused-vars` rule within flat config's plugin scoping rules.
- Both `eslint-config-expo/flat` and `eslint-config-prettier/flat` are compatible with flat config, so no peer dep issues.

**Gotchas discovered:**
- ESLint v9 requires `eslint.config.js` (flat config), not `.eslintrc.js`. The story spec was written assuming ESLint v8, but `eslint-config-expo@55` pulls in ESLint v9.
- In flat config, the `ignores` property is placed on a config object without `files`, not in a `ignorePatterns` string. The `.eslintignore` file is deprecated and produces a warning but still works.

**Deferred work:**
- `.eslintignore` could be removed in a future story once the warning is cleaned up — the `ignores` in `eslint.config.js` already covers the same paths.

**Test result:**
- Command: `npm run lint`
- Exit: 0
- Output summary: Passes cleanly (one deprecation warning about `.eslintignore`)
- Command: `npm run typecheck`
- Exit: 0
- Output summary: Passes cleanly
