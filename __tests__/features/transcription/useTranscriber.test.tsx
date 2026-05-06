import { renderHook, act } from '@testing-library/react-native';
import { useTranscriber } from '@/features/transcription/useTranscriber';
import {
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';

const { __mockEmit } = require('expo-speech-recognition') as { __mockEmit: (event: string, payload: any) => void };

beforeEach(() => {
  jest.clearAllMocks();
});

it('start() requests permissions and calls start with continuous + interimResults', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalled();
  expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith({
    lang: 'en-US',
    continuous: true,
    interimResults: true,
  });
  expect(result.current.status).toBe('listening');
});

it('permission denied sets status denied and does not start', async () => {
  (ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });

  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  expect(result.current.status).toBe('denied');
  expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
});

it('result with isFinal: false updates partial', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  act(() => {
    __mockEmit('result', { isFinal: false, results: [{ transcript: 'hello' }] });
  });

  expect(result.current.partial).toBe('hello');
  expect(result.current.finalTranscript).toBe('');
});

it('result with isFinal: true appends to finalTranscript and clears partial', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'hello world' }] });
  });

  expect(result.current.finalTranscript).toBe('hello world');
  expect(result.current.partial).toBe('');
});

it('multiple finals accumulate with single space separator', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'first' }] });
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'second' }] });
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'third' }] });
  });

  expect(result.current.finalTranscript).toBe('first second third');
});

it('stop() resolves with accumulated final transcript trimmed', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'hello' }] });
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'world' }] });
  });

  let transcript = '';
  await act(async () => {
    transcript = await result.current.stop();
  });

  expect(transcript).toBe('hello world');
});

it('reset() returns to idle with empty strings', async () => {
  const { result } = renderHook(() => useTranscriber());

  await act(async () => {
    await result.current.start();
  });

  act(() => {
    __mockEmit('result', { isFinal: true, results: [{ transcript: 'something' }] });
  });

  act(() => {
    result.current.reset();
  });

  expect(result.current.status).toBe('idle');
  expect(result.current.partial).toBe('');
  expect(result.current.finalTranscript).toBe('');
  expect(result.current.error).toBeNull();
});
