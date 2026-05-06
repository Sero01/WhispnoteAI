import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCard } from '../../../src/features/card-detail/useCard';
import type { Card } from '../../../src/types';

const mockCard: Card = {
  id: 'c1', noteId: 'n1', deckId: 'd1', title: 'Card 1', summary: '', body: '',
  tags: [], category: 'Idea', importance: 3 as const, accent: 'sage' as const,
  bookmarked: true, createdAt: 1, updatedAt: 1,
};

jest.mock('@/lib/db', () => ({
  cardsRepo: { get: jest.fn() },
}));

const { cardsRepo } = jest.requireMock('@/lib/db');

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useCard', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('calls cardsRepo.get with the given id', async () => {
    cardsRepo.get.mockResolvedValue(mockCard);

    const { result } = renderHook(() => useCard('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(cardsRepo.get).toHaveBeenCalledWith('c1');
    expect(result.current.data).toEqual(mockCard);
  });

  it('returns null when card is not found', async () => {
    cardsRepo.get.mockResolvedValue(null);

    const { result } = renderHook(() => useCard('missing'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeNull());
  });

  it('disables query when id is undefined', async () => {
    const { result } = renderHook(() => useCard(undefined), { wrapper: createWrapper() });

    expect(cardsRepo.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
