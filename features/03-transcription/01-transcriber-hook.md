# Story 01: `useTranscriber` hook

**Tier:** flash

## Goal
Hook wrapping `expo-speech-recognition` for streaming speech-to-text. Exposes status, partial + final transcript, control methods.

## Files in scope
- `package.json` — modify (add `expo-speech-recognition`)
- `src/features/transcription/useTranscriber.ts` — create
- `__tests__/features/transcription/useTranscriber.test.tsx` — create
- `jest.setup.ts` — modify (mock `expo-speech-recognition`)

## Do not touch
- All other files

## Interface contracts

```ts
// src/features/transcription/useTranscriber.ts
export type TranscriberStatus = 'idle' | 'listening' | 'processing' | 'done' | 'denied' | 'error';

export type UseTranscriberReturn = {
  status: TranscriberStatus;
  partial: string;          // ongoing in-progress text
  finalTranscript: string;  // accumulated final segments
  error: Error | null;
  start(): Promise<void>;
  stop(): Promise<string>;  // resolves with the final transcript
  reset(): void;
};

export function useTranscriber(opts?: { lang?: string }): UseTranscriberReturn;
```

Behavior:
- `start()`: requests `expo-speech-recognition` permissions; on grant, registers event listeners (`result`, `end`, `error`), calls `ExpoSpeechRecognitionModule.start({ lang: 'en-US', continuous: true, interimResults: true })`. Sets status `'listening'`.
- On `result` event: if `isFinal`, append transcript to `finalTranscript` (with leading space when non-empty); else update `partial`.
- `stop()`: calls `ExpoSpeechRecognitionModule.stop()`, awaits `end` event, returns the accumulated final transcript (trim).
- `reset()`: clears partial + final, status → `'idle'`.
- Permission denial → status `'denied'`.

## jest.setup.ts mock (additive)
```ts
const mockSpeechListeners: Record<string, ((e: any) => void)[]> = {};
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    start: jest.fn(),
    stop: jest.fn(() => {
      // simulate end event after stop()
      setTimeout(() => mockSpeechListeners.end?.forEach(fn => fn({})), 0);
    }),
    addListener: jest.fn((event: string, fn: (e: any) => void) => {
      mockSpeechListeners[event] = [...(mockSpeechListeners[event] ?? []), fn];
      return { remove: () => {} };
    }),
    removeAllListeners: jest.fn(),
  },
  __mockEmit: (event: string, payload: any) => {
    mockSpeechListeners[event]?.forEach(fn => fn(payload));
  },
}));
```
The `__mockEmit` helper lets tests trigger result/end/error events synthetically. The implementer should re-export it from the mock so tests can `import { __mockEmit } from 'expo-speech-recognition';` (cast as needed).

## Tests
- `start()` requests permissions; calls `start` with continuous + interimResults.
- Permission denied → status `'denied'`, no `start` call.
- Result with `isFinal: false` updates `partial`.
- Result with `isFinal: true` appends to `finalTranscript`, clears `partial`.
- Multiple finals accumulate with single space separator.
- `stop()` resolves with the accumulated final transcript trimmed.
- `reset()` returns to idle with empty strings.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `package.json` — added `expo-speech-recognition` dependency
- `jest.setup.ts` — added mock for `expo-speech-recognition` module with `__mockEmit` helper
- `src/features/transcription/useTranscriber.ts` — created `useTranscriber` hook
- `__tests__/features/transcription/useTranscriber.test.tsx` — created tests (7 cases)

**Public interfaces added/modified:**
- `src/features/transcription/useTranscriber.ts:24` — `TranscriberStatus` type
- `src/features/transcription/useTranscriber.ts:26` — `UseTranscriberReturn` type
- `src/features/transcription/useTranscriber.ts:37` — `useTranscriber(opts?: { lang?: string })` function

**Decisions made:**
- Used `addSpeechRecognitionListener` (standalone export) instead of `ExpoSpeechRecognitionModuleEmitter.addListener` because the emitter's generic type defaults to `Record<never, never>`, causing TS errors on event names. The standalone function is properly typed with the event map.
- Used `ExpoSpeechRecognitionModule.requestPermissionsAsync()` (method on module, NOT standalone import) matching the actual API.

**Gotchas discovered:**
- `expo-speech-recognition` v0.1.25 exports `requestPermissionsAsync` only as a method on `ExpoSpeechRecognitionModule`, not as a standalone function.
- Result events use `{ isFinal, results: [{ transcript }] }` shape, not a flat `{ isFinal, transcript }`.
- `__mockEmit` is not a real export — it's injected by the jest mock. Tests import it via `require()` with a type cast, matching the project's existing test convention.

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 25 suites, 151 tests, all passing
