import { resetDb } from '@/lib/db';
import { cardsRepo } from '@/lib/db/cardsRepo';
import { decksRepo } from '@/lib/db/decksRepo';
import { notesRepo } from '@/lib/db/notesRepo';
import type { CardDraft, Card } from '@/types';

const mockGenerateCard = jest.fn();
const mockGetActiveLLMClient = jest.fn();

jest.mock('@/lib/ai/factory', () => ({
  getActiveLLMClient: () => mockGetActiveLLMClient(),
}));

function makeDraft(overrides: Partial<CardDraft> = {}): CardDraft {
  return {
    title: 'Test Card',
    summary: 'A test summary',
    body: '# Hello',
    tags: ['test'],
    category: 'Idea',
    importance: 3,
    deck: { name: 'Test Deck', isNew: false },
    accent: 'lavender',
    ...overrides,
  };
}

async function seedNote(): Promise<string> {
  const note = await notesRepo.create({ audioUri: 'file:///test.mp3', durationMs: 1000 });
  return note.id;
}

describe('pipeline', () => {
  let pipeline: typeof import('@/lib/ai/pipeline');

  beforeAll(async () => {
    pipeline = require('@/lib/ai/pipeline');
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCardFromDraft', () => {
    it('with isNew: true creates a new deck and uses its id', async () => {
      const noteId = await seedNote();
      const draft = makeDraft({ deck: { name: 'New Deck', isNew: true, accent: 'peach' } });
      const card = await pipeline.saveCardFromDraft(noteId, draft);

      const decks = await decksRepo.list();
      expect(decks).toHaveLength(1);
      expect(decks[0].name).toBe('New Deck');
      expect(decks[0].accent).toBe('peach');

      expect(card.deckId).toBe(decks[0].id);
      expect(card.title).toBe('Test Card');
      expect(card.accent).toBe('lavender');
    });

    it('with isNew: false matches an existing deck by name', async () => {
      const noteId = await seedNote();
      const existing = await decksRepo.create({ name: 'Existing Deck', accent: 'sage' });

      const draft = makeDraft({ deck: { name: 'Existing Deck', isNew: false } });
      const card = await pipeline.saveCardFromDraft(noteId, draft);

      expect(card.deckId).toBe(existing.id);
    });

    it('with isNew: false and no matching deck creates a new one as fallback', async () => {
      const noteId = await seedNote();
      const draft = makeDraft({ deck: { name: 'Auto Deck', isNew: false } });
      const card = await pipeline.saveCardFromDraft(noteId, draft);

      const decks = await decksRepo.list();
      expect(decks).toHaveLength(1);
      expect(decks[0].name).toBe('Auto Deck');
      expect(card.deckId).toBe(decks[0].id);
    });

    it('with empty deck name sets deckId to null', async () => {
      const noteId = await seedNote();
      const draft = makeDraft({ deck: { name: '', isNew: false } });
      const card = await pipeline.saveCardFromDraft(noteId, draft);

      expect(card.deckId).toBeNull();
    });
  });

  describe('generateCardFromTranscript', () => {
    it('reads decks + categories and forwards them to the client', async () => {
      await decksRepo.create({ name: 'Work', accent: 'sage' });
      const noteId = await seedNote();
      await cardsRepo.create({
        noteId,
        title: 'Existing Card',
        summary: 'sum',
        body: 'body',
        tags: [],
        category: 'Meeting',
        importance: 3 as const,
        accent: 'lavender',
      });

      const client = { provider: 'openai' as const, model: 'gpt-4o-mini', generateCard: mockGenerateCard };
      mockGetActiveLLMClient.mockResolvedValue(client);
      mockGenerateCard.mockResolvedValue(makeDraft());

      const result = await pipeline.generateCardFromTranscript('some transcript');

      expect(mockGenerateCard).toHaveBeenCalledWith({
        transcript: 'some transcript',
        context: {
          decks: [expect.objectContaining({ name: 'Work' })],
          categories: ['Meeting'],
        },
      });
      expect(result.title).toBe('Test Card');
    });

    it('throws when no client configured', async () => {
      mockGetActiveLLMClient.mockResolvedValue(null);
      await expect(pipeline.generateCardFromTranscript('test')).rejects.toThrow(
        'No LLM client configured',
      );
    });
  });

  describe('transcribeAndPersist', () => {
    it('end-to-end with mocked client returns a Card', async () => {
      const noteId = await seedNote();
      const client = { provider: 'openai' as const, model: 'gpt-4o-mini', generateCard: mockGenerateCard };
      mockGetActiveLLMClient.mockResolvedValue(client);
      mockGenerateCard.mockResolvedValue(
        makeDraft({
          title: 'AI Card',
          deck: { name: 'AI Deck', isNew: true, accent: 'cream' },
        }),
      );

      const card: Card = await pipeline.transcribeAndPersist(noteId, 'transcript text');

      expect(card.title).toBe('AI Card');
      expect(card.noteId).toBe(noteId);

      const decks = await decksRepo.list();
      expect(decks).toHaveLength(1);
      expect(decks[0].name).toBe('AI Deck');
    });
  });
});
