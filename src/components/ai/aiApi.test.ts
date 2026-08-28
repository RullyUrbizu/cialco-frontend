import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendChat, sendChatStream } from './aiApi';
import { api } from '../../api/api';

vi.mock('../../api/api', () => ({
  api: { post: vi.fn() },
}));

const mockPost = api.post as unknown as ReturnType<typeof vi.fn>;

function crearReadableStream(chunks: Uint8Array[]) {
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(chunks[i++]);
      } else {
        controller.close();
      }
    },
  });
}

function encode(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

function sseEvents(...eventos: Record<string, unknown>[]): Uint8Array {
  const lineas = eventos.map((e) => `data: ${JSON.stringify(e)}\n`);
  return encode(lineas.join(''));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendChat', () => {
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

  it('propaga errores del backend', async () => {
    mockPost.mockRejectedValueOnce(new Error('network'));

    await expect(
      sendChat([{ role: 'user', content: 'hola' }]),
    ).rejects.toThrow('network');
  });
});

describe('sendChatStream', () => {
  const fetchMock = vi.fn() as ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('parsea eventos SSE y llama onChunk + onDone', async () => {
    const stream = crearReadableStream([
      sseEvents({ type: 'text', text: 'Hola ' }),
      sseEvents({ type: 'text', text: 'mundo' }),
      encode('data: [DONE]\n'),
    ]);
    fetchMock.mockResolvedValue({ ok: true, body: stream });

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk, onDone, onError },
    );

    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, 'Hola ');
    expect(onChunk).toHaveBeenNthCalledWith(2, 'mundo');
    expect(onDone).toHaveBeenCalledWith('Hola mundo');
    expect(onError).not.toHaveBeenCalled();
  });

  it('llama onError ante un error HTTP', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const onError = vi.fn();
    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith('No se pudo conectar con el asistente.');
  });

  it('llama onError con mensaje específico ante 429', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });

    const onError = vi.fn();
    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith('Se agotó el límite del asistente.');
  });

  it('llama onError si el body no tiene reader', async () => {
    fetchMock.mockResolvedValue({ ok: true, body: null });

    const onError = vi.fn();
    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith('No se pudo leer la respuesta del servidor.');
  });

  it('llama onError ante un evento de error del SSE', async () => {
    const stream = crearReadableStream([
      sseEvents({ type: 'error', message: 'Gemini se cayó' }),
    ]);
    fetchMock.mockResolvedValue({ ok: true, body: stream });

    const onError = vi.fn();
    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith('Gemini se cayó');
  });

  it('flushea el buffer trailing cuando el stream termina sin [DONE]', async () => {
    const stream = crearReadableStream([
      sseEvents({ type: 'text', text: 'parcial' }),
    ]);
    fetchMock.mockResolvedValue({ ok: true, body: stream });

    const onChunk = vi.fn();
    const onDone = vi.fn();

    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk, onDone, onError: vi.fn() },
    );

    expect(onChunk).toHaveBeenCalledWith('parcial');
    expect(onDone).toHaveBeenCalledWith('parcial');
  });

  it('ignora lineas vacías y sin prefijo data:', async () => {
    const stream = crearReadableStream([
      encode('\n\n:keep-alive\n\ndata: {"type":"text","text":"ok"}\n'),
    ]);
    fetchMock.mockResolvedValue({ ok: true, body: stream });

    const onChunk = vi.fn();
    const onDone = vi.fn();

    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk, onDone, onError: vi.fn() },
    );

    expect(onChunk).toHaveBeenCalledWith('ok');
  });

  it('envía el signal de abort al fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({ ok: true, body: null });

    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError: vi.fn() },
      controller.signal,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/ai/chat/stream'),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('construye la URL correctamente', async () => {
    fetchMock.mockResolvedValue({ ok: true, body: null });

    await sendChatStream(
      [{ role: 'user', content: 'hola' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError: vi.fn() },
    );

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/ai\/chat\/stream$/);
  });

  it('envía payload sin displayContent', async () => {
    fetchMock.mockResolvedValue({ ok: true, body: null });

    await sendChatStream(
      [{ role: 'assistant', content: 'id-anonimo', displayContent: 'nombre real' }],
      { onChunk: vi.fn(), onDone: vi.fn(), onError: vi.fn() },
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: { role: string; content: string }[];
    };
    expect(body.messages[0]).toEqual({ role: 'assistant', content: 'id-anonimo' });
    expect(body.messages[0]).not.toHaveProperty('displayContent');
  });
});
