import { getDb, resetDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

describe('migrations', () => {
  afterEach(async () => {
    await resetDb();
  });

  it('creates all 3 tables on an empty db', async () => {
    const db = await getDb();
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations'",
    );
    const names = tables.map((t) => t.name).sort();
    expect(names).toEqual(['cards', 'decks', 'notes']);
  });

  it('does not error on repeat calls and does not re-apply', async () => {
    const db = await getDb();
    await runMigrations(db);
    await runMigrations(db);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    expect(tables).toHaveLength(4);
  });

  it('getDb returns same instance on repeat calls', async () => {
    const a = await getDb();
    const b = await getDb();
    expect(a).toBe(b);
  });

  it('resetDb followed by getDb re-creates tables', async () => {
    const db1 = await getDb();
    const tables1 = await db1.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations'",
    );
    expect(tables1).toHaveLength(3);

    await resetDb();
    const db2 = await getDb();
    expect(db2).not.toBe(db1);
    const tables2 = await db2.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations'",
    );
    expect(tables2).toHaveLength(3);
  });
});
