# Feature 03 — Transcription

## Spec

### Goal
On-device speech-to-text via `expo-speech-recognition`. Run in real time during recording (preferred) or post-hoc on the saved file (fallback). Save the resulting transcript onto the `Note` row via `notesRepo.setTranscript`.

### Acceptance criteria
- `useTranscriber()` hook: status (`idle | listening | processing | done | error`), partial + final transcripts, `start()` / `stop()` / `reset()`.
- Permission flow analogous to recording: requests `Speech` permission, handles denial.
- Integrates with `/record` flow: when the user starts recording, transcription starts in parallel. When recording stops, finalize transcript and call `notesRepo.setTranscript(noteId, transcript)`.
- All gates green.

### Out of scope
- Cloud Whisper fallback. Provider-key transcription.
- Multilingual UX. We pass through whatever the OS recognizer detects.

### Dependencies
- Feature 00, 01, 08 (notesRepo), 02 (record screen integration).

### Stories
1. `01-transcriber-hook` — `useTranscriber` over `expo-speech-recognition` with mocks.
2. `02-record-screen-integration` — wire transcription into `/record` save flow; persist transcript via `notesRepo.setTranscript`.

## Summary (shipped)

`useTranscriber` hook over `expo-speech-recognition` with continuous + interim results. `/record` runs recording and transcription in parallel; on save, persists `Note` then `setTranscript` if a transcript exists. Live partial transcript renders in handwritten variant during recording. Denial of speech permission still allows audio capture (without transcript) and shows a graceful warning. **Note:** transcript quality is OS-dependent (iOS Speech / Android SpeechRecognizer); no fallback to cloud Whisper at this layer.
