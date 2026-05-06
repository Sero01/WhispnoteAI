# Feature 09 — Settings & Onboarding

## Spec

### Goal
First-run onboarding flow that captures the user's AI provider choice (OpenAI, Anthropic, or OpenRouter) and API key, stored in `expo-secure-store`. Settings screen lets the user change provider/key later. Settings store is the source of truth read by the AI client (feature 04).

### Acceptance criteria
- `useSettings()` Zustand store: provider, model override (optional), onboarding complete flag.
- `secureStore.ts` wrapper around `expo-secure-store` for the API key; key is **never** persisted in the Zustand store, only fetched on demand.
- `app/onboarding.tsx` (route): provider picker (3 cards), API key input, save → marks onboarded → navigates to `/`.
- `app/_layout.tsx` redirects to `/onboarding` if not onboarded.
- `app/settings.tsx` (route): change provider, change key, model override field for OpenRouter.
- `validateApiKey(provider, key) → Promise<boolean>` — light shape check (length, prefix), no network call.
- All gates green.

### Out of scope
- Real network validation of keys (deferred to feature 04).
- Theme settings, notification settings — post-MVP.

### Dependencies
- Feature 00 (providers, theme), feature 01 (primitives).

### Stories
1. `01-settings-store-and-securestore` — Zustand store + SecureStore wrapper + tests.
2. `02-onboarding-screen` — `/onboarding` route with provider picker + key input.
3. `03-settings-screen-and-redirect` — `/settings` route + onboarded redirect in `_layout`.

## Summary (shipped)

`useSettings` Zustand store (persisted to AsyncStorage at `whispnote.settings`); `secureStore.{get,set,clear}ApiKey` over `expo-secure-store` at `whispnote.apiKey`; shape-only `validateApiKey()` for OpenAI/Anthropic/OpenRouter; `/onboarding` and `/settings` screens; root `_layout` redirects to `/onboarding` until onboarded. Jest extended with CSS module mock so `_layout` is testable.
