# Story 02: Wire transcription into `/record`

**Tier:** flash

## Goal
Recording and transcription run in parallel. On Save: persist note → set transcript onto the note row. Display the live partial transcript on the record screen.

## Files in scope
- `app/record.tsx` — modify
- `__tests__/app/record.test.tsx` — modify

## Do not touch
- `useRecorder`, `useTranscriber`, primitives, repos — settled

## Behavior

In `app/record.tsx`:
- Call `const transcriber = useTranscriber()` alongside the existing `useRecorder()`.
- `start` button now calls `recorder.start()` THEN `transcriber.start()` (in parallel via `Promise.all`).
- The mic IconButton when recording calls `recorder.stop()` and `transcriber.stop()` in parallel; the awaited result captures both.
- Render `<Text variant="handwritten" color="inkMuted">{transcriber.partial || transcriber.finalTranscript || '...'}</Text>` between the timer and waveform.
- Save flow becomes:
  ```ts
  const recording = await recorder.stop();   // already a result of stop press, but if stop hasn't been called, call here
  const transcript = await transcriber.stop();
  if (!recording) return;
  const note = await notesRepo.create({ audioUri: recording.uri, durationMs: recording.durationMs });
  if (transcript) await notesRepo.setTranscript(note.id, transcript);
  router.replace('/');
  ```
  In practice `stop` will already have been called by the IconButton action; if `recorder.status === 'stopped'`, just persist with the captured values. The implementer can keep a local `lastRecording` + `lastTranscript` state set when stop happens.
- If `transcriber.status === 'denied'`, still allow saving recording without transcript; show a small `<Text variant="eyebrow">Transcription unavailable</Text>` warning above the save button.

## Tests
- Existing tests still pass (regression).
- Pressing mic when idle → both `recorder.start` and `transcriber.start` are called.
- Pressing mic when recording → both `.stop` are called.
- Save flow calls `notesRepo.create` then `notesRepo.setTranscript` with the resolved transcript; finally `router.replace('/')`.
- When transcriber denied but recording succeeds, save still calls `notesRepo.create` but NOT `setTranscript`.
- Live partial text rendered when `transcriber.partial !== ''`.

Mock `useTranscriber` per test similarly to existing `useRecorder` mocking pattern.

## Acceptance criteria
- [ ] All gates green.

## Session log

**Status:** complete
**Files changed:**
- `app/record.tsx` — integrated `useTranscriber`: parallel start/stop via `Promise.all`, live partial/final transcript display, transcript-aware save flow, denied-state warning eyebrow
- `__tests__/app/record.test.tsx` — added `useTranscriber` mock, refactored to shared helpers, added 5 new tests covering parallel start/stop, save with transcript, denied transcriber save, denied warning, and live partial rendering

**Public interfaces added/modified:**
- (none — existing `useTranscriber` and `notesRepo.setTranscript` consumed unchanged)

**Decisions made:**
- Used `useRef` for last recording/transcript instead of `useState` to avoid stale closures and redundant re-renders
- `lastTranscriptRef` initialized as `string | null` (not `string` with `''`) so `??` operator correctly distinguishes "not captured yet" from "captured but empty"
- `handleSave` falls back to `recorder.stop()` / `transcriber.stop()` when refs are empty, matching the story's pseudocode exactly

**Gotchas discovered:**
- `''` (empty string) is not nullish, so `??` would skip the fallback; using `null` as the sentinel for "not captured" avoids this

**Deferred work:**
- None

**Test result:**
- Command: `npm test`
- Exit: 0
- Output summary: 25 suites, 154 tests passed, all 25 suites passing
