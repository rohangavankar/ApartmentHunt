"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
import clsx from "clsx";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Find me a 1BR under $3,000/mo in Brooklyn with good subway access",
  "What's the difference between Williamsburg and Park Slope?",
  "Best neighborhoods for someone who works in Midtown and loves nightlife?",
  "What should I know about renting in NYC as a newcomer?",
  "Compare renting in Jersey City vs Brooklyn",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm ApartHunt AI, your NYC apartment search assistant. Tell me what you're looking for — budget, neighborhood, commute, lifestyle — and I'll help you find your dream apartment.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { reply } = await api.chat.send(newMessages);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Sorry, something went wrong: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800">ApartHunt AI</h1>
          <p className="text-xs text-slate-500">Powered by Claude · NYC apartment expert</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", m.role === "assistant" ? "bg-blue-600" : "bg-slate-200")}>
              {m.role === "assistant"
                ? <Bot size={15} className="text-white" />
                : <User size={15} className="text-slate-600" />}
            </div>
            <div
              className={clsx(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "assistant"
                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                  : "bg-blue-600 text-white rounded-tr-sm"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about apartments, neighborhoods, commutes..."
            className="flex-1 px-2 py-1 text-sm focus:outline-none bg-transparent"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white rounded-xl p-2 hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">
          AI can make mistakes. Verify rent prices and availability directly with landlords.
        </p>
      </div>
    </div>
  );
}
