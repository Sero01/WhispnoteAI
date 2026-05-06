import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import DecksScreen from '../../app/decks';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

const mockDecksWithCount = {
  data: [
    { id: 'd1', name: 'Engineering', accent: 'sage' as const, cardCount: 3, createdAt: 1, updatedAt: 1 },
    { id: 'd2', name: 'Journal', accent: 'lavender' as const, cardCount: 1, createdAt: 2, updatedAt: 2 },
    { id: 'd3', name: 'Empty Deck', accent: 'peach' as const, cardCount: 0, createdAt: 3, updatedAt: 3 },
  ],
  isLoading: false,
  refetch: jest.fn(),
};

const mockEmpty = { data: [], isLoading: false, refetch: jest.fn() };
const mockLoading = { data: undefined, isLoading: true, refetch: jest.fn() };

jest.mock('@/features/decks/useDecksWithCount', () => ({
  useDecksWithCount: jest.fn(),
}));

const { useDecksWithCount } = jest.requireMock('@/features/decks/useDecksWithCount');

function renderScreen() {
  return render(
    <AppProviders>
      <DecksScreen />
    </AppProviders>,
  );
}

describe('DecksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and all deck tiles', () => {
    useDecksWithCount.mockReturnValue(mockDecksWithCount);
    renderScreen();

    expect(screen.getByText('Decks')).toBeTruthy();
    expect(screen.getByText('Engineering')).toBeTruthy();
    expect(screen.getByText('Journal')).toBeTruthy();
    expect(screen.getByText('Empty Deck')).toBeTruthy();
  });

  it('renders card counts with correct pluralization', () => {
    useDecksWithCount.mockReturnValue(mockDecksWithCount);
    renderScreen();

    expect(screen.getByText('3 cards')).toBeTruthy();
    expect(screen.getByText('1 card')).toBeTruthy();
    expect(screen.getByText('0 cards')).toBeTruthy();
  });

  it('shows empty state when no decks exist', () => {
    useDecksWithCount.mockReturnValue(mockEmpty);
    renderScreen();

    expect(screen.getByText('No decks yet — record your first note.')).toBeTruthy();
  });

  it('does not show empty state while loading', () => {
    useDecksWithCount.mockReturnValue(mockLoading);
    renderScreen();

    expect(screen.queryByText('No decks yet — record your first note.')).toBeNull();
  });

  it('navigates to deck detail on tile press', () => {
    useDecksWithCount.mockReturnValue(mockDecksWithCount);
    renderScreen();

    fireEvent.press(screen.getByText('Engineering'));
    expect(mockPush).toHaveBeenCalledWith('/deck/d1');

    fireEvent.press(screen.getByText('Journal'));
    expect(mockPush).toHaveBeenCalledWith('/deck/d2');
  });
});
