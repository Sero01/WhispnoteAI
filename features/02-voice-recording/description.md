# Feature 02 — Voice recording

## Spec

### Goal
Capture audio via `expo-audio`, persist to local file system, save raw `Note` row (audio URI + duration) to SQLite. UI: record screen with waveform, big mic button, elapsed timer, save/discard.

### Acceptance criteria
- `useRecorder()` hook exposes start/stop/pause/discard, status, elapsedMs, current amplitude.
- `/record` route: full-screen recorder UI with waveform visualization (driven by amplitude samples), elapsed timer, primary mic IconButton, "Save" + "Discard" controls when stopped.
- On Save: writes audio file to `${FileSystem.documentDirectory}/recordings/${uuid}.m4a`, calls `notesRepo.create({ audioUri, durationMs })`, navigates back to `/`.
- Mic permission requested on first record; gracefully handles denial.
- All gates green.

### Out of scope
- Transcription (feature 03 reads from `audioUri`).
- Background recording, lock-screen widgets.

### Dependencies
- Feature 00 (providers), 01 (primitives), 08 (notesRepo).

### Stories
1. `01-recorder-hook` — `useRecorder` hook + audio session config + permission handling, mocked tests.
2. `02-waveform-component` — `<Waveform>` visual using bar amplitudes, animated via Reanimated.
3. `03-record-screen` — `/record` route composes the above.

## Summary (shipped)

`useRecorder` hook (start/stop/pause/resume/discard, 64-sample amplitude ring, permission flow) + `<Waveform>` Reanimated component + `/record` modal route. Save flow writes audio to `${documentDirectory}recordings/` and persists a `Note` row via `notesRepo`. Story 01's implementer agent timed out near completion; orchestrator finalized: switched `expo-file-system` import to `/legacy` (SDK 54 root export is class-based) and added a matching jest mock alias. Reanimated v4 needs a manual mock (built-in mock requires native Worklets).
