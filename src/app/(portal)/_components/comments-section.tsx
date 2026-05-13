"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  isFromArthea: boolean;
  createdAt: string;
  authorName: string;
};

export function CommentsSection({
  deliverableId,
  comments,
}: {
  deliverableId: string;
  comments: Comment[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/portal/deliverables/${deliverableId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent("");
        setToast("Comentário enviado");
        setTimeout(() => {
          setToast(null);
          router.refresh();
        }, 900);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 18,
        padding: 28,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 18,
        }}
      >
        Comentários
      </p>

      {comments.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#6B7280", margin: 0 }}>
          Nenhum comentário ainda. Use este espaço para tirar dúvidas ou sugerir ajustes.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: c.isFromArthea ? 14 : 0,
                background: c.isFromArthea ? "var(--accent-soft)" : "transparent",
                borderRadius: c.isFromArthea ? 12 : 0,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: c.isFromArthea ? "var(--accent)" : "#EDE9E0",
                  color: c.isFromArthea ? "white" : "#2A2A2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {c.isFromArthea ? "A" : (c.authorName || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#2A2A2A" }}>
                    {c.isFromArthea ? "Arthea" : c.authorName}
                  </span>
                  <span style={{ fontSize: 11, color: "#A0A0A0" }}>
                    {new Date(c.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: "#2A2A2A", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 22,
          paddingTop: 22,
          borderTop: "0.5px solid rgba(29,112,112,0.1)",
        }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
          style={{
            width: "100%",
            padding: "12px 14px",
            border: "1px solid rgba(29,112,112,0.2)",
            borderRadius: 10,
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            color: "#2A2A2A",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={send}
            disabled={sending || !content.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--accent)",
              color: "white",
              border: "none",
              padding: "9px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: sending || !content.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: sending || !content.trim() ? 0.5 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <Send size={14} strokeWidth={1.8} />
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>

      {toast && <div className="portal-toast">{toast}</div>}
    </section>
  );
}
