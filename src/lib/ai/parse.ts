import type { CardDraft, CardImportance, DeckAccent } from '@/types';

const VALID_ACCENTS: DeckAccent[] = ['sage', 'lavender', 'peach', 'cream'];

export function parseCardDraft(raw: unknown): CardDraft {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid card draft: expected an object');
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    throw new Error('Invalid card draft: missing or invalid title');
  }
  if (typeof obj.body !== 'string' || obj.body.trim().length === 0) {
    throw new Error('Invalid card draft: missing or invalid body');
  }
  if (typeof obj.summary !== 'string') {
    throw new Error('Invalid card draft: missing or invalid summary');
  }

  let tags: string[] = [];
  if (Array.isArray(obj.tags)) {
    tags = obj.tags.filter((t) => typeof t === 'string').slice(0, 5);
  }

  const category = typeof obj.category === 'string' ? obj.category : '';

  let importance: CardImportance;
  if (typeof obj.importance === 'number' && Number.isInteger(obj.importance)) {
    importance = Math.max(1, Math.min(5, obj.importance)) as CardImportance;
  } else {
    importance = 3 as CardImportance;
  }

  let deckName = '';
  let deckIsNew = false;
  let deckAccent: DeckAccent | undefined;
  if (typeof obj.deck === 'object' && obj.deck !== null) {
    const d = obj.deck as Record<string, unknown>;
    deckName = typeof d.name === 'string' ? d.name : '';
    deckIsNew = d.isNew === true;
    if (typeof d.accent === 'string' && VALID_ACCENTS.includes(d.accent as DeckAccent)) {
      deckAccent = d.accent as DeckAccent;
    }
  }

  let accent: DeckAccent;
  if (typeof obj.accent === 'string' && VALID_ACCENTS.includes(obj.accent as DeckAccent)) {
    accent = obj.accent as DeckAccent;
  } else {
    accent = 'sage';
  }

  return {
    title: obj.title.trim(),
    summary: obj.summary.trim(),
    body: obj.body.trim(),
    tags,
    category,
    importance,
    deck: { name: deckName, isNew: deckIsNew, ...(deckAccent ? { accent: deckAccent } : {}) },
    accent,
  };
}
