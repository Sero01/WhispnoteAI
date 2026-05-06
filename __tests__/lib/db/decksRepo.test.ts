import { resetDb } from '@/lib/db';
import { decksRepo } from '@/lib/db/decksRepo';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('decksRepo', () => {
  afterEach(async () => {
    await resetDb();
  });

  it('create -> get round-trip returns the same record', async () => {
    const created = await decksRepo.create({ name: 'Work Notes', accent: 'lavender' });
    const fetched = await decksRepo.get(created.id);
    expect(fetched).toEqual(created);
  });

  it('create uses default accent when not provided', async () => {
    const created = await decksRepo.create({ name: 'Default' });
    expect(created.accent).toBe('sage');
  });

  it('list returns decks ordered by updated_at desc', async () => {
    const a = await decksRepo.create({ name: 'First' });
    await delay(5);
    const b = await decksRepo.create({ name: 'Second' });
    await delay(5);
    const c = await decksRepo.create({ name: 'Third' });

    const list = await decksRepo.list();
    expect(list.map((d) => d.id)).toEqual([c.id, b.id, a.id]);
  });

  it('get returns null for non-existent id', async () => {
    const result = await decksRepo.get('nonexistent');
    expect(result).toBeNull();
  });

  it('getByName matches case-insensitively', async () => {
    await decksRepo.create({ name: 'My Deck' });
    const found = await decksRepo.getByName('my deck');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('My Deck');
  });

  it('getByName returns null when no match', async () => {
    const result = await decksRepo.getByName('nothing');
    expect(result).toBeNull();
  });

  it('update mutates fields and bumps updated_at', async () => {
    const created = await decksRepo.create({ name: 'Old Name', accent: 'sage' });
    const originalUpdatedAt = created.updatedAt;

    await delay(5);
    const updated = await decksRepo.update(created.id, {
      name: 'New Name',
      accent: 'peach',
    });

    expect(updated.name).toBe('New Name');
    expect(updated.accent).toBe('peach');
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.id).toBe(created.id);
  });

  it('update partial — only name', async () => {
    const created = await decksRepo.create({ name: 'Original', accent: 'peach' });
    const updated = await decksRepo.update(created.id, { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
    expect(updated.accent).toBe('peach');
  });

  it('update throws on non-existent id', async () => {
    await expect(decksRepo.update('bad-id', { name: 'x' })).rejects.toThrow(
      'Deck not found: bad-id',
    );
  });

  it('delete removes deck; subsequent get returns null', async () => {
    const created = await decksRepo.create({ name: 'To Delete' });
    await decksRepo.delete(created.id);
    const fetched = await decksRepo.get(created.id);
    expect(fetched).toBeNull();
  });

  it('delete is idempotent', async () => {
    await expect(decksRepo.delete('nonexistent')).resolves.toBeUndefined();
  });
});
