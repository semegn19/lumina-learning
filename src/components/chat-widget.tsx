import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sendBotMessage } from "@/lib/bot-api";

type ChatMessage = { id: number; role: "bot" | "user"; text: string };

const suggestions = [
  "How do I enroll in a course?",      
  "Where are my certificates?",
  "How do I apply for a job?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "bot",
      text: "Hi there 👋 I'm Lumi, your learning assistant. Ask me anything about courses, events or your account.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, open]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || typing) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: value }]);
    setInput("");
    setTyping(true);

    try {
      const botReply = await sendBotMessage(value);
      setMessages((m) => [...m, { id: Date.now() + 1, role: "bot", text: botReply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "I'm having a little trouble connecting to my knowledge base right now. Please ask again in a moment.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-40 right-5 z-50 flex h-[520px] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)] md:bottom-24">
          <header className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
            <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/15">
              <Bot className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold leading-tight">Lumi Assistant</p>
              <p className="text-xs opacity-80">Usually replies instantly</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 transition-colors hover:bg-primary-foreground/15"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-card text-foreground shadow-[var(--shadow-card)]"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}

            {typing ? (
              <div className="flex justify-start">
                <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                  <span className="sr-only">Lumi is typing</span>
                </span>
              </div>
            ) : null}

            {messages.length === 1 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              aria-label="Message"
              className="h-11 min-w-0 flex-1 rounded-full border border-border bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || typing}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-24 right-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105 md:bottom-6"
      >
        {open ? <MessageCircle className="size-6" aria-hidden /> : <Bot className="size-6" aria-hidden />}
      </button>
    </>
  );
}
