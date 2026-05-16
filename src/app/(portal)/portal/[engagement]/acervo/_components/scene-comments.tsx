"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  isFromArthea: boolean;
  createdAt: string;
  authorName: string;
};

export function SceneComments({
  sceneId,
  comments,
  themeColor,
}: {
  sceneId: string;
  comments: Comment[];
  themeColor: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function post() {
    const t = text.trim();
    if (!t) return;
    setPosting(true);
    const res = await fetch(`/api/portal/scenes/${sceneId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: t }),
    });
    setPosting(false);
    if (res.ok) {
      setText("");
      router.refresh();
    } else {
      alert("Erro ao enviar comentário");
    }
  }

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 16,
        padding: "26px 28px",
      }}
    >
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#8B867B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: "0 0 16px",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <MessageCircle size={12} strokeWidth={2} />
        Comentários · {comments.length}
      </p>

      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                background: "rgba(250,249,246,0.6)",
                borderRadius: 12,
                border: "0.5px solid rgba(13,74,74,0.05)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: c.isFromArthea ? themeColor : "#EDE9E0",
                  color: c.isFromArthea ? "white" : "#2A2A2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {c.authorName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  <strong style={{ color: "#2A2A2A", fontWeight: 600 }}>
                    {c.isFromArthea ? "Arthea" : c.authorName}
                  </strong>
                  {" · "}
                  {new Date(c.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "#2A2A2A",
                    margin: "4px 0 0",
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                  }}
                >
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário sobre essa cena…"
          rows={2}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "0.5px solid rgba(13,74,74,0.18)",
            borderRadius: 10,
            background: "white",
            fontSize: 14,
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            color: "#1A1A1A",
            outline: "none",
            resize: "vertical",
            minHeight: 60,
          }}
        />
        <button
          onClick={post}
          disabled={posting || !text.trim()}
          style={{
            padding: "0 18px",
            borderRadius: 10,
            background: themeColor,
            color: "white",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: posting || !text.trim() ? "not-allowed" : "pointer",
            opacity: posting || !text.trim() ? 0.5 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            height: 60,
          }}
        >
          <Send size={14} strokeWidth={1.8} />
          {posting ? "…" : "Enviar"}
        </button>
      </div>
    </section>
  );
}
