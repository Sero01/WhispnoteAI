import { useQuery } from '@tanstack/react-query';
import { cardsRepo } from '@/lib/db';

export function useCard(id: string | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsRepo.get(id!),
    enabled: !!id,
  });

  return { data, isLoading, refetch };
}
