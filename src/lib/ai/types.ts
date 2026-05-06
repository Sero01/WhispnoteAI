import type { CardDraft, LLMContext } from '@/types';

export type LLMGenerateInput = {
  transcript: string;
  context: LLMContext;
};

export type LLMClient = {
  provider: 'openai' | 'anthropic' | 'openrouter';
  model: string;
  generateCard(input: LLMGenerateInput): Promise<CardDraft>;
};
