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

const isTransientError = (err: unknown): boolean => {
  if (err instanceof DOMException && err.name === "AbortError") return false;
  if (
    err &&
    typeof err === "object" &&
    "response" in err
  ) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 429 || status === 503) return true;
  }
  if (err instanceof TypeError) return true;
  return false;
};

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sendChat = async (
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<ChatResponse> => {
  const payload = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
  const config = { timeout: 90000, signal };

  try {
    const { data } = await api.post<ChatResponse>("/ai/chat", payload, config);
    return data;
  } catch (err: unknown) {
    if (signal?.aborted) throw err;
    if (!isTransientError(err)) throw err;

    await wait(2000);
    const { data } = await api.post<ChatResponse>("/ai/chat", payload, config);
    return data;
  }
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
    const texto = await res.text();
    callbacks.onError(
      res.status === 429
        ? "Se agotó el límite del asistente."
        : `Error del servidor (${res.status}): ${texto}`,
    );
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
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone(textoCompleto);
};
