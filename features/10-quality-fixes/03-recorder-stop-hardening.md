# Story 03: Recorder stop / discard hardening

**Tier:** pro

## Goal

Fix three correctness defects in `useRecorder` and `audioSession`:

1. `stop()` reads `recorder.uri` *before* awaiting `recorder.stop()`, which can yield the pre-finalize URI on some expo-audio versions and silently lose the recording.
2. When no URI is available at all, `stop()` still constructs and returns a `Recording` whose `uri` points at a file that was never created. It must return `null` and surface an error.
3. The audio session is set to recording mode in `start()` but never reset to playback mode. On iOS this routes subsequent playback through the receiver speaker. Reset on stop and on discard, on both success and error paths.

## Context

This is a pro-tier story because it spans multiple files, deals with async cleanup ordering, and the bugs are silent (no exception, just data loss / wrong audio routing). The `Recording` shape is part of the public surface in `index.md` and must not change.

## Files in scope
- `src/features/recording/useRecorder.ts` — modify
- `src/features/recording/audioSession.ts` — read-only reference (do not modify; the two existing functions are sufficient)
- `__tests__/features/recording/useRecorder.test.tsx` — modify (add new tests; existing ones must still pass)

## Do not touch
- `app/record.tsx` — the `handleSave` flow already handles `recording === null` (returns early, sets phase back to idle); no UI change needed
- `src/features/transcription/*`
- `jest.setup.ts` — the `expo-audio` and `expo-file-system` mocks are sufficient

## Interface contracts

### Behavioral changes in `useRecorder.ts`

The exported `UseRecorderReturn` shape is unchanged. The `Recording` type is unchanged.

#### `stop()`
```ts
const stop = async (): Promise<Recording | null> => {
  if (statusRef.current === 'idle') return null;

  const finalAmplitudes = [...amplitudesRef.current];

  try {
    await recorder.stop();
    // Read URI AFTER stop resolves — expo-audio may finalize at a different URI than prepareToRecordAsync exposed.
    const finalizedUri = recorder.uri ?? tempUriRef.current;

    const state = recorder.getStatus();
    const finalDuration = state.durationMillis;

    if (!finalizedUri) {
      updateStatus('error');
      setError(new Error('Recording URI unavailable'));
      return null;
    }

    const uuid = crypto.randomUUID();
    const recordingsDir = `${documentDirectory}recordings/`;
    const finalUri = `${recordingsDir}${uuid}.m4a`;

    await makeDirectoryAsync(recordingsDir, { intermediates: true });
    await moveAsync({ from: finalizedUri, to: finalUri });

    updateStatus('stopped');

    return {
      uri: finalUri,
      durationMs: finalDuration,
      amplitudes: finalAmplitudes,
    };
  } catch (e) {
    updateStatus('error');
    setError(e instanceof Error ? e : new Error(String(e)));
    return null;
  } finally {
    // Best-effort: reset audio session so subsequent playback routes correctly.
    // Swallow errors here — failing to reset must not change the function's return value.
    try { await configureAudioForPlayback(); } catch { /* ignore */ }
  }
};
```

Key constraints:
- `recorder.uri` MUST be read *after* `await recorder.stop()` resolves. Falling back to `tempUriRef.current` is allowed only if the post-stop URI is null.
- If the resolved URI is null, return `null` and set status `'error'`. Do NOT return a `Recording` with a fabricated URI.
- The `finally` block runs `configureAudioForPlayback()` and ignores its errors. It runs on success, on caught error, and on the early `null` return path.

#### `discard()`

Update the cleanup order:
- The function must, on its happy path, also call `configureAudioForPlayback()` (best-effort, errors swallowed) so a discard returns the device to playback mode.
- The error-path catch should also call `configureAudioForPlayback()` before returning. Use a `finally` block (mirroring `stop()`).

```ts
const discard = async () => {
  try {
    if (statusRef.current === 'recording' || statusRef.current === 'paused') {
      await recorder.stop();
    }

    const uri = recorder.uri ?? tempUriRef.current;
    if (uri) {
      await deleteAsync(uri, { idempotent: true });
    }

    amplitudesRef.current = [];
    setAmplitudes([]);
    setAmplitude(0);
    setElapsedMs(0);
    tempUriRef.current = null;
    updateStatus('idle');
    setError(null);
  } catch (e) {
    updateStatus('error');
    setError(e instanceof Error ? e : new Error(String(e)));
  } finally {
    try { await configureAudioForPlayback(); } catch { /* ignore */ }
  }
};
```

#### Imports

Add `configureAudioForPlayback` to the existing import from `./audioSession`:

```ts
import { configureAudioForRecording, configureAudioForPlayback } from './audioSession';
```

