import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import RecordScreen from '../../app/record';

const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockDiscard = jest.fn();
const mockTranscriberStart = jest.fn();
const mockTranscriberStop = jest.fn();
const mockNotesCreate = jest.fn();
const mockSetTranscript = jest.fn();
const mockTranscribeAndPersist = jest.fn();
const mockGetActiveLLMClient = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, back: mockRouterBack }),
  Stack: { Screen: () => null },
}));

jest.mock('@/features/recording/useRecorder', () => ({
  useRecorder: jest.fn(),
}));

jest.mock('@/features/transcription/useTranscriber', () => ({
  useTranscriber: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  getDb: jest.fn(),
  resetDb: jest.fn(),
  notesRepo: {
    create: (...args: unknown[]) => mockNotesCreate(...args),
    setTranscript: (...args: unknown[]) => mockSetTranscript(...args),
  },
  decksRepo: {},
  cardsRepo: {},
}));

jest.mock('@/lib/ai/pipeline', () => ({
  transcribeAndPersist: (...args: unknown[]) => mockTranscribeAndPersist(...args),
}));

jest.mock('@/lib/ai/factory', () => ({
  getActiveLLMClient: () => mockGetActiveLLMClient(),
}));

function renderScreen() {
  return render(
    <AppProviders>
      <RecordScreen />
    </AppProviders>,
  );
}

function mockRecorderState(overrides: Record<string, unknown> = {}) {
  const { useRecorder } = require('@/features/recording/useRecorder');
  useRecorder.mockReturnValue({
    status: 'idle',
    elapsedMs: 0,
    amplitudes: [],
    error: null,
    start: mockStart,
    stop: mockStop,
    discard: mockDiscard,
    pause: jest.fn(),
    resume: jest.fn(),
    ...overrides,
  });
}

function mockTranscriberState(overrides: Record<string, unknown> = {}) {
  const { useTranscriber } = require('@/features/transcription/useTranscriber');
  useTranscriber.mockReturnValue({
    status: 'idle',
    partial: '',
    finalTranscript: '',
    error: null,
    start: mockTranscriberStart,
    stop: mockTranscriberStop,
    reset: jest.fn(),
    ...overrides,
  });
}

