import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import OnboardingScreen from '../../app/onboarding';
import { setApiKey } from '@/lib/secureStore';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Stack: { Screen: () => null },
}));

jest.mock('@/store/settings', () => {
  const actual = jest.requireActual('@/store/settings');
  return {
    ...actual,
    useSettings: {
      ...actual.useSettings,
      getState: () => ({
        setProvider: jest.fn(),
        setOnboarded: jest.fn(),
      }),
    },
  };
});

jest.mock('@/lib/secureStore', () => ({
  setApiKey: jest.fn(),
}));

function renderScreen() {
  return render(
    <AppProviders>
      <OnboardingScreen />
    </AppProviders>,
  );
}

describe('Onboarding screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the 3 provider cards', () => {
    renderScreen();
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('Anthropic')).toBeTruthy();
    expect(screen.getByText('OpenRouter')).toBeTruthy();
  });

  it('selecting a provider shows checkmark indicator', () => {
    renderScreen();
    fireEvent.press(screen.getByText('OpenAI'));
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('with empty key and no provider, button is disabled', () => {
    renderScreen();
    const btn = screen.getByTestId('get-started-btn');
    fireEvent.press(btn);
    expect(setApiKey).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('with valid key + provider, pressing button calls setApiKey and router.replace', async () => {
    renderScreen();

    fireEvent.press(screen.getByText('OpenAI'));

    const input = screen.getByPlaceholderText('Paste your API key');
    fireEvent.changeText(input, 'sk-' + 'a'.repeat(30));

    await act(async () => {
      fireEvent.press(screen.getByTestId('get-started-btn'));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(setApiKey).toHaveBeenCalledWith('sk-' + 'a'.repeat(30));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('with malformed key, error message shows', () => {
    renderScreen();
    fireEvent.press(screen.getByText('OpenAI'));

    const input = screen.getByPlaceholderText('Paste your API key');
    fireEvent.changeText(input, 'bad-key');

    fireEvent.press(screen.getByTestId('get-started-btn'));

    expect(screen.getByText('OpenAI key must start with sk-')).toBeTruthy();
  });
});
