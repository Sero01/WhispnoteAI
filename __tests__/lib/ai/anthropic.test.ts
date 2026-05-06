import { anthropicClient } from '@/lib/ai/anthropic';

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

const validAnthropicResponse = {
  content: [
    {
      type: 'tool_use',
      id: 'toolu_test123',
      name: 'emit_card',
      input: mockCardDraft,
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('anthropicClient', () => {
  it('returns a client with provider anthropic and default model', () => {
    const client = anthropicClient('sk-ant-test-key');
    expect(client.provider).toBe('anthropic');
    expect(client.model).toBe('claude-haiku-4-5');
  });

  it('respects modelOverride', () => {
    const client = anthropicClient('sk-ant-test-key', 'claude-sonnet-4-5');
    expect(client.model).toBe('claude-sonnet-4-5');
  });

  it('successful tool_use response returns parsed CardDraft', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => validAnthropicResponse,
    });

    const client = anthropicClient('sk-ant-test-key');
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

  it('sends correct headers, body, and tool_choice', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => validAnthropicResponse,
    });

    const client = anthropicClient('sk-ant-secret-key', 'claude-sonnet-4-5');
    await client.generateCard({
      transcript: 'Hello world',
      context: {
        decks: [{ id: '1', name: 'Work', accent: 'sage' }],
        categories: ['Engineering'],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(opts.method).toBe('POST');
    const headers = opts.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-secret-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(opts.body as string);
    expect(body.model).toBe('claude-sonnet-4-5');
    expect(body.max_tokens).toBe(2048);
    expect(body.system).toContain('Output JSON');
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[0].content).toContain('Hello world');
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'emit_card' });
    expect(body.tools).toHaveLength(1);
    expect(body.tools[0].name).toBe('emit_card');
    expect(body.tools[0].input_schema).toEqual(expect.any(Object));
  });

  it('HTTP 401 throws error with status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const client = anthropicClient('sk-ant-bad-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('Anthropic 401: Unauthorized');
  });

  it('network error retries once and succeeds the second time', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validAnthropicResponse,
      });

    const client = anthropicClient('sk-ant-test-key');
    const result = await client.generateCard({
      transcript: 'test',
      context: { decks: [], categories: [] },
    });

    expect(result.title).toBe('AI Notes');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after retry still fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network failure'));

    const client = anthropicClient('sk-ant-test-key');
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

    const client = anthropicClient('sk-ant-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('Anthropic 502: Bad Gateway');
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

    const client = anthropicClient('sk-ant-test-key');
    await expect(
      client.generateCard({
        transcript: 'test',
        context: { decks: [], categories: [] },
      }),
    ).rejects.toThrow('Anthropic 400: Bad Request');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
