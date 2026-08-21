import { useEffect, useRef, useState, useCallback } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Sparkles, Send, X, MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { sendChatStream } from "./aiApi";
import { Markdown } from "./Markdown";
import type { ChatMessage } from "./aiApi";

const SUGERENCIAS = [
  "¿Qué stock queda de cada toro?",
  "¿Qué termo tiene más capacidad libre?",
  "¿Cómo agrego un toro nuevo?",
  "Resumime las salidas de este mes",
];

const MENSAJE_INICIAL: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de Stock Cialco. Consultame sobre tu stock, toros, termos, clientes o movimientos, y también te guío para usar la aplicación.",
};

export const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([MENSAJE_INICIAL]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  // Abort when chat closes
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [isOpen]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const enviarTexto = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio || isLoading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const nuevoMensaje: ChatMessage = { role: "user", content: limpio };
      const historial = [...messages, nuevoMensaje];
      setMessages(historial);
      setInput("");
      setIsLoading(true);
      setError(null);

      let textoAcumulado = "";

      try {
        await sendChatStream(
          historial,
          {
            onChunk: (chunk) => {
              textoAcumulado += chunk;
              setMessages((prev) => {
                const actualizados = [...prev];
                const ultimo = actualizados[actualizados.length - 1];
                if (ultimo?.role === "assistant") {
                  actualizados[actualizados.length - 1] = {
                    ...ultimo,
                    content: textoAcumulado,
                    displayContent: textoAcumulado,
                  };
                } else {
                  actualizados.push({
                    role: "assistant",
                    content: textoAcumulado,
                    displayContent: textoAcumulado,
                  });
                }
                return actualizados;
              });
            },
            onDone: (fullText) => {
              setMessages((prev) => {
                const actualizados = [...prev];
                const ultimo = actualizados[actualizados.length - 1];
                if (ultimo?.role === "assistant") {
                  actualizados[actualizados.length - 1] = {
                    ...ultimo,
                    content: fullText,
                    displayContent: fullText,
                  };
                }
                return actualizados;
              });
            },
            onError: (mensaje) => {
              setError(mensaje);
            },
          },
          controller.signal,
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const detalle =
          err &&
          typeof err === "object" &&
          "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : undefined;
        setError(
          detalle ||
            "No se pudo conectar con el asistente. Revisá que el backend esté disponible.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [messages, isLoading],
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      enviarTexto(input);
    },
    [enviarTexto, input],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const dismissError = useCallback(() => setError(null), []);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 pointer-events-none lg:inset-x-auto lg:bottom-6 lg:right-6 lg:px-0 lg:pr-6 lg:justify-end">
        <div className="pointer-events-auto flex h-[min(600px,calc(100vh-7rem))] w-[380px] max-w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-lift animate-scale-in">
          {/* Header */}
          <div className="relative grain flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-[#16281F] via-[#1B382A] to-[#1F4A36] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/20 border border-brass/40 shadow-brass">
                <Sparkles className="h-4 w-4 text-brass-light" />
              </div>
              <div>
                <h2 className="font-serif text-base font-semibold text-ivory leading-tight">
                  Asistente Cialco
                </h2>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brass-light/80">
                  Stock &amp; Guía
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
              className="rounded-lg p-1.5 text-ivory/60 transition hover:bg-white/10 hover:text-ivory focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-paper p-4"
            aria-live="polite"
          >
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-pine px-3.5 py-2.5 text-sm text-ivory shadow-soft"
                >
                  {m.content}
                </div>
              ) : (
                <div
                  key={i}
                  className="mr-auto max-w-[85%] rounded-2xl rounded-tl-md border border-hairline bg-ivory-100 px-3.5 py-2.5 text-sm text-ink"
                >
                  <Markdown>{m.displayContent ?? m.content}</Markdown>
                </div>
              ),
            )}

            {isLoading && (
              <div className="mr-auto inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-hairline bg-ivory-100 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass [animation-delay:240ms]" />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-terracotta/25 bg-terracotta-light px-3.5 py-2.5 text-xs text-terracotta">
                <span className="flex-1">{error}</span>
                <button
                  onClick={dismissError}
                  aria-label="Cerrar error"
                  className="mt-0.5 shrink-0 rounded p-0.5 transition hover:bg-terracotta/10 focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {messages.length <= 1 && !isLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                  Sugerencias
                </p>
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviarTexto(s)}
                    className="block w-full rounded-xl border border-sand/70 bg-ivory-50 px-3 py-2 text-left text-xs text-ink-soft transition hover:border-brass/60 hover:text-pine focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-hairline bg-paper p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Preguntá sobre stock o cómo usar la app…"
                aria-label="Escribí tu consulta"
                className="field max-h-32 min-h-[42px] flex-1 resize-none py-2.5"
              />
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!input.trim() || isLoading}
                className="h-[42px] px-3.5"
                aria-label="Enviar consulta"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-faint">
              Respuestas generadas por IA sobre tus datos de stock.
            </p>
          </form>
        </div>
        </div>
      )}

      {/* Botón flotante: solo se muestra con el chat cerrado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir asistente"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pine text-ivory shadow-lift transition-all duration-200 hover:scale-105 hover:bg-pine-700 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
    </>
  );
};
