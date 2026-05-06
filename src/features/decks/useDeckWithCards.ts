import { useQuery } from '@tanstack/react-query';
import { decksRepo, cardsRepo } from '@/lib/db';
import type { Deck, Card } from '@/types';

export function useDeckWithCards(deckId: string | undefined): {
  deck: Deck | null | undefined;
  cards: Card[] | undefined;
  isLoading: boolean;
} {
  const deckQuery = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => (deckId ? decksRepo.get(deckId) : null),
    enabled: !!deckId,
  });

  const cardsQuery = useQuery({
    queryKey: ['cards', 'deck', deckId],
    queryFn: () => (deckId ? cardsRepo.list({ deckId }) : []),
    enabled: !!deckId,
  });

  return {
    deck: deckQuery.data,
    cards: cardsQuery.data,
    isLoading: deckQuery.isLoading || cardsQuery.isLoading,
  };
}
