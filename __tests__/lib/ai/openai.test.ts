import { openaiClient } from '@/lib/ai/openai';

const mockCardDraft = {
  title: 'AI Notes',
  summary: 'A summary of AI notes',
  body: '# AI Notes\n\nThis is a test note.',
  tags: ['ai', 'machine-learning', 'test'],
  category: 'Engineering',
  importance: 3,
  deck: { name: 'Work', isNew: false, accent: 'sage' },
  accent: 'lavender',
};

const validOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify(mockCardDraft),
      },
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('openaiClient', () => {
  it('returns a client with provider openai and default model', () => {
    const client = openaiClient('sk-test-key');
    expect(client.provider).toBe('openai');
    expect(client.model).toBe('gpt-4o-mini');
  });

  it('respects modelOverride', () => {
    const client = openaiClient('sk-test-key', 'gpt-4o');
    expect(client.model).toBe('gpt-4o');
  });

  it('successful response returns parsed CardDraft', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => validOpenAIResponse,
    });

    const client = openaiClient('sk-test-key');
    const result = await client.generateCard({
      transcript: 'test transcript',
      context: { decks: [], categories: [] },
    });

    expect(result.title).toBe('AI Notes');
    expect(result.summary).toBe('A summary of AI notes');
    expect(result.body).toContain('AI Notes');
    expect(result.tags).toEqual(['ai', 'machine-learning', 'test']);
    expect(result.importance).toBe(3);
  });

  it('sends correct headers, model, and prompts in the request body', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => validOpenAIResponse,
    });

    const client = openaiClient('sk-secret-key', 'gpt-4o');
    await client.generateCard({
      transcript: 'Hello world',
      context: {
        decks: [{ id: '1', name: 'Work', accent: 'sage' }],
        categories: ['Engineering'],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer sk-secret-key');
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    const body = JSON.parse(opts.body as string);
    expect(body.model).toBe('gpt-4o');
    expect(body.temperature).toBe(0.4);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('Output JSON');
    expect(body.messages[1].role).toBe('user');
    expect(body.messages[1].content).toContain('Hello world');
    expect(body.messages[1].content).toContain('Work (sage)');
    expect(body.messages[1].content).toContain('Engineering');
    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: {
        name: 'card_draft',
        strict: true,
        schema: expect.any(Object),
      },
    });
  });

  it('HTTP 429 throws an error with status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    });

    const client = openaiClient('sk-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('OpenAI 429: Rate limited');
  });

  it('network error retries once and succeeds the second time', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validOpenAIResponse,
      });

    const client = openaiClient('sk-test-key');
    const result = await client.generateCard({
      transcript: 'test',
      context: { decks: [], categories: [] },
    });

    expect(result.title).toBe('AI Notes');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after retry still fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network failure'));

    const client = openaiClient('sk-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('Network failure');
  });

  it('retries on 5xx and throws after both attempts fail', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'Bad Gateway',
      });

    const client = openaiClient('sk-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('OpenAI 502: Bad Gateway');
  });

  it('retries on network error then propagates non-retriable 400 on second attempt', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

    const client = openaiClient('sk-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('OpenAI 400: Bad Request');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
