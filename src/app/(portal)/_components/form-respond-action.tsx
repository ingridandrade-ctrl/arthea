"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Check, Send } from "lucide-react";

export function FormRespondAction({
  deliverableId,
  documentUrl,
  initialStatus,
}: {
  deliverableId: string;
  documentUrl: string | null;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  const isAnswered = status === "APPROVED";

  async function markResponded() {
    if (!confirm("Confirmar que você já respondeu o formulário?")) return;
    setSaving(true);
    const res = await fetch(`/api/portal/deliverables/${deliverableId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", responses: [] }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus("APPROVED");
      router.refresh();
    } else {
      alert("Erro ao marcar como respondido. Tenta de novo.");
    }
  }

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.10)",
        borderRadius: 16,
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      {!isAnswered && documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: "var(--accent-soft)",
            border: "0.5px solid var(--accent-border)",
            borderRadius: 12,
            padding: "18px 22px",
            textDecoration: "none",
            color: "var(--accent-deep)",
            transition: "all 0.15s ease",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--accent)",
                margin: 0,
              }}
            >
              Formulário
            </p>
            <p style={{ fontSize: 15, fontWeight: 500, margin: "4px 0 0" }}>
              Abrir formulário pra responder
            </p>
          </div>
          <ExternalLink size={18} strokeWidth={1.7} />
        </a>
      )}

      {isAnswered ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--accent-deep)",
            background: "var(--accent-soft)",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Check size={16} strokeWidth={2} />
          Você marcou como respondido. Obrigada! ✨
        </div>
      ) : (
        <button
          onClick={markResponded}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            background: "var(--accent)",
            color: "white",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
            alignSelf: "flex-start",
            transition: "all 0.15s ease",
          }}
        >
          <Send size={14} strokeWidth={1.8} />
          {saving ? "Salvando…" : "Já respondi"}
        </button>
      )}
    </section>
  );
}
