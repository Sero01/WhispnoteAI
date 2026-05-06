import { resetDb } from '@/lib/db';
import { cardsRepo } from '@/lib/db/cardsRepo';
import { notesRepo } from '@/lib/db/notesRepo';
import { decksRepo } from '@/lib/db/decksRepo';
import type { CardImportance, DeckAccent } from '@/types';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const defaultImportance: CardImportance = 3;
const defaultAccent: DeckAccent = 'sage';

describe('cardsRepo', () => {
  afterEach(async () => {
    await resetDb();
  });

  async function seedNote(): Promise<string> {
    const note = await notesRepo.create({ audioUri: 'file://test.mp3', durationMs: 1000 });
    return note.id;
  }

  it('create -> get round-trip preserves all fields including tags array', async () => {
    const noteId = await seedNote();
    const created = await cardsRepo.create({
      noteId,
      title: 'My Card',
      summary: 'A summary',
      body: '# Hello',
      tags: ['ai', 'notes'],
      category: 'Idea',
      importance: 4,
      accent: 'lavender',
    });
    const fetched = await cardsRepo.get(created.id);
    expect(fetched).toEqual(created);
    expect(fetched!.tags).toEqual(['ai', 'notes']);
  });

  it('get returns null for non-existent id', async () => {
    const result = await cardsRepo.get('nonexistent');
    expect(result).toBeNull();
  });

  it('list with no filter returns all in updated_at desc order', async () => {
    const noteId = await seedNote();
    const a = await cardsRepo.create({ noteId, title: 'A', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await delay(5);
    const b = await cardsRepo.create({ noteId, title: 'B', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });

    const list = await cardsRepo.list();
    expect(list.map((c) => c.id)).toEqual([b.id, a.id]);
  });

  it('list({ deckId }) filters correctly', async () => {
    const noteId = await seedNote();
    const deck1 = await decksRepo.create({ name: 'Deck One' });
    const deck2 = await decksRepo.create({ name: 'Deck Two' });
    const a = await cardsRepo.create({ noteId, deckId: deck1.id, title: 'A', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await cardsRepo.create({ noteId, deckId: deck2.id, title: 'B', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });

    const list = await cardsRepo.list({ deckId: deck1.id });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(a.id);
  });

  it('list({ category }) filters correctly', async () => {
    const noteId = await seedNote();
    await cardsRepo.create({ noteId, title: 'A', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    const b = await cardsRepo.create({ noteId, title: 'B', summary: '', body: '', tags: [], category: 'Meeting', importance: defaultImportance, accent: defaultAccent });

    const list = await cardsRepo.list({ category: 'Meeting' });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b.id);
  });

  it('list({ bookmarked: true }) filters correctly', async () => {
    const noteId = await seedNote();
    const a = await cardsRepo.create({ noteId, title: 'A', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await cardsRepo.create({ noteId, title: 'B', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await cardsRepo.setBookmarked(a.id, true);

    const list = await cardsRepo.list({ bookmarked: true });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(a.id);
  });

  it('setBookmarked toggles the flag', async () => {
    const noteId = await seedNote();
    const created = await cardsRepo.create({ noteId, title: 'A', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });

    const bookmarked = await cardsRepo.setBookmarked(created.id, true);
    expect(bookmarked.bookmarked).toBe(true);

    const unbookmarked = await cardsRepo.setBookmarked(created.id, false);
    expect(unbookmarked.bookmarked).toBe(false);
  });

  it('update patches multiple fields', async () => {
    const noteId = await seedNote();
    const created = await cardsRepo.create({ noteId, title: 'Old', summary: '', body: '', tags: ['a'], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await delay(5);

    const updated = await cardsRepo.update(created.id, {
      title: 'New Title',
      body: '## Updated',
      tags: ['a', 'b'],
      importance: 5,
    });

    expect(updated.title).toBe('New Title');
    expect(updated.body).toBe('## Updated');
    expect(updated.tags).toEqual(['a', 'b']);
    expect(updated.importance).toBe(5);
    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    expect(updated.id).toBe(created.id);
  });

  it('delete removes card; subsequent get returns null', async () => {
    const noteId = await seedNote();
    const created = await cardsRepo.create({ noteId, title: 'X', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });

    await cardsRepo.delete(created.id);
    const fetched = await cardsRepo.get(created.id);
    expect(fetched).toBeNull();
  });

  it('delete is idempotent', async () => {
    await expect(cardsRepo.delete('nonexistent')).resolves.toBeUndefined();
  });

  it('listCategories returns sorted distinct values', async () => {
    const noteId = await seedNote();
    await cardsRepo.create({ noteId, title: 'A', summary: '', body: '', tags: [], category: 'Meeting', importance: defaultImportance, accent: defaultAccent });
    await cardsRepo.create({ noteId, title: 'B', summary: '', body: '', tags: [], category: 'Idea', importance: defaultImportance, accent: defaultAccent });
    await cardsRepo.create({ noteId, title: 'C', summary: '', body: '', tags: [], category: 'Meeting', importance: defaultImportance, accent: defaultAccent });

    const categories = await cardsRepo.listCategories();
    expect(categories).toEqual(['Idea', 'Meeting']);
  });
});
