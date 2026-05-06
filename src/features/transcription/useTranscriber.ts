import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  addSpeechRecognitionListener,
} from 'expo-speech-recognition';
import type {
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';

export type TranscriberStatus = 'idle' | 'listening' | 'processing' | 'done' | 'denied' | 'error';

export type UseTranscriberReturn = {
  status: TranscriberStatus;
  partial: string;
  finalTranscript: string;
  error: Error | null;
  start(): Promise<void>;
  stop(): Promise<string>;
  reset(): void;
};

export function useTranscriber(opts?: { lang?: string }): UseTranscriberReturn {
  const lang = opts?.lang ?? 'en-US';

  const [status, setStatus] = useState<TranscriberStatus>('idle');
  const [partial, setPartial] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const statusRef = useRef(status);
  const finalRef = useRef('');
  const endPromiseRef = useRef<{ resolve: (value: string) => void } | null>(null);
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);

  function updateStatus(s: TranscriberStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  const start = useCallback(async () => {
    setError(null);
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        updateStatus('denied');
        return;
      }

      setPartial('');
      setFinalTranscript('');
      finalRef.current = '';

      subscriptionsRef.current.forEach((sub) => sub.remove());
      subscriptionsRef.current = [];

      subscriptionsRef.current.push(
        addSpeechRecognitionListener('result', (e: ExpoSpeechRecognitionResultEvent) => {
          const transcript = e.results?.[0]?.transcript ?? '';
          if (e.isFinal) {
            const sep = finalRef.current.length > 0 ? ' ' : '';
            const appended = finalRef.current + sep + transcript;
            finalRef.current = appended;
            setFinalTranscript(appended);
            setPartial('');
          } else {
            setPartial(transcript);
          }
        }),
      );

      subscriptionsRef.current.push(
        addSpeechRecognitionListener('error', (e: ExpoSpeechRecognitionErrorEvent) => {
          updateStatus('error');
          setError(new Error(e.message));
        }),
      );

      subscriptionsRef.current.push(
        addSpeechRecognitionListener('end', () => {
          updateStatus('done');
          endPromiseRef.current?.resolve(finalRef.current);
          endPromiseRef.current = null;
        }),
      );

      ExpoSpeechRecognitionModule.start({
        lang,
        continuous: true,
        interimResults: true,
      });

      updateStatus('listening');
    } catch (e) {
      updateStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [lang]);

  const stop = useCallback(async (): Promise<string> => {
    ExpoSpeechRecognitionModule.stop();

    return new Promise<string>((resolve) => {
      if (statusRef.current === 'done' || statusRef.current === 'idle') {
        resolve(finalRef.current.trim());
      } else {
        endPromiseRef.current = { resolve };
      }
    });
  }, []);

  const reset = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.remove());
    subscriptionsRef.current = [];
    endPromiseRef.current = null;
    setPartial('');
    setFinalTranscript('');
    finalRef.current = '';
    setError(null);
    updateStatus('idle');
  }, []);

  return {
    status,
    partial,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
