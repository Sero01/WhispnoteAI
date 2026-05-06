import type { LLMContext } from '@/types';

export const MAX_TRANSCRIPT_CHARS = 8000;

export const CARD_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 60 },
    summary: { type: 'string' },
    body: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
    category: { type: 'string' },
    importance: { type: 'integer', minimum: 1, maximum: 5 },
    deck: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        isNew: { type: 'boolean' },
        accent: { type: 'string', enum: ['sage', 'lavender', 'peach', 'cream'] },
      },
      required: ['name', 'isNew'],
    },
    accent: { type: 'string', enum: ['sage', 'lavender', 'peach', 'cream'] },
  },
  required: ['title', 'summary', 'body', 'tags', 'category', 'importance', 'deck', 'accent'],
};

export function buildSystemPrompt(): string {
  return [
    'You organize voice notes into structured cards.',
    'Output JSON matching the provided schema. No prose.',
    'title: ≤60 chars, evocative.',
    'summary: 1-2 sentence hook for a library card.',
    'body: markdown, well-organized notes from the transcript.',
    'tags: 1-5 short kebab-case-ish tags.',
    "category: pick a single short category (e.g. 'Engineering', 'Journal', 'Idea', 'Meeting', 'Reading'). If a similar one exists in the existing categories list, REUSE its exact spelling.",
    'importance: 1 (trivia) to 5 (mission-critical), based on length, specificity, and self-stated urgency.',
    'deck: pick from existing decks if a good fit exists; else propose a new short noun-phrase deck name with isNew=true and pick an accent (sage|lavender|peach|cream).',
    'accent: card accent color, choose any of (sage|lavender|peach|cream); aim to differ from the deck color when possible.',
  ].join('\n');
}

export function buildUserPrompt(input: {
  transcript: string;
  context: LLMContext;
}): string {
  const { transcript, context } = input;
  const truncated = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
  const deckList = context.decks.map((d) => `${d.name} (${d.accent})`).join(', ');
  const catList = context.categories.join(', ');
  return `<transcript>\n${truncated}\n</transcript>\n\nExisting decks: ${deckList || 'none'}\nExisting categories: ${catList || 'none'}`;
}