No other functions in `useRecorder.ts` change. `start()`, `pause()`, `resume()`, the polling effect, the `normalizeMetering` helper — all unchanged.

### Test additions in `useRecorder.test.tsx`

Add tests covering:

1. **stop reads finalized URI after stop.** Mock `recorder.stop()` so that calling it changes `recorder.uri` from `'file:///pre-stop.m4a'` to `'file:///post-stop.m4a'`. Assert that `moveAsync` is called with `from: 'file:///post-stop.m4a'`. (The existing `expo-audio` mock in `jest.setup.ts` exposes a `mockRecorder` object — extend per-test by reassigning its `uri` property in the `stop` mock implementation. Do not edit `jest.setup.ts`.)
2. **stop returns null when finalized URI is null.** Mock `recorder.uri = null` and `tempUriRef` indirectly null (i.e. start was called but `recorder.uri` was null at prepare time too). Assert `stop()` resolves to `null`, status becomes `'error'`, and `moveAsync` is NOT called.
3. **stop calls configureAudioForPlayback on success.** Spy on the module export from `'./audioSession'` (or its mock equivalent) and assert it is called once after a successful stop.
4. **stop calls configureAudioForPlayback even on error.** Make `recorder.stop()` reject; assert `configureAudioForPlayback` is still invoked, and the function returns `null`.
5. **discard calls configureAudioForPlayback on the happy path.**

For tests 3-5: use `jest.mock('@/features/recording/audioSession', () => ({ configureAudioForRecording: jest.fn(), configureAudioForPlayback: jest.fn() }))` at the top of the test file. This replaces the real module for that file only.

## Implementation notes

- The order matters in `stop()`: `await recorder.stop()` MUST come before reading `recorder.uri`. This is the central bug fix; everything else is structure.
- Do not change the shape returned by `stop()` on success.
- Do not introduce new exports.
- Keep the swallowing of `configureAudioForPlayback` errors strict — a failure there must not surface as a recording error to the caller.
- The existing `expo-audio` mock's `mockRecorder.stop` is a `jest.fn()` resolving to undefined. Override per-test as needed via `mockRecorder.stop.mockImplementationOnce(...)`.

## Acceptance criteria

- [ ] `useRecorder.ts` reads `recorder.uri` only after `await recorder.stop()` resolves.
- [ ] When no URI is resolvable, `stop()` returns `null`, sets status `'error'`, sets a non-null `error`, and never invokes `moveAsync`.
- [ ] `configureAudioForPlayback()` is invoked from `stop()` on success, on caught error, and on the early null-URI return path.
- [ ] `configureAudioForPlayback()` is invoked from `discard()` on success and error paths.
- [ ] Errors from `configureAudioForPlayback()` itself do not propagate.
- [ ] All five new tests above pass.
- [ ] All previously passing tests in `useRecorder.test.tsx` still pass.
- [ ] `npm test` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] No changes to files outside "Files in scope"

## Session log

**Status:** complete
**Files changed:**
- `src/features/recording/useRecorder.ts` — Rewrote `stop()` to read `recorder.uri` after `await recorder.stop()`, added null-URI check with error return, added `configureAudioForPlayback()` in `finally` block. Rewrote `discard()` with `finally` block calling `configureAudioForPlayback()`. Updated import to include `configureAudioForPlayback`.
- `__tests__/features/recording/useRecorder.test.tsx` — Added `jest.mock` for `@/features/recording/audioSession`, imported `configureAudioForPlayback`, added 5 new tests.

**Public interfaces added/modified:**
- No changes to exported types (`UseRecorderReturn`, `Recording`, `RecorderStatus` unchanged)
- `stop()` now returns `null` when no URI is available (previously always returned a `Recording`)
- `stop()` and `discard()` now call `configureAudioForPlayback()` in `finally` blocks

**Decisions made:**
- Used `recorder.uri ?? tempUriRef.current` for URI resolution after stop — `recorder.uri` is the primary source, fallback to `tempUriRef.current` only if post-stop URI is null
- Swallowed `configureAudioForPlayback()` errors in `finally` blocks as specified — its failure must not affect recording operation outcomes

**Gotchas discovered:**
- `getMockRecorder()` returns undefined if called before `renderHook(() => useRecorder())` — the mock recorder is instantiated by `useAudioRecorder()` which runs inside the hook render. Tests that need to mutate the mock recorder must call `renderHook` first.
- `result.current.status` assertions after async operations require `waitFor` to account for React state batching — direct `expect` reads stale render values.

**Deferred work:**
- None

**Test result:**
- Command: `npm test -- --watchAll=false`
- Exit: 0
- Output summary: 42 suites, 273 tests passed, 0 failures
- Command: `npm run typecheck`
- Exit: 0
