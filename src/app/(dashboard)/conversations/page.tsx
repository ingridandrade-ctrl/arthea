"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhone, formatDate } from "@/lib/utils";
import { MessageCircle, Bot, User } from "lucide-react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages?listConversations=true")
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversas WhatsApp</h1>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">As conversas aparecerão aqui quando leads enviarem mensagens pelo WhatsApp</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/30 transition"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {conv.lead?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{conv.lead?.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {conv.lastMessageAt
                      ? formatDate(conv.lastMessageAt)
                      : formatDate(conv.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatPhone(conv.lead?.phone || "")}
                  </span>
                  {conv.isAiActive ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Bot className="w-3 h-3" /> IA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <User className="w-3 h-3" /> Humano
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
