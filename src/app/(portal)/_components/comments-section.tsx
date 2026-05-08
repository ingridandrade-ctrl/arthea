"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.15)",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#1D7070",
          marginBottom: 16,
        }}
      >
        Comentários
      </p>

      {comments.length === 0 ? (
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Nenhum comentário ainda. Use este espaço para tirar dúvidas ou sugerir ajustes.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    background: c.isFromArthea ? "#1D7070" : "#EDE9E0",
                    color: c.isFromArthea ? "white" : "#2A2A2A",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {c.isFromArthea ? "Arthea" : c.authorName}
                </span>
                <span style={{ fontSize: 11, color: "#A0A0A0" }}>
                  {new Date(c.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#2A2A2A", margin: 0, whiteSpace: "pre-wrap" }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "0.5px solid rgba(29,112,112,0.1)" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid rgba(29,112,112,0.2)",
            borderRadius: 6,
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={send}
            disabled={sending || !content.trim()}
            style={{
              background: "#1D7070",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: sending || !content.trim() ? "not-allowed" : "pointer",
              opacity: sending || !content.trim() ? 0.6 : 1,
            }}
          >
            {sending ? "Enviando..." : "Enviar comentário"}
          </button>
        </div>
      </div>
    </div>
  );
}
