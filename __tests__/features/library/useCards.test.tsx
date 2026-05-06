import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCards } from '../../../src/features/library/useCards';
import type { Card } from '../../../src/types';

const mockCards: Card[] = [
  { id: 'c1', noteId: 'n1', deckId: 'd1', title: 'Card 1', summary: '', body: '',
    tags: [], category: 'Idea', importance: 3 as const, accent: 'sage' as const,
    bookmarked: true, createdAt: 1, updatedAt: 1 },
  { id: 'c2', noteId: 'n2', deckId: null, title: 'Card 2', summary: '', body: '',
    tags: [], category: 'Meeting', importance: 2 as const, accent: 'lavender' as const,
    bookmarked: false, createdAt: 2, updatedAt: 2 },
];

jest.mock('@/lib/db', () => ({
  cardsRepo: { list: jest.fn() },
}));

const { cardsRepo } = jest.requireMock('@/lib/db');

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useCards', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns all cards when no filter is provided', async () => {
    cardsRepo.list.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCards(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(mockCards);
  });

  it('passes filter to cardsRepo.list', async () => {
    cardsRepo.list.mockResolvedValue([mockCards[0]]);

    const { result } = renderHook(() => useCards({ bookmarked: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(cardsRepo.list).toHaveBeenCalledWith({ bookmarked: true });
    expect(result.current.data).toEqual([mockCards[0]]);
  });

  it('returns isLoading true while fetching', async () => {
    let resolveCards!: (v: typeof mockCards) => void;
    cardsRepo.list.mockReturnValue(new Promise((r) => { resolveCards = r; }));

    const { result } = renderHook(() => useCards(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);

    resolveCards(mockCards);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
