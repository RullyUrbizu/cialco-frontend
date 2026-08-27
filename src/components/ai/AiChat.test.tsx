import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiChat } from './AiChat';
import { sendChatStream } from './aiApi';
import type { ChatMessage } from './aiApi';

vi.mock('./aiApi', () => ({
  sendChatStream: vi.fn(),
}));

const mockSendChatStream = sendChatStream as unknown as ReturnType<typeof vi.fn>;

function simularRespuesta(texto: string) {
  mockSendChatStream.mockImplementationOnce(
    async (
      _msgs: ChatMessage[],
      callbacks: { onChunk: (t: string) => void; onDone: (t: string) => void; onError: (m: string) => void },
    ) => {
      callbacks.onChunk(texto);
      callbacks.onDone(texto);
    },
  );
}

function simularError(mensaje: string) {
  mockSendChatStream.mockImplementationOnce(
    async (
      _msgs: ChatMessage[],
      callbacks: { onChunk: (t: string) => void; onDone: (t: string) => void; onError: (m: string) => void },
    ) => {
      callbacks.onError(mensaje);
    },
  );
}

describe('AiChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el panel con el mensaje de bienvenida y sugerencias', () => {
    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    expect(screen.getByText(/Soy el asistente de Stock Cialco/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Cómo agrego un toro nuevo\?/i)).toBeInTheDocument();
  });

  it('envía una consulta y muestra la respuesta del asistente', async () => {
    simularRespuesta('Hay 120 pajuelas del toro Don Julio.');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿Qué stock queda del toro Don Julio?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(await screen.findByText('Hay 120 pajuelas del toro Don Julio.')).toBeInTheDocument();
    expect(mockSendChatStream).toHaveBeenCalledTimes(1);
  });

  it('muestra un error si la consulta falla', async () => {
    simularError('Error de conexión');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(
      await screen.findByText('Error de conexión'),
    ).toBeInTheDocument();
  });

  it('envía una sugerencia al tocarla', async () => {
    simularRespuesta('Respuesta de la sugerencia.');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.click(screen.getByText(/Resumime las salidas de este mes/i));

    expect(await screen.findByText('Respuesta de la sugerencia.')).toBeInTheDocument();
  });

  it('renderiza el markdown de la respuesta del asistente', async () => {
    const texto = 'Stock de **Vino Blanco**:\n\n* **Machazo**: 3.313 dosis\n* **Catrillan**: 437 dosis';
    simularRespuesta(texto);

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿Cuántas dosis hay?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    const machazo = await screen.findByText('Machazo');
    expect(machazo.tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('envía con Enter y no con Shift+Enter', async () => {
    simularRespuesta('Respuesta Enter.');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    const input = screen.getByLabelText('Escribí tu consulta');
    fireEvent.change(input, { target: { value: 'hola' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(mockSendChatStream).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Respuesta Enter.')).toBeInTheDocument();
    expect(mockSendChatStream).toHaveBeenCalledTimes(1);
  });

  it('mantiene deshabilitado el botón de enviar con el input vacío', () => {
    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    const boton = screen.getByLabelText('Enviar consulta');
    expect(boton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'hola' },
    });
    expect(screen.getByLabelText('Enviar consulta')).toBeEnabled();
  });

  it('oculta el botón flotante cuando el chat está abierto', () => {
    render(<AiChat />);
    expect(screen.getByLabelText('Abrir asistente')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    expect(screen.queryByLabelText('Abrir asistente')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar asistente')).toBeInTheDocument();
  });

  it('oculta las sugerencias tras el primer mensaje', async () => {
    simularRespuesta('Listo.');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    expect(
      screen.getByText(/Resumime las salidas de este mes/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿qué hay?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(await screen.findByText('Listo.')).toBeInTheDocument();
    expect(
      screen.queryByText(/Resumime las salidas de este mes/i),
    ).not.toBeInTheDocument();
  });

  it('no duplica el mensaje de bienvenida al reabrir el chat', () => {
    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    fireEvent.click(screen.getByLabelText('Cerrar asistente'));
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    expect(
      screen.getAllByText(/Soy el asistente de Stock Cialco/i),
    ).toHaveLength(1);
  });

  it('no envía mensajes vacíos o solo espacios con Enter', async () => {
    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    const input = screen.getByLabelText('Escribí tu consulta');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendChatStream).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendChatStream).not.toHaveBeenCalled();
  });

  it('permite cerrar el banner de error con el botón X', async () => {
    simularError('Error de conexión');

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(
      await screen.findByText('Error de conexión'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Cerrar error'));
    expect(
      screen.queryByText('Error de conexión'),
    ).not.toBeInTheDocument();
  });

  it('aborta la request al cerrar el chat', async () => {
    let signalCaptured: AbortSignal | undefined;
    mockSendChatStream.mockImplementation(
      async (
        _msgs: ChatMessage[],
        _cb: unknown,
        signal?: AbortSignal,
      ) => {
        signalCaptured = signal;
        await new Promise(() => {});
      },
    );

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));
    expect(mockSendChatStream).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Cerrar asistente'));

    await new Promise((r) => setTimeout(r, 50));
    expect(signalCaptured?.aborted).toBe(true);
  });
});
