import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDecksWithCount } from '../../../src/features/decks/useDecksWithCount';

const mockDecks = [
  { id: 'deck-1', name: 'Engineering', accent: 'sage' as const, createdAt: 1, updatedAt: 1 },
  { id: 'deck-2', name: 'Journal', accent: 'lavender' as const, createdAt: 2, updatedAt: 2 },
  { id: 'deck-3', name: 'Empty Deck', accent: 'peach' as const, createdAt: 3, updatedAt: 3 },
];

const mockCards = [
  { id: 'c1', noteId: 'n1', deckId: 'deck-1', title: 'Card 1', summary: '', body: '', tags: [], category: 'Idea', importance: 3 as const, accent: 'sage' as const, bookmarked: false, createdAt: 1, updatedAt: 1 },
  { id: 'c2', noteId: 'n2', deckId: 'deck-1', title: 'Card 2', summary: '', body: '', tags: [], category: 'Meeting', importance: 2 as const, accent: 'sage' as const, bookmarked: false, createdAt: 2, updatedAt: 2 },
  { id: 'c3', noteId: 'n3', deckId: 'deck-2', title: 'Card 3', summary: '', body: '', tags: [], category: 'Journal', importance: 1 as const, accent: 'lavender' as const, bookmarked: false, createdAt: 3, updatedAt: 3 },
  { id: 'c4', noteId: 'n4', deckId: null, title: 'Orphan', summary: '', body: '', tags: [], category: 'Idea', importance: 3 as const, accent: 'sage' as const, bookmarked: false, createdAt: 4, updatedAt: 4 },
];

jest.mock('@/lib/db', () => ({
  decksRepo: {
    list: jest.fn(),
  },
  cardsRepo: {
    list: jest.fn(),
  },
}));

const { decksRepo, cardsRepo } = jest.requireMock('@/lib/db');

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useDecksWithCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns decks with aggregated card counts', async () => {
    decksRepo.list.mockResolvedValue(mockDecks);
    cardsRepo.list.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useDecksWithCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual([
      { ...mockDecks[0], cardCount: 2 },
      { ...mockDecks[1], cardCount: 1 },
      { ...mockDecks[2], cardCount: 0 },
    ]);
  });

  it('returns empty array when no decks exist', async () => {
    decksRepo.list.mockResolvedValue([]);
    cardsRepo.list.mockResolvedValue([]);

    const { result } = renderHook(() => useDecksWithCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('returns isLoading true while fetching', async () => {
    let resolveDecks!: (v: typeof mockDecks) => void;
    decksRepo.list.mockReturnValue(new Promise((r) => { resolveDecks = r; }));
    cardsRepo.list.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useDecksWithCount(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    resolveDecks(mockDecks);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
