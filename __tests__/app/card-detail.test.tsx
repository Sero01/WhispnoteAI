import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';
import CardDetailScreen from '../../app/card/[id]';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'card-1' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  Stack: { Screen: () => null },
}));

jest.mock('@/lib/db', () => ({
  cardsRepo: {
    setBookmarked: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  decksRepo: {
    get: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock('@/features/card-detail/useCard', () => ({
  useCard: jest.fn(),
}));

beforeAll(() => {
  jest.spyOn(Alert, 'alert').mockImplementation((_title: string, _message?: string, buttons?: AlertButton[]) => {
    const destructive = buttons?.find((b) => b.style === 'destructive');
    if (destructive?.onPress) (destructive.onPress as () => void)();
  });
});

const { cardsRepo } = jest.requireMock('@/lib/db') as { cardsRepo: { setBookmarked: jest.Mock; delete: jest.Mock; update: jest.Mock } };
const { decksRepo } = jest.requireMock('@/lib/db') as { decksRepo: { get: jest.Mock; list: jest.Mock } };
const { useCard } = jest.requireMock('@/features/card-detail/useCard') as { useCard: jest.Mock };

const mockCard = {
  id: 'card-1',
  noteId: 'note-1',
  deckId: 'deck-1',
  title: 'Machine Learning Basics',
  summary: 'An introduction to ML concepts',
  body: '# Supervised Learning\n\nTraining with labeled data.\n\n# Unsupervised Learning\n\nFinding patterns in unlabeled data.',
  tags: ['ml', 'ai'],
  category: 'Engineering',
  importance: 4 as const,
  accent: 'sage' as const,
  bookmarked: false,
  createdAt: 1,
  updatedAt: 1,
};

const mockDeck = {
  id: 'deck-1',
  name: 'Engineering',
  accent: 'sage' as const,
  createdAt: 1,
  updatedAt: 1,
};

function renderScreen() {
  return render(
    <AppProviders>
      <CardDetailScreen />
    </AppProviders>,
  );
}

describe('CardDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCard.mockReturnValue({
      data: mockCard,
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  it('renders title, summary, category, importance, body paragraphs, and tags', () => {
    decksRepo.get.mockResolvedValue(mockDeck);
    renderScreen();

    expect(screen.getByText('Machine Learning Basics')).toBeTruthy();
    expect(screen.getByText('An introduction to ML concepts')).toBeTruthy();
    expect(screen.getByText('Engineering · importance 4')).toBeTruthy();
    expect(screen.getByText('Training with labeled data.')).toBeTruthy();
    expect(screen.getByText('Finding patterns in unlabeled data.')).toBeTruthy();
    expect(screen.getByText('ml')).toBeTruthy();
    expect(screen.getByText('ai')).toBeTruthy();
  });

  it('renders "in {deckName}" when deck is resolved', async () => {
    decksRepo.get.mockResolvedValue(mockDeck);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('in Engineering')).toBeTruthy();
    });
  });

  it('renders "in unfiled" when deckId is null', () => {
    useCard.mockReturnValue({
      data: { ...mockCard, deckId: null },
      isLoading: false,
      refetch: jest.fn(),
    });
    renderScreen();

    expect(screen.getByText('in unfiled')).toBeTruthy();
  });

  it('tapping the bookmark IconButton calls setBookmarked with toggled value', async () => {
    decksRepo.get.mockResolvedValue(mockDeck);
    cardsRepo.setBookmarked.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.press(screen.getByLabelText('Toggle bookmark'));
    await waitFor(() => {
      expect(cardsRepo.setBookmarked).toHaveBeenCalledWith('card-1', true);
    });
  });

  it('tapping delete and confirming calls delete and replaces route', async () => {
    decksRepo.get.mockResolvedValue(mockDeck);
    cardsRepo.delete.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.press(screen.getByLabelText('Delete card'));
    await waitFor(() => {
      expect(cardsRepo.delete).toHaveBeenCalledWith('card-1');
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['decks-with-count'] });
  });

  it('shows missing-card state when card is null', () => {
    useCard.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    });
    renderScreen();

    expect(screen.getByText('This card no longer exists.')).toBeTruthy();
    fireEvent.press(screen.getByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('tapping deck pill opens sheet; tapping a deck row updates card deck', async () => {
    decksRepo.get.mockResolvedValue(mockDeck);
    decksRepo.list.mockResolvedValue([mockDeck]);
    cardsRepo.update.mockResolvedValue(undefined);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('in Engineering')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('in Engineering'));

    await waitFor(() => {
      expect(screen.getByText('Move to deck')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Engineering'));

    await waitFor(() => {
      expect(cardsRepo.update).toHaveBeenCalledWith('card-1', { deckId: 'deck-1' });
    });
  });
});
