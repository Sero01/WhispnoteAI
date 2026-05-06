import { render, screen } from '@testing-library/react-native';
import { useSettings } from '@/store/settings';
import RootLayout from '../../app/_layout';

const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const { View } = require('react-native');
  return {
    useRouter: () => ({ replace: mockReplace }),
    Stack: Object.assign(
      () => <View testID="stack" />,
      { Screen: () => null },
    ),
    Redirect: ({ href }: { href: string }) => (
      <View testID={`redirect-${href.replace('/', '')}`} />
    ),
  };
});

describe('RootLayout redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettings.getState().reset();
  });

  it('renders Redirect when onboarded is false', () => {
    useSettings.setState({ onboarded: false });
    render(<RootLayout />);
    expect(screen.getByTestId('redirect-onboarding')).toBeTruthy();
  });

  it('renders Stack when onboarded is true', () => {
    useSettings.setState({ onboarded: true, provider: 'openai' });
    render(<RootLayout />);
    expect(screen.getByTestId('stack')).toBeTruthy();
  });
});
