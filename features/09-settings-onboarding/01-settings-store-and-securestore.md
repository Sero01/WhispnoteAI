# Story 01: Settings store + SecureStore wrapper

**Tier:** flash

## Goal
Zustand store for non-secret settings (provider, model override, onboarded flag) persisted to `AsyncStorage`. SecureStore wrapper for the API key (read on demand, never in JS state). `validateApiKey()` shape validator.

## Files in scope
- `package.json` — modify (add `zustand`, `@react-native-async-storage/async-storage`, `expo-secure-store`)
- `src/store/settings.ts` — create (Zustand store with `persist` middleware → AsyncStorage)
- `src/lib/secureStore.ts` — create (typed wrappers `getApiKey()`, `setApiKey()`, `clearApiKey()`)
- `src/lib/validateApiKey.ts` — create
- `__tests__/store/settings.test.ts` — create
- `__tests__/lib/secureStore.test.ts` — create
- `__tests__/lib/validateApiKey.test.ts` — create
- `jest.setup.ts` — modify (mock `expo-secure-store` and `@react-native-async-storage/async-storage`)

## Do not touch
- `app/**`, `src/components/**`, `src/theme/**`, config files

## Interface contracts

```ts
// src/store/settings.ts
export type AIProvider = 'openai' | 'anthropic' | 'openrouter';
export type SettingsState = {
  provider: AIProvider | null;
  modelOverride: string | null;          // OpenRouter only; null = use default
  onboarded: boolean;
};
export type SettingsActions = {
  setProvider(p: AIProvider): void;
  setModelOverride(m: string | null): void;
  setOnboarded(v: boolean): void;
  reset(): void;
};
export const useSettings: import('zustand').UseBoundStore<
  import('zustand').StoreApi<SettingsState & SettingsActions>
>;
```
- Persisted via `zustand/middleware` `persist` to AsyncStorage under key `whispnote.settings`.
- Initial state: `{ provider: null, modelOverride: null, onboarded: false }`.

```ts
// src/lib/secureStore.ts
export async function getApiKey(): Promise<string | null>;
export async function setApiKey(key: string): Promise<void>;
export async function clearApiKey(): Promise<void>;
```
- Stored under key `whispnote.apiKey`.
- All wrap `expo-secure-store` `getItemAsync`/`setItemAsync`/`deleteItemAsync`.
- Errors propagate.

```ts
// src/lib/validateApiKey.ts
export function validateApiKey(provider: AIProvider, key: string): { ok: boolean; reason?: string };
```
Shape rules (no network call):
- `openai`: must start with `sk-` and length >= 30.
- `anthropic`: must start with `sk-ant-` and length >= 30.
- `openrouter`: must start with `sk-or-` and length >= 20.
- Trims whitespace before checking.

## jest.setup.ts mocks (additive)
```ts
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => { store[k] = v; }),
    deleteItemAsync: jest.fn(async (k: string) => { delete store[k]; }),
  };
});
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn(async (k: string) => { delete store[k]; }),
      clear: jest.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    },
  };
});
```

## Test coverage
- `validateApiKey`: each provider rejects too-short and wrong-prefix; accepts well-formed; trims whitespace.
- `secureStore`: `set` then `get` returns the value; `clear` then `get` returns null.
- `settings` store: actions update state; `reset` returns to initial; persistence key is `whispnote.settings`.

## Acceptance criteria
- [ ] `npm test` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `zustand@4`, `@react-native-async-storage/async-storage`, `expo-secure-store`
- `src/store/settings.ts` — created Zustand store with persist middleware to AsyncStorage
- `src/lib/secureStore.ts` — created typed wrappers for expo-secure-store
- `src/lib/validateApiKey.ts` — created shape validator for API keys
- `__tests__/store/settings.test.ts` — tests for settings store actions and reset
- `__tests__/lib/secureStore.test.ts` — tests for set/get/clear
- `__tests__/lib/validateApiKey.test.ts` — tests for all three providers
- `jest.setup.ts` — added mocks for expo-secure-store and @react-native-async-storage/async-storage

**Public interfaces added/modified:**
- `src/store/settings.ts`: exports `AIProvider`, `SettingsState`, `SettingsActions`, `useSettings`
- `src/lib/secureStore.ts`: exports `getApiKey()`, `setApiKey()`, `clearApiKey()`
- `src/lib/validateApiKey.ts`: exports `validateApiKey(provider, key)`

**Decisions made:**
- Used `zustand@4` (not v5) because the interface contract specifies v4-style `create` typing.
- Persistence key `whispnote.settings` and secure store key `whispnote.apiKey` as specified.

**Gotchas discovered:**
- Initial `__tests__/lib/secureStore.test.ts` had an unused `SecureStore` import that caused a lint error; removed it.

**Deferred work:**
- None.

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 14 suites, 74 tests passed
- Command: `npm run lint` — exit 0 (3 pre-existing warnings about `require()` in jest.setup.ts, not from this story)
- Command: `npm run typecheck` — exit 0
