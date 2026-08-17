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
