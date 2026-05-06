# Story 01: `useRecorder` hook

**Tier:** pro

## Goal
React hook wrapping `expo-audio` recording API. Exposes status, elapsed time, current amplitude (for waveform), and start/stop/pause/discard. Saves recordings to `${FileSystem.documentDirectory}/recordings/`.

## Files in scope
- `package.json` — modify (add `expo-audio`, `expo-file-system`)
- `src/features/recording/useRecorder.ts` — create
- `src/features/recording/audioSession.ts` — create (cross-platform audio mode setup)
- `__tests__/features/recording/useRecorder.test.tsx` — create
- `jest.setup.ts` — modify (mock `expo-audio` and `expo-file-system`)

## Do not touch
- All other files.

## Interface contracts

```ts
// src/features/recording/useRecorder.ts
export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'denied' | 'error';

export type Recording = {
  uri: string;            // local file URI under documentDirectory/recordings/
  durationMs: number;
  amplitudes: number[];   // sampled normalized [0..1] amplitudes captured during recording
};

export type UseRecorderReturn = {
  status: RecorderStatus;
  elapsedMs: number;
  amplitude: number;       // current normalized [0..1]
  amplitudes: number[];    // ring buffer of recent samples (max 64)
  error: Error | null;
  start(): Promise<void>;
  stop(): Promise<Recording | null>;     // returns null if status was idle
  pause(): Promise<void>;
  resume(): Promise<void>;
  discard(): Promise<void>;              // deletes file, resets state
};

export function useRecorder(): UseRecorderReturn;
```

```ts
// src/features/recording/audioSession.ts
export async function configureAudioForRecording(): Promise<void>;   // sets allowsRecording, etc.
export async function configureAudioForPlayback(): Promise<void>;    // restore for after-stop preview
```

## Implementation notes
- Use `expo-audio`'s `AudioRecorder` / `useAudioRecorder` API (not the deprecated expo-av). Check official docs naming.
- Permission: call `AudioModule.requestRecordingPermissionsAsync()` on `start()`. If denied, set status `'denied'` and return.
- Sampling: poll `recorder.getStatus()` (or equivalent) every 100ms via `setInterval` inside `useEffect`. Push the metering value (normalized 0..1 from dB) to the ring buffer; trim to 64.
- On `stop()`: stop recorder, read the file URI, move it to `${documentDirectory}/recordings/${uuid}.m4a`, return `Recording`.
- On `discard()`: stop if recording, delete the file via `FileSystem.deleteAsync`, reset state.
- Wrap all recorder calls in try/catch; populate `error` and set status `'error'` on failure.

## jest.setup.ts mock (additive)
```ts
jest.mock('expo-audio', () => {
  const recorders: any[] = [];
  return {
    AudioModule: { requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })) },
    RecordingPresets: { HIGH_QUALITY: {} },
    useAudioRecorder: jest.fn((preset: any) => {
      const rec = {
        prepareToRecordAsync: jest.fn(async () => {}),
        record: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(async () => {}),
        getStatus: jest.fn(() => ({ metering: -10, durationMillis: 1000, isRecording: true })),
        uri: 'file:///mock/temp/recording.m4a',
      };
      recorders.push(rec);
      return rec;
    }),
    setAudioModeAsync: jest.fn(async () => {}),
  };
});
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/doc/',
  makeDirectoryAsync: jest.fn(async () => {}),
  moveAsync: jest.fn(async () => {}),
  deleteAsync: jest.fn(async () => {}),
  getInfoAsync: jest.fn(async () => ({ exists: true, isDirectory: false, size: 1024 })),
}));
```
Adjust if the actual `expo-audio` API surface differs — implementer should consult installed package and align mock to real API. The hook's behavior is tested against this mock; integration with the real native module is out of scope for unit tests.

## Tests
- `start()` → status becomes `'recording'`; permission requested.
- Permission denied → status `'denied'`; recorder methods not called.
- `stop()` after recording returns a `Recording` with non-empty `uri` under `documentDirectory/recordings/`, durationMs > 0, and an array of amplitudes.
- `discard()` → calls `deleteAsync` with the temp file (if any) and resets to `'idle'`.
- `pause()` → status `'paused'`; `resume()` → `'recording'`.

Use `@testing-library/react-native`'s `renderHook` (or compose a tiny test component if `renderHook` isn't available — check installed version).

## Acceptance criteria
- [ ] All gates green.
- [ ] No edits outside scope.

## Session log

**Status:** complete (orchestrator-finished after agent timeout)
**Files changed:**
- `package.json` — added `expo-audio`, `expo-file-system`
- `src/features/recording/useRecorder.ts` — `useRecorder()` hook with start/stop/pause/resume/discard, polling-based amplitude buffer (max 64), permission handling
- `src/features/recording/audioSession.ts` — `configureAudioForRecording`/`configureAudioForPlayback` via `setAudioModeAsync`
- `__tests__/features/recording/useRecorder.test.tsx` — coverage for start/denied/stop/discard/pause-resume
- `jest.setup.ts` — mock `expo-audio` and `expo-file-system` (+ `/legacy`)

**Decisions made:**
- Used `expo-file-system/legacy` import (`documentDirectory`, `makeDirectoryAsync`, `moveAsync`, `deleteAsync`) because the new SDK 54 root export is class-based (`Paths`, `File`, `Directory`); the spec wrote function-style API. Both `expo-file-system` and `expo-file-system/legacy` are mocked identically in jest.setup.

**Gotchas:**
- Implementer agent hit the 9-minute session timeout while finalizing; orchestrator (a) fixed `documentDirectory` import to `/legacy`, (b) added `expo-file-system/legacy` mock, (c) wrote this session log.

**Test result:** `npm test` exit 0 (22 suites / 131 tests). `npm run lint` exit 0. `npm run typecheck` exit 0.
