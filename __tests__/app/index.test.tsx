import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import Index from '../../app/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));

const mockCards = [
  { id: 'c1', noteId: 'n1', deckId: 'd1', title: 'Card One', summary: 'Summary one', body: '',
    tags: [], category: 'Idea', importance: 3 as const, accent: 'sage' as const,
    bookmarked: true, createdAt: 1, updatedAt: 1 },
  { id: 'c2', noteId: 'n2', deckId: null, title: 'Card Two', summary: 'Summary two', body: '',
    tags: [], category: 'Meeting', importance: 2 as const, accent: 'lavender' as const,
    bookmarked: false, createdAt: 2, updatedAt: 2 },
];

const mockCategories = ['Idea', 'Meeting'];

jest.mock('@/features/library/useCards', () => ({
  useCards: jest.fn(),
}));

jest.mock('@/features/library/useCategories', () => ({
  useCategories: jest.fn(),
}));

const { useCards } = jest.requireMock('@/features/library/useCards');
const { useCategories } = jest.requireMock('@/features/library/useCategories');

function renderScreen() {
  return render(
    <AppProviders>
      <Index />
    </AppProviders>,
  );
}

describe('Index screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "My Notes" heading', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    expect(screen.getByText('My Notes')).toBeTruthy();
  });

  it('renders all cards from useCards', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    expect(screen.getByText('Card One')).toBeTruthy();
    expect(screen.getByText('Card Two')).toBeTruthy();
  });

  it('switching to Bookmarked tab calls useCards with { bookmarked: true }', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    fireEvent.press(screen.getByText('Bookmarked'));

    expect(useCards).toHaveBeenCalledWith({ bookmarked: true });
  });

  it('tapping a category chip filters to that category', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    fireEvent.press(screen.getAllByText('Idea')[0]);

    expect(useCards).toHaveBeenCalledWith({ category: 'Idea' });
  });

  it('tapping "All" category chip clears category filter', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    fireEvent.press(screen.getAllByText('Idea')[0]);
    fireEvent.press(screen.getByText('All'));

    expect(useCards).toHaveBeenLastCalledWith(undefined);
  });

  it('tap on card navigates to /card/:id', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    fireEvent.press(screen.getByText('Card One'));
    expect(mockPush).toHaveBeenCalledWith('/card/c1');

    fireEvent.press(screen.getByText('Card Two'));
    expect(mockPush).toHaveBeenCalledWith('/card/c2');
  });

  it('shows empty state when useCards returns empty array', () => {
    useCards.mockReturnValue({ data: [], isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    expect(screen.getByText('Your notes will appear here. Tap the mic to capture one.')).toBeTruthy();
  });

  it('shows empty state when useCards returns undefined and not loading', () => {
    useCards.mockReturnValue({ data: undefined, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    expect(screen.getByText('Your notes will appear here. Tap the mic to capture one.')).toBeTruthy();
  });

  it('"Record a note" button navigates to /record', () => {
    useCards.mockReturnValue({ data: mockCards, isLoading: false, refetch: jest.fn() });
    useCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderScreen();

    fireEvent.press(screen.getByText('Record a note'));
    expect(mockPush).toHaveBeenCalledWith('/record');
  });
});
