import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import DeckDetailScreen from '../../app/deck/[id]';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'd1' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  Stack: { Screen: () => null },
}));

jest.mock('@/features/decks/useDeckWithCards', () => ({
  useDeckWithCards: jest.fn(),
}));

const { useDeckWithCards } = jest.requireMock('@/features/decks/useDeckWithCards');

let sheetOnDeleted: ((id: string) => void) | null = null;
jest.mock('@/features/decks/DeckEditSheet', () => {
  const { Text } = require('@/components/Text');
  return {
    DeckEditSheet: jest.fn((props: { visible: boolean; onDeleted: (id: string) => void }) => {
      sheetOnDeleted = props.onDeleted;
      return props.visible ? <Text testID="sheet-visible">Sheet visible</Text> : null;
    }),
  };
});

const mockDeck = {
  id: 'd1',
  name: 'Engineering',
  accent: 'sage' as const,
  createdAt: 1,
  updatedAt: 1,
};

const mockCards = [
  {
    id: 'c1',
    noteId: 'n1',
    deckId: 'd1',
    title: 'Binary Search',
    summary: 'O(log n) divide and conquer algorithm',
    body: '# Binary Search\n\nDetails here.',
    tags: ['algorithms'],
    category: 'Engineering',
    importance: 3 as const,
    accent: 'sage' as const,
    bookmarked: false,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'c2',
    noteId: 'n2',
    deckId: 'd1',
    title: 'Recursion',
    summary: 'Function that calls itself',
    body: '# Recursion\n\nBase case and recursive case.',
    tags: ['algorithms'],
    category: 'Engineering',
    importance: 2 as const,
    accent: 'lavender' as const,
    bookmarked: false,
    createdAt: 2,
    updatedAt: 2,
  },
];

function renderScreen() {
  return render(
    <AppProviders>
      <DeckDetailScreen />
    </AppProviders>,
  );
}

describe('DeckDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sheetOnDeleted = null;
  });

  it('renders deck name and card count', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: mockCards,
      isLoading: false,
    });
    renderScreen();

    expect(screen.getByText('Engineering')).toBeTruthy();
    expect(screen.getByText('2 cards')).toBeTruthy();
  });

  it('renders all card titles and summaries', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: mockCards,
      isLoading: false,
    });
    renderScreen();

    expect(screen.getByText('Binary Search')).toBeTruthy();
    expect(screen.getByText('O(log n) divide and conquer algorithm')).toBeTruthy();
    expect(screen.getByText('Recursion')).toBeTruthy();
    expect(screen.getByText('Function that calls itself')).toBeTruthy();
  });

  it('navigates to card detail on card press', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: mockCards,
      isLoading: false,
    });
    renderScreen();

    fireEvent.press(screen.getByText('Binary Search'));
    expect(mockPush).toHaveBeenCalledWith('/card/c1');

    fireEvent.press(screen.getByText('Recursion'));
    expect(mockPush).toHaveBeenCalledWith('/card/c2');
  });

  it('shows empty state when no cards', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: [],
      isLoading: false,
    });
    renderScreen();

    expect(screen.getByText('No cards in this deck yet.')).toBeTruthy();
  });

  it('shows not-found state when deck is null', () => {
    useDeckWithCards.mockReturnValue({
      deck: null,
      cards: [],
      isLoading: false,
    });
    renderScreen();

    expect(screen.getByText('This deck no longer exists.')).toBeTruthy();
  });

  it('back button navigates back when deck not found', () => {
    useDeckWithCards.mockReturnValue({
      deck: null,
      cards: [],
      isLoading: false,
    });
    renderScreen();

    fireEvent.press(screen.getByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('tapping edit IconButton shows the sheet', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: mockCards,
      isLoading: false,
    });
    renderScreen();

    expect(screen.queryByTestId('sheet-visible')).toBeNull();
    fireEvent.press(screen.getByLabelText('Edit deck'));
    expect(screen.getByTestId('sheet-visible')).toBeTruthy();
  });

  it('after delete, router.replace is called', () => {
    useDeckWithCards.mockReturnValue({
      deck: mockDeck,
      cards: mockCards,
      isLoading: false,
    });
    renderScreen();

    fireEvent.press(screen.getByLabelText('Edit deck'));
    sheetOnDeleted?.('d1');
    expect(mockReplace).toHaveBeenCalledWith('/decks');
  });
});
