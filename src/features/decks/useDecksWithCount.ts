import { useQuery } from '@tanstack/react-query';
import { decksRepo, cardsRepo } from '@/lib/db';
import type { Deck } from '@/types';

export type DeckWithCount = Deck & { cardCount: number };

export function useDecksWithCount() {
  return useQuery({
    queryKey: ['decks-with-count'],
    queryFn: async () => {
      const [decks, cards] = await Promise.all([
        decksRepo.list(),
        cardsRepo.list(),
      ]);

      const countByDeckId: Record<string, number> = {};
      for (const card of cards) {
        if (!card.deckId) continue;
        countByDeckId[card.deckId] = (countByDeckId[card.deckId] ?? 0) + 1;
      }

      return decks.map((deck) => ({
        ...deck,
        cardCount: countByDeckId[deck.id] ?? 0,
      }));
    },
  });
}
