import type { LLMClient, LLMGenerateInput } from './types';
import { CARD_SCHEMA, buildSystemPrompt, buildUserPrompt } from './prompt';
import { parseCardDraft } from './parse';

export function openaiClient(apiKey: string, modelOverride?: string): LLMClient {
  const model = modelOverride ?? 'gpt-4o-mini';

  return {
    provider: 'openai',
    model,
    async generateCard(input: LLMGenerateInput) {
      const body = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'card_draft',
            strict: true,
            schema: CARD_SCHEMA,
          },
        },
        temperature: 0.4,
      });

      const MAX_ATTEMPTS = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenAI ${response.status}: ${errBody}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error('OpenAI: empty response content');
          }

          return parseCardDraft(JSON.parse(content));
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;

          const isNetworkError = err instanceof TypeError;
          const isServerError = error.message.startsWith('OpenAI 5');
          const retriable = isNetworkError || isServerError;
          const hasMoreAttempts = attempt < MAX_ATTEMPTS - 1;

          if (retriable && hasMoreAttempts) continue;
          throw error;
        }
      }

      throw lastError ?? new Error('OpenAI: exhausted retries');
    },
  };
}
