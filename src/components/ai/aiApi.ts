import { api } from "../../api/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
}

export interface ChatResponse {
  reply: string;
  display?: string;
}

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000`;
};

export const sendChat = async (
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<ChatResponse> => {
  const payload = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
  const { data } = await api.post<ChatResponse>("/ai/chat", payload, {
    timeout: 90000,
    signal,
  });
  return data;
};

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (message: string) => void;
}

export const sendChatStream = async (
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const payload = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };

  const res = await fetch(`${getBaseUrl()}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    if (res.status === 429) {
      callbacks.onError("Se agotó el límite del asistente.");
    } else {
      callbacks.onError("No se pudo conectar con el asistente.");
    }
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No se pudo leer la respuesta del servidor.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let textoCompleto = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lineas = buffer.split("\n");
      buffer = lineas.pop() ?? "";

      for (const linea of lineas) {
        if (!linea.startsWith("data: ")) continue;
        const jsonStr = linea.slice(6).trim();
        if (jsonStr === "[DONE]") {
          callbacks.onDone(textoCompleto);
          return;
        }
        if (!jsonStr) continue;

        try {
          const evento = JSON.parse(jsonStr) as {
            type: string;
            text?: string;
            name?: string;
            message?: string;
          };
          if (evento.type === "text" && evento.text) {
            textoCompleto += evento.text;
            callbacks.onChunk(evento.text);
          } else if (evento.type === "error") {
            callbacks.onError(
              evento.message || "Error desconocido del asistente.",
            );
            return;
          }
        } catch {
          // chunk incompleto
        }
      }
    }

    if (buffer.startsWith("data: ")) {
      const jsonStr = buffer.slice(6).trim();
      if (jsonStr === "[DONE]") {
        callbacks.onDone(textoCompleto);
        return;
      }
      if (jsonStr) {
        try {
          const evento = JSON.parse(jsonStr) as {
            type: string;
            text?: string;
            message?: string;
          };
          if (evento.type === "text" && evento.text) {
            textoCompleto += evento.text;
            callbacks.onChunk(evento.text);
          } else if (evento.type === "error") {
            callbacks.onError(
              evento.message || "Error desconocido del asistente.",
            );
            return;
          }
        } catch {
          // chunk incompleto final
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone(textoCompleto);
};
