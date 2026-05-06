import type { AIProvider } from '@/store/settings';

export function validateApiKey(
  provider: AIProvider,
  key: string,
): { ok: boolean; reason?: string } {
  const trimmed = key.trim();

  switch (provider) {
    case 'openai':
      if (!trimmed.startsWith('sk-')) {
        return { ok: false, reason: 'OpenAI key must start with sk-' };
      }
      if (trimmed.length < 30) {
        return { ok: false, reason: 'OpenAI key must be at least 30 characters' };
      }
      return { ok: true };

    case 'anthropic':
      if (!trimmed.startsWith('sk-ant-')) {
        return { ok: false, reason: 'Anthropic key must start with sk-ant-' };
      }
      if (trimmed.length < 30) {
        return { ok: false, reason: 'Anthropic key must be at least 30 characters' };
      }
      return { ok: true };

    case 'openrouter':
      if (!trimmed.startsWith('sk-or-')) {
        return { ok: false, reason: 'OpenRouter key must start with sk-or-' };
      }
      if (trimmed.length < 20) {
        return { ok: false, reason: 'OpenRouter key must be at least 20 characters' };
      }
      return { ok: true };
  }
}
