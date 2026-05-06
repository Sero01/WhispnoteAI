# Story 02: Onboarding screen

**Tier:** flash

## Goal
`/onboarding` route with provider picker (3 cards) + API key input + save button. On valid save: persists provider + key, marks onboarded, navigates to `/`.

## Files in scope
- `app/onboarding.tsx` — create
- `src/features/onboarding/ProviderPicker.tsx` — create
- `__tests__/app/onboarding.test.tsx` — create

## Do not touch
- `src/store/settings.ts`, `src/lib/secureStore.ts`, `src/lib/validateApiKey.ts` — settled in story 01
- `app/index.tsx`, `app/_layout.tsx` — `_layout` redirect lands in story 03
- All config files except none

## Interface contracts

`src/features/onboarding/ProviderPicker.tsx`:
```tsx
type Props = { value: AIProvider | null; onChange: (p: AIProvider) => void };
export function ProviderPicker(props: Props): React.ReactElement;
```
Renders 3 `<Card>` (full width, accent rotation: openai=sage, anthropic=lavender, openrouter=peach), each shows provider name (Text variant="title") + 1-line tagline, and a checkmark on selected. Tap calls `onChange`.

`app/onboarding.tsx`:
- Wraps in `<Screen scroll>`.
- Renders: `<Text variant="display">Welcome</Text>`, `<Text variant="body" color="inkMuted">Choose how you'd like Whispnote to organize your notes.</Text>`, `<ProviderPicker>`, `<TextInput>` for API key (RN's TextInput, secureTextEntry=true, with custom container styled via theme), an inline error `<Text color="ink">{error}</Text>` shown when validation fails, `<Button label="Get started" fullWidth disabled until both selected and key entered>`.
- On save: calls `validateApiKey(provider, key)`. If ok: `await setApiKey(key); useSettings.getState().setProvider(provider); useSettings.getState().setOnboarded(true); router.replace('/')`. If not ok: show `result.reason` in the error text.

Use `useRouter` from `expo-router`.

## Implementation notes
- TextInput styling: 1px border `inkMuted` at 25% opacity, radius `theme.radii.lg`, padding `spacing(3)`, font family `bodyMedium`, height 48.
- Disable the button until both provider chosen AND key non-empty after trim.
- The page should use `<Screen padding="md" scroll>`.

## Tests
- Renders the 3 provider cards.
- Selecting a provider sets the active state (snapshot or text assert "Selected" indicator on the chosen one).
- With empty key + no provider, button is disabled.
- With well-formed openai key + provider selected, pressing the button calls `setApiKey` (assert via mock) and `router.replace('/')` (mock `useRouter`).
- With malformed key, an error message shows.

Mock `expo-router`'s `useRouter`:
```ts
const replace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace }), Stack: { Screen: () => null } }));
```

## Acceptance criteria
- [ ] `npm test` exits 0 with new tests.
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.

## Session log

**Status:** complete
**Files changed:**
- `src/features/onboarding/ProviderPicker.tsx` — created (3 provider cards with accent rotation, checkmark on selected)
- `app/onboarding.tsx` — created (welcome text, ProviderPicker, secure TextInput, error display, Get started button with save flow)
- `__tests__/app/onboarding.test.tsx` — created (5 tests: renders 3 cards, selection shows checkmark, disabled state, valid save calls setApiKey + router.replace, malformed key shows error)

**Public interfaces added/modified:**
- `ProviderPicker(props: { value: AIProvider | null; onChange: (p: AIProvider) => void }): React.ReactElement` — `src/features/onboarding/ProviderPicker.tsx:12`
- `OnboardingScreen` (default export) — `app/onboarding.tsx:9`

**Decisions made:**
- Added `testID="get-started-btn"` to the Button in `app/onboarding.tsx` for reliable test queries (not part of interface contract, just test convenience)
- Used `act(async () => ...)` in the valid-key test to suppress the act() warning from async setState after `setApiKey` resolves
- Disabled-button test verifies by absence of side effects (no setApiKey or replace calls) rather than DOM prop traversal, which was unreliable across component wrappers

**Gotchas discovered:**
- `jest.mock` factory cannot reference out-of-scope variables unless prefixed with `mock` (case-insensitive). Had to rename `replace` → `mockReplace`
- `getByText('Get started')` in the test returns the inner RNText, and traversing `.parent` chain to reach Pressable is unreliable with react-test-renderer. Using `testID` is the robust approach

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 15 suites passed, 79 tests passed (5 new)
- `npm run lint`: 0 errors (3 pre-existing warnings in jest.setup.ts)
- `npm run typecheck`: exits 0
