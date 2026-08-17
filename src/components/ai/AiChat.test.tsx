import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiChat } from './AiChat';
import { sendChat } from './aiApi';
import type { ChatMessage } from './aiApi';

vi.mock('./aiApi', () => ({
  sendChat: vi.fn(),
}));

const mockSendChat = sendChat as unknown as ReturnType<typeof vi.fn>;

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
    mockSendChat.mockResolvedValueOnce({
      reply: 'Hay 120 pajuelas del toro Don Julio.',
    });

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿Qué stock queda del toro Don Julio?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(await screen.findByText('Hay 120 pajuelas del toro Don Julio.')).toBeInTheDocument();
    expect(mockSendChat).toHaveBeenCalledTimes(1);
  });

  it('muestra un error si la consulta falla', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('network'));

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(
      await screen.findByText(/No se pudo conectar con el asistente/i),
    ).toBeInTheDocument();
  });

  it('envía una sugerencia al tocarla', async () => {
    mockSendChat.mockResolvedValueOnce({ reply: 'Respuesta de la sugerencia.' });

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.click(screen.getByText(/Resumime las salidas de este mes/i));

    expect(await screen.findByText('Respuesta de la sugerencia.')).toBeInTheDocument();
  });

  it('renderiza el markdown de la respuesta del asistente', async () => {
    mockSendChat.mockResolvedValueOnce({
      reply:
        'Stock de **Vino Blanco**:\n\n* **Machazo**: 3.313 dosis\n* **Catrillan**: 437 dosis',
    });

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

  it('muestra el display real pero guarda la respuesta cruda anónima en el historial', async () => {
    mockSendChat
      .mockResolvedValueOnce({
        reply:
          'El cliente Cliente #a14c1d91-4d2a-58b8-9138-1611a2a3390f tiene 23 colectas.',
        display: 'El cliente Las Tranqueras tiene 23 colectas.',
      })
      .mockResolvedValueOnce({ reply: 'Segunda respuesta.' });

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿Qué clientes hay?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(
      await screen.findByText('El cliente Las Tranqueras tiene 23 colectas.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: '¿Y ahora?' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(await screen.findByText('Segunda respuesta.')).toBeInTheDocument();

    const segundoHistorial = mockSendChat.mock.calls[1][0] as ChatMessage[];
    const mensajeAsistente = segundoHistorial.find(
      (m) => m.role === 'assistant' && m.content.includes('Cliente #'),
    );
    expect(mensajeAsistente).toBeDefined();
    expect(mensajeAsistente?.content).toContain('Cliente #a14c1d91');
  });

  it('envía con Enter y no con Shift+Enter', async () => {
    mockSendChat.mockResolvedValueOnce({ reply: 'Respuesta Enter.' });

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    const input = screen.getByLabelText('Escribí tu consulta');
    fireEvent.change(input, { target: { value: 'hola' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(mockSendChat).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Respuesta Enter.')).toBeInTheDocument();
    expect(mockSendChat).toHaveBeenCalledTimes(1);
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
    mockSendChat.mockResolvedValueOnce({ reply: 'Listo.' });

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
    expect(mockSendChat).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendChat).not.toHaveBeenCalled();
  });

  it('permite cerrar el banner de error con el botón X', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('network'));

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));

    expect(
      await screen.findByText(/No se pudo conectar con el asistente/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Cerrar error'));
    expect(
      screen.queryByText(/No se pudo conectar con el asistente/i),
    ).not.toBeInTheDocument();
  });

  it('aborta la request al cerrar el chat', async () => {
    let resolveRequest!: (v: unknown) => void;
    mockSendChat.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(<AiChat />);
    fireEvent.click(screen.getByLabelText('Abrir asistente'));

    fireEvent.change(screen.getByLabelText('Escribí tu consulta'), {
      target: { value: 'Hola' },
    });
    fireEvent.click(screen.getByLabelText('Enviar consulta'));
    expect(mockSendChat).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Cerrar asistente'));
    resolveRequest({ reply: 'Tardado.' });
  });
});
