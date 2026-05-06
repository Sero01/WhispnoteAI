import { useQuery } from '@tanstack/react-query';
import { cardsRepo } from '@/lib/db';
import type { CardFilter } from '@/lib/db/cardsRepo';

export function useCards(filter?: CardFilter) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cards', filter ?? {}],
    queryFn: () => cardsRepo.list(filter),
  });

  return { data, isLoading, refetch };
}
