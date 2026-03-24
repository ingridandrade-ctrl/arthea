"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Send, Bot, User, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    const res = await fetch(`/api/messages?conversationId=${params.id}`);
    const data = await res.json();
    setMessages(data);
  }

  async function fetchConversation() {
    // Get conversation details through leads API
    const res = await fetch("/api/leads?service=all");
    const leads = await res.json();
    for (const lead of leads) {
      const conv = lead.conversations?.find((c: any) => c.id === params.id);
      if (conv) {
        setConversation({ ...conv, lead });
        break;
      }
    }
  }

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: params.id,
        content: newMessage,
      }),
    });

    setNewMessage("");
    setSending(false);
    fetchMessages();
  }

  async function toggleAi() {
    if (!conversation) return;
    // Toggle AI through a simple endpoint
    const newState = !conversation.isAiActive;
    await fetch(`/api/leads/${conversation.lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setConversation({ ...conversation, isAiActive: newState });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/conversations" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {conversation && (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {conversation.lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{conversation.lead.name}</p>
                <p className="text-xs text-muted-foreground">{conversation.lead.phone}</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={toggleAi}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition"
        >
          {conversation?.isAiActive ? (
            <>
              <ToggleRight className="w-5 h-5 text-blue-600" />
              <span className="text-blue-600">IA Ativa</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              <span>IA Desativada</span>
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "LEAD" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                msg.sender === "LEAD"
                  ? "bg-muted"
                  : msg.sender === "AI"
                  ? "bg-blue-100 text-blue-900"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {msg.sender === "AI" && <Bot className="w-3 h-3" />}
                {msg.sender === "AGENT" && <User className="w-3 h-3" />}
                <span className="text-[10px] opacity-70">
                  {msg.sender === "LEAD"
                    ? "Lead"
                    : msg.sender === "AI"
                    ? "IA"
                    : msg.sentByUser?.name || "Agente"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] opacity-50 mt-1 text-right">
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-border mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
