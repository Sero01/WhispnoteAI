import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import { useSettings } from '@/store/settings';
import { setApiKey } from '@/lib/secureStore';
import SettingsScreen from '../../app/settings';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/lib/secureStore', () => ({
  setApiKey: jest.fn(),
  clearApiKey: jest.fn(),
}));

function renderScreen() {
  return render(
    <AppProviders>
      <SettingsScreen />
    </AppProviders>,
  );
}

describe('Settings screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettings.getState().reset();
  });

  it('renders the display heading', () => {
    renderScreen();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders the AI provider section with eyebrow', () => {
    renderScreen();
    expect(screen.getByText('AI provider')).toBeTruthy();
  });

  it('renders the API key section with eyebrow', () => {
    renderScreen();
    expect(screen.getByText('API key')).toBeTruthy();
  });

  it('hides model override section when provider is not openrouter', () => {
    useSettings.setState({ provider: 'openai' });
    renderScreen();
    expect(screen.queryByText('Model override')).toBeNull();
  });

  it('shows model override section when provider is openrouter', () => {
    useSettings.setState({ provider: 'openrouter', modelOverride: null });
    renderScreen();
    expect(screen.getByText('Model override')).toBeTruthy();
  });

  it('shows model override section and input placeholder when openrouter', () => {
    useSettings.setState({ provider: 'openrouter', modelOverride: null });
    renderScreen();
    expect(screen.getByPlaceholderText('e.g. google/gemini-2.5-flash')).toBeTruthy();
  });

  it('pressing Update key with empty key does nothing', () => {
    useSettings.setState({ provider: 'openai' });
    renderScreen();
    fireEvent.press(screen.getByText('Update key'));
    expect(setApiKey).not.toHaveBeenCalled();
  });

  it('pressing Update key with valid key calls setApiKey', async () => {
    useSettings.setState({ provider: 'openai' });

    renderScreen();
    const input = screen.getByPlaceholderText('Paste your API key');
    fireEvent.changeText(input, 'sk-' + 'a'.repeat(30));

    await act(async () => {
      fireEvent.press(screen.getByText('Update key'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(setApiKey).toHaveBeenCalledWith('sk-' + 'a'.repeat(30));
  });

  it('shows error message for malformed key', () => {
    useSettings.setState({ provider: 'openai' });
    renderScreen();
    const input = screen.getByPlaceholderText('Paste your API key');
    fireEvent.changeText(input, 'bad-key');

    fireEvent.press(screen.getByText('Update key'));

    expect(screen.getByText('OpenAI key must start with sk-')).toBeTruthy();
  });

  it('renders the sign out / reset button', () => {
    renderScreen();
    expect(screen.getByText('Sign out / reset')).toBeTruthy();
  });
});
