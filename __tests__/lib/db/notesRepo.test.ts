import { resetDb } from '@/lib/db';
import { notesRepo } from '@/lib/db/notesRepo';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('notesRepo', () => {
  afterEach(async () => {
    await resetDb();
  });

  it('create -> get round-trip returns the same record', async () => {
    const created = await notesRepo.create({ audioUri: 'file://test.mp3', durationMs: 5000 });
    const fetched = await notesRepo.get(created.id);
    expect(fetched).toEqual(created);
  });

  it('create with transcript', async () => {
    const created = await notesRepo.create({
      audioUri: 'file://test.mp3',
      durationMs: 3000,
      transcript: 'hello world',
    });
    expect(created.transcript).toBe('hello world');
  });

  it('create defaults transcript to null', async () => {
    const created = await notesRepo.create({ audioUri: 'file://test.mp3', durationMs: 1000 });
    expect(created.transcript).toBeNull();
  });

  it('setTranscript updates field', async () => {
    const created = await notesRepo.create({ audioUri: 'file://test.mp3', durationMs: 2000 });
    const updated = await notesRepo.setTranscript(created.id, 'new transcript');
    expect(updated.transcript).toBe('new transcript');
    expect(updated.audioUri).toBe(created.audioUri);
  });

  it('setTranscript throws on non-existent id', async () => {
    await expect(notesRepo.setTranscript('bad-id', 'x')).rejects.toThrow('Note not found: bad-id');
  });

  it('list returns notes ordered by created_at desc', async () => {
    const a = await notesRepo.create({ audioUri: 'file://a.mp3', durationMs: 1000 });
    await delay(5);
    const b = await notesRepo.create({ audioUri: 'file://b.mp3', durationMs: 2000 });
    await delay(5);
    const c = await notesRepo.create({ audioUri: 'file://c.mp3', durationMs: 3000 });

    const list = await notesRepo.list();
    expect(list.map((n) => n.id)).toEqual([c.id, b.id, a.id]);
  });

  it('get returns null for non-existent id', async () => {
    const result = await notesRepo.get('nonexistent');
    expect(result).toBeNull();
  });

  it('delete removes note; subsequent get returns null', async () => {
    const created = await notesRepo.create({ audioUri: 'file://to-delete.mp3', durationMs: 1500 });
    await notesRepo.delete(created.id);
    const fetched = await notesRepo.get(created.id);
    expect(fetched).toBeNull();
  });

  it('delete is idempotent', async () => {
    await expect(notesRepo.delete('nonexistent')).resolves.toBeUndefined();
  });
});
