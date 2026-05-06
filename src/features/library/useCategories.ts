import { useQuery } from '@tanstack/react-query';
import { cardsRepo } from '@/lib/db';

export function useCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['cards-categories'],
    queryFn: () => cardsRepo.listCategories(),
  });

  return { data, isLoading };
}
