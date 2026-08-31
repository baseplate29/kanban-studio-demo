"use client";

import { Bot, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

function BotAvatar() {
  return (
    <Avatar className="size-7">
      <AvatarFallback className="bg-brand-blue/15 text-brand-blue">
        <Bot className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}

export function ChatSidebar({
  onBoardChanged,
  className,
}: {
  onBoardChanged: () => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data?.reply ?? "Sorry, something went wrong.",
        },
      ]);
      if (data?.applied) onBoardChanged();
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      aria-label="AI chat"
      className={cn(
        "flex w-80 min-h-0 shrink-0 flex-col border-l border-border",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <BotAvatar />
        <div className="leading-tight">
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Can edit the board</p>
        </div>
      </div>
      <div
        ref={messagesRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
      >
        {messages.length === 0 && !loading && (
          <div className="my-auto flex flex-col items-center gap-2 text-center text-gray-text">
            <MessageSquare className="size-8" />
            <p className="text-sm">Ask me to create, edit, or move cards.</p>
          </div>
        )}
        {messages.map((message, i) =>
          message.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              {message.content}
            </div>
          ) : (
            <div key={i} className="flex max-w-[85%] items-start gap-2 self-start">
              <BotAvatar />
              <div className="rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm">
                {message.content}
              </div>
            </div>
          ),
        )}
        {loading && (
          <div className="flex items-center gap-2 self-start">
            <BotAvatar />
            <p className="animate-pulse text-sm text-gray-text">Thinking...</p>
          </div>
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Input
          aria-label="Chat message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the AI"
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </aside>
  );
}
