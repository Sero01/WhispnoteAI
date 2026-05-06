export type DeckAccent = 'sage' | 'lavender' | 'peach' | 'cream';

export type CardImportance = 1 | 2 | 3 | 4 | 5;

export type Card = {
  id: string;
  noteId: string;
  deckId: string | null;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  category: string;
  importance: CardImportance;
  accent: DeckAccent;
  bookmarked: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Note = {
  id: string;
  audioUri: string;
  transcript: string | null;
  durationMs: number;
  createdAt: number;
};

export type DeckSummary = { id: string; name: string; accent: DeckAccent };

export type CardDraft = {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  category: string;
  importance: CardImportance;
  deck: { name: string; isNew: boolean; accent?: DeckAccent };
  accent: DeckAccent;
};

export type LLMContext = {
  decks: DeckSummary[];
  categories: string[];
};

export type Deck = {
  id: string;
  name: string;
  accent: DeckAccent;
  createdAt: number;
  updatedAt: number;
};
