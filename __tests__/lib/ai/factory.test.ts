import { getActiveLLMClient } from '@/lib/ai/factory';
import { useSettings } from '@/store/settings';
import { getApiKey } from '@/lib/secureStore';

jest.mock('@/lib/secureStore');

beforeEach(() => {
  useSettings.setState({ provider: null, modelOverride: null, onboarded: false });
  (getApiKey as jest.Mock).mockResolvedValue(null);
});

describe('getActiveLLMClient', () => {
  it('returns null when provider is unset', async () => {
    useSettings.setState({ provider: null });
    (getApiKey as jest.Mock).mockResolvedValue('sk-test-key');

    const client = await getActiveLLMClient();
    expect(client).toBeNull();
  });

  it('returns null when API key is missing', async () => {
    useSettings.setState({ provider: 'openai' });
    (getApiKey as jest.Mock).mockResolvedValue(null);

    const client = await getActiveLLMClient();
    expect(client).toBeNull();
  });

  it('returns an openai client when provider is openai and key exists', async () => {
    useSettings.setState({ provider: 'openai' });
    (getApiKey as jest.Mock).mockResolvedValue('sk-test-key');

    const client = await getActiveLLMClient();
    expect(client).not.toBeNull();
    expect(client!.provider).toBe('openai');
  });

  it('returns an anthropic client when provider is anthropic and key exists', async () => {
    useSettings.setState({ provider: 'anthropic' });
    (getApiKey as jest.Mock).mockResolvedValue('sk-ant-test-key');

    const client = await getActiveLLMClient();
    expect(client).not.toBeNull();
    expect(client!.provider).toBe('anthropic');
    expect(client!.model).toBe('claude-haiku-4-5');
  });

  it('passes modelOverride to anthropic client', async () => {
    useSettings.setState({ provider: 'anthropic', modelOverride: 'claude-sonnet-4-5' });
    (getApiKey as jest.Mock).mockResolvedValue('sk-ant-test-key');

    const client = await getActiveLLMClient();
    expect(client!.model).toBe('claude-sonnet-4-5');
  });

  it('returns an openrouter client when provider is openrouter and key exists', async () => {
    useSettings.setState({ provider: 'openrouter' });
    (getApiKey as jest.Mock).mockResolvedValue('sk-or-test-key');

    const client = await getActiveLLMClient();
    expect(client).not.toBeNull();
    expect(client!.provider).toBe('openrouter');
    expect(client!.model).toBe('google/gemini-2.5-flash');
  });

  it('passes modelOverride to openrouter client', async () => {
    useSettings.setState({ provider: 'openrouter', modelOverride: 'anthropic/claude-3.5-sonnet' });
    (getApiKey as jest.Mock).mockResolvedValue('sk-or-test-key');

    const client = await getActiveLLMClient();
    expect(client!.model).toBe('anthropic/claude-3.5-sonnet');
  });
});
