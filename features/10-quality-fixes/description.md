# Feature 10: Quality fixes

## Spec

Targeted fixes from a code-quality review of features 02 (voice recording) and 04 (AI card generation). Each story addresses a high-confidence issue surfaced by the review.

### Goal

Close six concrete defects without changing public surfaces or feature behavior visible to the user.

### Acceptance criteria

- Prompt construction is robust against transcript content that resembles instructions, and bounded in length.
- LLM adapters' retry logic does not silently throw on the second attempt regardless of error class; structure scales correctly if retry count is increased.
- `record.tsx` does not call `getActiveLLMClient()` redundantly; the pipeline's "no client configured" path is handled cleanly.
- `useRecorder.stop()` reads the final URI after `recorder.stop()` resolves, returns `null` when no URI is available (rather than a `Recording` pointing to a non-existent file).
- Audio session is reset to playback mode when recording ends or is discarded (success and error paths).
- All existing tests still pass; new tests cover the regressions above.

### Out of scope

- Any change to the `LLMClient` interface, the `Recording` shape, the `CARD_SCHEMA`, or the `useRecorder` return type.
- Any UX change in `record.tsx` beyond removing the redundant guard.
- Backoff / retry-count tuning beyond what the existing structure already does.

### Dependencies

- Features 02 and 04 must already be in place (they are).
