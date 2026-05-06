import { getApiKey, setApiKey, clearApiKey } from '@/lib/secureStore';

describe('secureStore', () => {
  beforeEach(async () => {
    await clearApiKey();
  });

  it('set then get returns the value', async () => {
    await setApiKey('sk-test-key-12345');
    const result = await getApiKey();
    expect(result).toBe('sk-test-key-12345');
  });

  it('clear then get returns null', async () => {
    await setApiKey('sk-test-key-12345');
    await clearApiKey();
    const result = await getApiKey();
    expect(result).toBeNull();
  });

  it('get returns null when no key stored', async () => {
    const result = await getApiKey();
    expect(result).toBeNull();
  });
});
