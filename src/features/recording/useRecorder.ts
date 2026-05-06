import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import {
  documentDirectory,
  makeDirectoryAsync,
  moveAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import { configureAudioForRecording, configureAudioForPlayback } from './audioSession';

const AMPLITUDE_BUFFER_SIZE = 64;
const POLL_INTERVAL_MS = 100;

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'denied' | 'error';

export type Recording = {
  uri: string;
  durationMs: number;
  amplitudes: number[];
};

export type UseRecorderReturn = {
  status: RecorderStatus;
  elapsedMs: number;
  amplitude: number;
  amplitudes: number[];
  error: Error | null;
  start(): Promise<void>;
  stop(): Promise<Recording | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  discard(): Promise<void>;
};

function normalizeMetering(metering: number): number {
  const linear = Math.pow(10, metering / 20);
  return Math.min(1, Math.max(0, linear));
}

export function useRecorder(): UseRecorderReturn {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const statusRef = useRef(status);
  const amplitudesRef = useRef<number[]>([]);
  const tempUriRef = useRef<string | null>(null);

  function updateStatus(newStatus: RecorderStatus) {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }

  useEffect(() => {
    if (status !== 'recording') return;

    const interval = setInterval(() => {
      try {
        const state = recorder.getStatus();
        setElapsedMs(state.durationMillis);
        if (state.metering != null) {
          const normalized = normalizeMetering(state.metering);
          setAmplitude(normalized);
          amplitudesRef.current = [...amplitudesRef.current, normalized].slice(-AMPLITUDE_BUFFER_SIZE);
          setAmplitudes(amplitudesRef.current);
        }
      } catch {
        // ignore polling errors
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, recorder]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        updateStatus('denied');
        return;
      }

      await configureAudioForRecording();
      await recorder.prepareToRecordAsync();
      recorder.record();

      amplitudesRef.current = [];
      setAmplitudes([]);
      setAmplitude(0);
      setElapsedMs(0);
      tempUriRef.current = recorder.uri;
      updateStatus('recording');
    } catch (e) {
      updateStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    if (statusRef.current === 'idle') return null;

    const finalAmplitudes = [...amplitudesRef.current];

    try {
      await recorder.stop();

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
      try { await configureAudioForPlayback(); } catch { /* ignore */ }
    }
  }, [recorder]);

  const pause = useCallback(async () => {
    try {
      recorder.pause();
      updateStatus('paused');
    } catch (e) {
      updateStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [recorder]);

  const resume = useCallback(async () => {
    try {
      recorder.record();
      updateStatus('recording');
    } catch (e) {
      updateStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [recorder]);

  const discard = useCallback(async () => {
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
  }, [recorder]);

  return {
    status,
    elapsedMs,
    amplitude,
    amplitudes,
    error,
    start,
    stop,
    pause,
    resume,
    discard,
  };
}