describe('Record screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTranscriberStop.mockResolvedValue('');
    mockRecorderState();
    mockTranscriberState();
  });

  it('renders timer "00:00" initially', () => {
    renderScreen();
    expect(screen.getByText('00:00')).toBeTruthy();
  });

  it('pressing the mic button triggers recorder.start and transcriber.start when idle', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('record-toggle'));
    expect(mockStart).toHaveBeenCalled();
    expect(mockTranscriberStart).toHaveBeenCalled();
  });

  it('pressing the mic button triggers recorder.stop and transcriber.stop when recording', async () => {
    mockRecorderState({
      status: 'recording',
      elapsedMs: 5234,
      amplitudes: [0.5, 0.3],
    });
    mockStop.mockResolvedValue({
      uri: 'file:///recording.m4a',
      durationMs: 5000,
      amplitudes: [],
    });

    renderScreen();
    expect(screen.getByText('00:05')).toBeTruthy();
    expect(screen.getByLabelText('Stop recording')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('record-toggle'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockStop).toHaveBeenCalled();
    expect(mockTranscriberStop).toHaveBeenCalled();
  });

  it('after stopping, pressing Save calls notesRepo.create, setTranscript, and router.replace', async () => {
    mockRecorderState({
      status: 'stopped',
      elapsedMs: 5000,
      amplitudes: [],
    });
    mockStop.mockResolvedValue({
      uri: 'file:///recording.m4a',
      durationMs: 5000,
      amplitudes: [],
    });
    mockTranscriberStop.mockResolvedValue('Hello world transcript');
    mockNotesCreate.mockResolvedValue({ id: 'note-1', audioUri: 'file:///recording.m4a', durationMs: 5000, transcript: null, createdAt: Date.now() });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockNotesCreate).toHaveBeenCalledWith({
      audioUri: 'file:///recording.m4a',
      durationMs: 5000,
    });
    expect(mockSetTranscript).toHaveBeenCalledWith('note-1', 'Hello world transcript');
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('pressing Discard calls discard and router.back', async () => {
    mockRecorderState({
      status: 'stopped',
      elapsedMs: 3000,
      amplitudes: [],
    });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText('Discard'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockDiscard).toHaveBeenCalled();
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('permission denied shows the card text', () => {
    mockRecorderState({ status: 'denied' });

    renderScreen();
    expect(
      screen.getByText(
        'Microphone permission denied. Open Settings to grant access.',
      ),
    ).toBeTruthy();
  });

  it('when transcriber denied, save still calls create and replace but not setTranscript', async () => {
    mockRecorderState({
      status: 'stopped',
      elapsedMs: 5000,
      amplitudes: [],
    });
    mockTranscriberState({ status: 'denied' });
    mockStop.mockResolvedValue({
      uri: 'file:///recording.m4a',
      durationMs: 5000,
      amplitudes: [],
    });
    mockTranscriberStop.mockResolvedValue('');
    mockNotesCreate.mockResolvedValue({ id: 'note-2', audioUri: 'file:///recording.m4a', durationMs: 5000, transcript: null, createdAt: Date.now() });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockNotesCreate).toHaveBeenCalledWith({
      audioUri: 'file:///recording.m4a',
      durationMs: 5000,
    });
    expect(mockSetTranscript).not.toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('shows "Transcription unavailable" eyebrow when transcriber denied', () => {
    mockTranscriberState({ status: 'denied' });

    renderScreen();
    expect(screen.getByText('Transcription unavailable')).toBeTruthy();
  });

  it('renders live partial text when transcriber.partial is set', () => {
    mockTranscriberState({ partial: 'Hello partial' });

    renderScreen();
    expect(screen.getByText('Hello partial')).toBeTruthy();
  });

  describe('pipeline integration', () => {
    beforeEach(() => {
      mockNotesCreate.mockResolvedValue({
        id: 'note-pipe',
        audioUri: 'file:///recording.m4a',
        durationMs: 5000,
        transcript: null,
        createdAt: Date.now(),
      });
    });

    it('calls transcribeAndPersist when transcript exists and client is configured', async () => {
      mockRecorderState({ status: 'stopped', elapsedMs: 5000, amplitudes: [] });
      mockTranscriberStop.mockResolvedValue('Hello world');
      mockGetActiveLLMClient.mockResolvedValue({ provider: 'openai', model: 'gpt-4o-mini', generateCard: jest.fn() });
      mockTranscribeAndPersist.mockResolvedValue({ id: 'card-1' });

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText('Save'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(mockTranscribeAndPersist).toHaveBeenCalledWith('note-pipe', 'Hello world');
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });

    it('shows "Conjuring a card..." overlay during the AI call', async () => {
      mockRecorderState({ status: 'stopped', elapsedMs: 5000, amplitudes: [] });
      mockTranscriberStop.mockResolvedValue('Hello world');
      mockGetActiveLLMClient.mockResolvedValue({ provider: 'openai', model: 'gpt-4o-mini', generateCard: jest.fn() });
      mockTranscribeAndPersist.mockImplementation(() => new Promise(() => {})); // never resolves

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText('Save'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(screen.getByText('Conjuring a card...')).toBeTruthy();
    });

    it('when client is null, save calls transcribeAndPersist and silently skips', async () => {
      mockRecorderState({ status: 'stopped', elapsedMs: 5000, amplitudes: [] });
      mockTranscriberStop.mockResolvedValue('Hello world');
      mockTranscribeAndPersist.mockRejectedValue(new Error('No LLM client configured'));

      renderScreen();

      await act(async () => {
        fireEvent.press(screen.getByText('Save'));
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(mockTranscribeAndPersist).toHaveBeenCalledTimes(1);
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });
});
