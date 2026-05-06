import { validateApiKey } from '@/lib/validateApiKey';

describe('validateApiKey', () => {
  describe('openai', () => {
    it('accepts a well-formed key', () => {
      const result = validateApiKey('openai', 'sk-' + 'a'.repeat(27));
      expect(result.ok).toBe(true);
    });

    it('rejects a key that is too short', () => {
      const result = validateApiKey('openai', 'sk-' + 'a'.repeat(10));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/at least 30/i);
    });

    it('rejects a key with wrong prefix', () => {
      const result = validateApiKey('openai', 'ak-' + 'a'.repeat(27));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/must start with sk-/i);
    });

    it('trims whitespace', () => {
      const result = validateApiKey('openai', '  sk-' + 'a'.repeat(27) + '  ');
      expect(result.ok).toBe(true);
    });
  });

  describe('anthropic', () => {
    it('accepts a well-formed key', () => {
      const result = validateApiKey('anthropic', 'sk-ant-' + 'a'.repeat(24));
      expect(result.ok).toBe(true);
    });

    it('rejects a key that is too short', () => {
      const result = validateApiKey('anthropic', 'sk-ant-' + 'a'.repeat(5));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/at least 30/i);
    });

    it('rejects a key with wrong prefix', () => {
      const result = validateApiKey('anthropic', 'sk-' + 'a'.repeat(27));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/must start with sk-ant-/i);
    });

    it('trims whitespace', () => {
      const result = validateApiKey('anthropic', '  sk-ant-' + 'a'.repeat(24) + '  ');
      expect(result.ok).toBe(true);
    });
  });

  describe('openrouter', () => {
    it('accepts a well-formed key', () => {
      const result = validateApiKey('openrouter', 'sk-or-' + 'a'.repeat(17));
      expect(result.ok).toBe(true);
    });

    it('rejects a key that is too short', () => {
      const result = validateApiKey('openrouter', 'sk-or-' + 'a'.repeat(5));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/at least 20/i);
    });

    it('rejects a key with wrong prefix', () => {
      const result = validateApiKey('openrouter', 'sk-' + 'a'.repeat(17));
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/must start with sk-or-/i);
    });

    it('trims whitespace', () => {
      const result = validateApiKey('openrouter', '  sk-or-' + 'a'.repeat(17) + '  ');
      expect(result.ok).toBe(true);
    });
  });
});
