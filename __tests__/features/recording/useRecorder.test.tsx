import { renderHook, waitFor } from '@testing-library/react-native';
import { useRecorder } from '@/features/recording/useRecorder';
import { useAudioRecorder, requestRecordingPermissionsAsync } from 'expo-audio';
import { deleteAsync, moveAsync, makeDirectoryAsync } from 'expo-file-system';

jest.mock('expo-audio');
jest.mock('expo-file-system');
jest.mock('@/features/recording/audioSession', () => ({
  configureAudioForRecording: jest.fn(),
  configureAudioForPlayback: jest.fn(),
}));

import { configureAudioForPlayback } from '@/features/recording/audioSession';

const mockUseAudioRecorder = useAudioRecorder as jest.Mock;

function getMockRecorder() {
  return mockUseAudioRecorder.mock.results[0]?.value;
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('start() → status becomes recording; permission requested', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();

  expect(requestRecordingPermissionsAsync).toHaveBeenCalled();
  await waitFor(() => expect(result.current.status).toBe('recording'));
});

it('permission denied → status denied; recorder methods not called', async () => {
  const requestPermissionsMock = requestRecordingPermissionsAsync as jest.Mock;
  requestPermissionsMock.mockResolvedValueOnce({ granted: false });

  const { result } = renderHook(() => useRecorder());

  await result.current.start();

  await waitFor(() => expect(result.current.status).toBe('denied'));
  const recorder = getMockRecorder();
  expect(recorder.prepareToRecordAsync).not.toHaveBeenCalled();
  expect(recorder.record).not.toHaveBeenCalled();
});

it('stop() after recording returns a Recording', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  const recorder = getMockRecorder();
  recorder.getStatus.mockReturnValue({
    canRecord: false,
    isRecording: false,
    durationMillis: 5000,
    mediaServicesDidReset: false,
    metering: -5,
    url: 'file:///mock/temp/recording.m4a',
  });

  const recording = await result.current.stop();

  expect(recorder.stop).toHaveBeenCalled();
  expect(recording).not.toBeNull();
  expect(recording!.uri).toMatch(/^file:\/\/\/mock\/doc\/recordings\/.+\.m4a$/);
  expect(recording!.durationMs).toBe(5000);
  expect(Array.isArray(recording!.amplitudes)).toBe(true);
  expect(moveAsync).toHaveBeenCalled();
  expect(makeDirectoryAsync).toHaveBeenCalled();
});

it('discard() → calls deleteAsync and resets to idle', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  await result.current.discard();

  expect(deleteAsync).toHaveBeenCalled();
  await waitFor(() => expect(result.current.status).toBe('idle'));
  expect(result.current.error).toBeNull();
});

it('pause() → paused; resume() → recording', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  await result.current.pause();
  await waitFor(() => expect(result.current.status).toBe('paused'));

  await result.current.resume();
  await waitFor(() => expect(result.current.status).toBe('recording'));
});

it('stop() reads finalized URI after stop resolves', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  const recorder = getMockRecorder();
  recorder.uri = 'file:///pre-stop.m4a';
  recorder.stop.mockImplementationOnce(async () => {
    recorder.isRecording = false;
    recorder.uri = 'file:///post-stop.m4a';
  });
  recorder.getStatus.mockReturnValue({
    canRecord: false,
    isRecording: false,
    durationMillis: 3000,
    mediaServicesDidReset: false,
    metering: -5,
    url: 'file:///post-stop.m4a',
  });

  await result.current.stop();

  expect(moveAsync).toHaveBeenCalledWith(
    expect.objectContaining({ from: 'file:///post-stop.m4a' }),
  );
});

it('stop() returns null when finalized URI is null', async () => {
  const { result } = renderHook(() => useRecorder());
  const recorder = getMockRecorder();
  recorder.uri = null;

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  const recording = await result.current.stop();

  expect(recording).toBeNull();
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.error).not.toBeNull();
  expect(moveAsync).not.toHaveBeenCalled();
});

it('stop() calls configureAudioForPlayback on success', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  const recorder = getMockRecorder();
  recorder.getStatus.mockReturnValue({
    canRecord: false,
    isRecording: false,
    durationMillis: 3000,
    mediaServicesDidReset: false,
    metering: -5,
    url: 'file:///mock/temp/recording.m4a',
  });

  await result.current.stop();

  expect(configureAudioForPlayback).toHaveBeenCalled();
});

it('stop() calls configureAudioForPlayback even on error', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  const recorder = getMockRecorder();
  recorder.stop.mockRejectedValueOnce(new Error('stop failed'));

  const recording = await result.current.stop();

  expect(recording).toBeNull();
  expect(configureAudioForPlayback).toHaveBeenCalled();
});

it('discard() calls configureAudioForPlayback on the happy path', async () => {
  const { result } = renderHook(() => useRecorder());

  await result.current.start();
  await waitFor(() => expect(result.current.status).toBe('recording'));

  await result.current.discard();

  expect(configureAudioForPlayback).toHaveBeenCalled();
});
