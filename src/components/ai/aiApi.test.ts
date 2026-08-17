import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../api/api';
import { sendChat } from './aiApi';

vi.mock('../../api/api', () => ({
  api: { post: vi.fn() },
}));

const mockPost = api.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('aiApi', () => {
  it('envía solo role y content al backend, sin displayContent', async () => {
    mockPost.mockResolvedValue({
      data: { reply: 'Respuesta anónima', display: 'Respuesta visible' },
    });

    const res = await sendChat([
      { role: 'user', content: 'Hola' },
      {
        role: 'assistant',
        content: 'Cliente #a14c1d91-4d2a-58b8-9138-1611a2a3390f',
        displayContent: 'Las Tranqueras',
      },
    ]);

    expect(res.reply).toBe('Respuesta anónima');
    expect(res.display).toBe('Respuesta visible');
    expect(mockPost).toHaveBeenCalledWith(
      '/ai/chat',
      {
        messages: [
          { role: 'user', content: 'Hola' },
          {
            role: 'assistant',
            content: 'Cliente #a14c1d91-4d2a-58b8-9138-1611a2a3390f',
          },
        ],
      },
      { timeout: 90000, signal: undefined },
    );
  });

  it('reintenta una vez ante un error 429 y responde', async () => {
    mockPost
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { reply: 'OK tras reintento' } });

    const promise = sendChat([{ role: 'user', content: 'hola' }]);
    await vi.advanceTimersByTimeAsync(2000);
    const res = await promise;

    expect(res.reply).toBe('OK tras reintento');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('reintenta una vez ante un error 503 y responde', async () => {
    mockPost
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({ data: { reply: 'OK' } });

    const promise = sendChat([{ role: 'user', content: 'hola' }]);
    await vi.advanceTimersByTimeAsync(2000);
    const res = await promise;

    expect(res.reply).toBe('OK');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('no reintenta ante un error 400', async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'bad request' } },
    });

    await expect(
      sendChat([{ role: 'user', content: 'hola' }]),
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('no reintenta si el signal fue abortado', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockPost.mockRejectedValueOnce(abortError);

    controller.abort();
    await expect(
      sendChat([{ role: 'user', content: 'hola' }], controller.signal),
    ).rejects.toThrow('aborted');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
