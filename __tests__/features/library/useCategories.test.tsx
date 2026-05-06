import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategories } from '../../../src/features/library/useCategories';

const mockCategories = ['Engineering', 'Idea', 'Journal', 'Meeting'];

jest.mock('@/lib/db', () => ({
  cardsRepo: { listCategories: jest.fn() },
}));

const { cardsRepo } = jest.requireMock('@/lib/db');

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useCategories', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns categories from the repo', async () => {
    cardsRepo.listCategories.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(mockCategories);
  });

  it('returns isLoading true while fetching', async () => {
    let resolve!: (v: typeof mockCategories) => void;
    cardsRepo.listCategories.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);

    resolve(mockCategories);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
