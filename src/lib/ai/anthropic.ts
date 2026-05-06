import type { LLMClient, LLMGenerateInput } from './types';
import { CARD_SCHEMA, buildSystemPrompt, buildUserPrompt } from './prompt';
import { parseCardDraft } from './parse';

export function anthropicClient(apiKey: string, modelOverride?: string): LLMClient {
  const model = modelOverride ?? 'claude-haiku-4-5';

  return {
    provider: 'anthropic',
    model,
    async generateCard(input: LLMGenerateInput) {
      const body = JSON.stringify({
        model,
        max_tokens: 2048,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt(input) }],
        tools: [{
          name: 'emit_card',
          description: 'Emit the structured card.',
          input_schema: CARD_SCHEMA,
        }],
        tool_choice: { type: 'tool', name: 'emit_card' },
      });

      const MAX_ATTEMPTS = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body,
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Anthropic ${response.status}: ${errBody}`);
          }

          const data = await response.json();
          const toolUseBlock = data.content?.find(
            (block: { type: string }) => block.type === 'tool_use',
          );
          if (!toolUseBlock?.input) {
            throw new Error('Anthropic: missing tool_use block in response');
          }

          return parseCardDraft(toolUseBlock.input);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = error;

          const isNetworkError = err instanceof TypeError;
          const isServerError = error.message.startsWith('Anthropic 5');
          const retriable = isNetworkError || isServerError;
          const hasMoreAttempts = attempt < MAX_ATTEMPTS - 1;

          if (retriable && hasMoreAttempts) continue;
          throw error;
        }
      }

      throw lastError ?? new Error('Anthropic: exhausted retries');
    },
  };
}
