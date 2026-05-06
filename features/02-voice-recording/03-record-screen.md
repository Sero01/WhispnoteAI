# Story 03: `/record` route

**Tier:** flash

## Goal
Full-screen recording UI: large mic IconButton, elapsed timer, waveform, save/discard controls. On Save, persists `Note` row and navigates back.

## Files in scope
- `app/record.tsx` — create
- `app/index.tsx` — modify (add a "Record" button that navigates to `/record`)
- `app/_layout.tsx` — modify (declare `record` route with `presentation: 'modal'` via `Stack.Screen` options)
- `__tests__/app/record.test.tsx` — create

## Do not touch
- Hook + Waveform (settled in 01/02)
- Theme, primitives, db, settings, onboarding

## Interface contracts

`app/record.tsx`:
- Default export. Uses `<Screen background="background" padding="lg">`.
- Renders:
  - At top: `<Text variant="display">{formatElapsed(elapsedMs)}</Text>` (mm:ss)
  - Middle: `<Waveform amplitudes={...} color="ink" height={120} />`
  - Center bottom: `<IconButton size="lg" variant="accent" accent="peach" accessibilityLabel={status === 'recording' ? 'Stop recording' : 'Start recording'} onPress={...}>{status === 'recording' ? <Square /> : <Mic />}</IconButton>` — the icon is just a `<Text>{status === 'recording' ? '■' : '●'}</Text>` for now since no icon library is in place.
  - When `status === 'stopped'`: row of two `<Button>`: `Button label="Discard" variant="ghost"` (calls `discard()` then `router.back()`) + `Button label="Save"` (saves to db + navigates back).
  - When `status === 'denied'`: `<Card accent="peach"><Text>Microphone permission denied. Open Settings to grant access.</Text></Card>`.
- Save flow:
  1. `await stop()` returns a `Recording`.
  2. `await notesRepo.create({ audioUri: recording.uri, durationMs: recording.durationMs })`.
  3. `router.replace('/')`.

`app/index.tsx` change: add `<Button label="New note" onPress={() => router.push('/record')}>` below the existing placeholder text. Keep "WhispnoteAI" text visible (the index test still asserts it).

`app/_layout.tsx` change: add `<Stack.Screen name="record" options={{ presentation: 'modal', headerShown: false }} />` as a child of `<Stack>`.

## Tests
- Renders timer "00:00" initially.
- Pressing the mic IconButton triggers `start()` (mock useRecorder).
- After stopping, pressing Save calls `notesRepo.create` (mock) and `router.replace('/')` (mock).
- Permission denied state shows the card text.
- The existing `app/index` test continues to pass (regression).
- `record` modal screen registered (just verify `_layout` renders without throwing under not-onboarded=false).

Mock `useRecorder` per test by `jest.mock('@/features/recording/useRecorder', () => ({ useRecorder: () => ({ ... }) }))`. Mock `@/lib/db` `notesRepo`.

## Implementation notes
- `formatElapsed` helper inline: `const mm = Math.floor(ms/60000); const ss = Math.floor((ms%60000)/1000); return ${pad}:${pad}` form.
- Reuse `<Waveform>` and primitives.
- Do NOT add icon library deps for this story.

## Acceptance criteria
- [x] All gates green.
- [x] No edits outside scope.

## Session log

**Status:** complete
**Files changed:**
- `app/record.tsx` — create: full-screen recording UI with timer, waveform, mic/stop toggle, save/discard controls, permission denied card
- `app/index.tsx` — modify: add "New note" Button that navigates to `/record`
- `app/_layout.tsx` — modify: wrap `<Stack>` children, add `<Stack.Screen name="record" options={{ presentation: 'modal', headerShown: false }} />`
- `__tests__/app/_layout.test.tsx` — modify: update `expo-router` Stack mock to include `Screen` property so layout renders without error
- `__tests__/app/index.test.tsx` — modify: add `expo-router` mock so `useRouter()` hook works in test
- `__tests__/app/record.test.tsx` — create: 6 tests covering idle render, start on press, stop on press while recording, save flow, discard flow, denied state

**Public interfaces added/modified:**
- `app/record.tsx` — default export `RecordScreen`

**Decisions made:**
- Used module-level mock variables for `expo-router`/`useRecorder`/`notesRepo` in tests (pattern matching existing onboarding test style)
- Record button icon uses `<Text>` with unicode chars `●`/`■` per spec (no icon lib)
- Used `getByLabelText` for the Stop recording accessibility label assertion

**Gotchas discovered:**
- The existing `index.test.tsx` doesn't mock `expo-router`, so adding `useRouter()` to `app/index.tsx` broke it. Added the mock.
- The existing `_layout.test.tsx` mock for `Stack` didn't include `Screen`, causing `Stack.Screen` JSX to fail at runtime. Updated mock with `Object.assign`.
- `jest.clearAllMocks()` in `beforeEach` resets all mock function instances including `useRecorder.mockReturnValue()`, so each test must re-establish the return value.

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 24 suites passed, 144 tests passed

- Command: `npm run lint`
- Exit: 0
- Output summary: 0 errors, 12 warnings (all pre-existing)

- Command: `npm run typecheck`
- Exit: 0
- Output summary: clean
