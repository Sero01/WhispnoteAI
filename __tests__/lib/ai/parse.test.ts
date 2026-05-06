import { parseCardDraft } from '@/lib/ai/parse';

const validInput: Record<string, unknown> = {
  title: 'AI Notes',
  summary: 'A summary of AI notes',
  body: '# AI Notes\n\nThis is a test note.',
  tags: ['ai', 'machine-learning', 'test'],
  category: 'Engineering',
  importance: 3,
  deck: { name: 'Work', isNew: false, accent: 'sage' },
  accent: 'lavender',
};

describe('parseCardDraft', () => {
  it('accepts a well-formed JSON object and returns a normalized CardDraft', () => {
    const result = parseCardDraft(validInput);
    expect(result.title).toBe('AI Notes');
    expect(result.summary).toBe('A summary of AI notes');
    expect(result.body).toContain('AI Notes');
    expect(result.tags).toEqual(['ai', 'machine-learning', 'test']);
    expect(result.category).toBe('Engineering');
    expect(result.importance).toBe(3);
    expect(result.deck).toEqual({ name: 'Work', isNew: false, accent: 'sage' });
    expect(result.accent).toBe('lavender');
  });

  it('clamps importance to 1-5 range', () => {
    const high = parseCardDraft({ ...validInput, importance: 10 });
    expect(high.importance).toBe(5);

    const low = parseCardDraft({ ...validInput, importance: -5 });
    expect(low.importance).toBe(1);
  });

  it('truncates tags to 5', () => {
    const result = parseCardDraft({
      ...validInput,
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    });
    expect(result.tags).toHaveLength(5);
    expect(result.tags).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('filters out non-string tags', () => {
    const result = parseCardDraft({
      ...validInput,
      tags: ['good', 42, null, 'also good'],
    });
    expect(result.tags).toEqual(['good', 'also good']);
  });

  it('defaults missing accent to sage', () => {
    const noAccent = parseCardDraft({ ...validInput, accent: undefined });
    expect(noAccent.accent).toBe('sage');

    const invalidAccent = parseCardDraft({ ...validInput, accent: 'purple' });
    expect(invalidAccent.accent).toBe('sage');
  });

  it('throws on missing title', () => {
    expect(() => parseCardDraft({ ...validInput, title: '' })).toThrow('Invalid card draft');
    expect(() => parseCardDraft({ ...validInput, title: undefined })).toThrow('Invalid card draft');
  });

  it('throws on missing body', () => {
    expect(() => parseCardDraft({ ...validInput, body: '' })).toThrow('Invalid card draft');
    expect(() => parseCardDraft({ ...validInput, body: undefined })).toThrow('Invalid card draft');
  });

  it('throws on non-object input', () => {
    expect(() => parseCardDraft(null)).toThrow('Invalid card draft');
    expect(() => parseCardDraft('string')).toThrow('Invalid card draft');
    expect(() => parseCardDraft(42)).toThrow('Invalid card draft');
  });

  it('defaults importance to 3 when missing or non-integer', () => {
    const noImportance = parseCardDraft({ ...validInput, importance: undefined });
    expect(noImportance.importance).toBe(3);

    const stringImportance = parseCardDraft({ ...validInput, importance: '5' });
    expect(stringImportance.importance).toBe(3);
  });
});
