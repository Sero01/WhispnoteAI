import type { Card, CardDraft } from '@/types';
import { decksRepo } from '@/lib/db/decksRepo';
import { cardsRepo } from '@/lib/db/cardsRepo';
import { getActiveLLMClient } from './factory';

export async function generateCardFromTranscript(transcript: string): Promise<CardDraft> {
  const client = await getActiveLLMClient();
  if (!client) throw new Error('No LLM client configured');

  const [decks, categories] = await Promise.all([
    decksRepo.list(),
    cardsRepo.listCategories(),
  ]);

  const draft = await client.generateCard({
    transcript,
    context: { decks, categories },
  });

  return draft;
}

export async function saveCardFromDraft(noteId: string, draft: CardDraft): Promise<Card> {
  let deckId: string | null = null;

  if (draft.deck.name) {
    const existing = await decksRepo.getByName(draft.deck.name);
    if (existing) {
      deckId = existing.id;
    } else {
      const newDeck = await decksRepo.create({
        name: draft.deck.name,
        accent: draft.deck.accent ?? 'sage',
      });
      deckId = newDeck.id;
    }
  }

  return cardsRepo.create({
    noteId,
    deckId,
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    tags: draft.tags,
    category: draft.category,
    importance: draft.importance,
    accent: draft.accent,
  });
}

export async function transcribeAndPersist(noteId: string, transcript: string): Promise<Card> {
  const draft = await generateCardFromTranscript(transcript);
  return saveCardFromDraft(noteId, draft);
}
