import type { LLMClient } from './types';
import { useSettings } from '@/store/settings';
import { getApiKey } from '@/lib/secureStore';
import { openaiClient } from './openai';
import { anthropicClient } from './anthropic';
import { openrouterClient } from './openrouter';

export async function getActiveLLMClient(): Promise<LLMClient | null> {
  const { provider, modelOverride } = useSettings.getState();
  const apiKey = await getApiKey();

  if (!provider || !apiKey) {
    return null;
  }

  switch (provider) {
    case 'openai':
      return openaiClient(apiKey, modelOverride ?? undefined);
    case 'anthropic':
      return anthropicClient(apiKey, modelOverride ?? undefined);
    case 'openrouter':
      return openrouterClient(apiKey, modelOverride ?? undefined);
    default:
      return null;
  }
}
