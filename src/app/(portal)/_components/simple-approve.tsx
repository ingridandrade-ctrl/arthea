"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

function fireConfetti() {
  const accent =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1D7070"
      : "#1D7070";
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.7 },
    colors: [accent, "#9bf0e0", "#FAF9F6"],
    scalar: 0.9,
  });
}

export function SimpleApprove({
  deliverableId,
  currentStatus,
}: {
  deliverableId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (currentStatus === "APPROVED") {
    return (
      <section
        style={{
          background: "var(--accent-soft)" as any,
          border: "0.5px solid var(--accent-border)" as any,
          borderRadius: 18,
          padding: 22,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--accent)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={20} strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#0D4A4A", margin: 0 }}>
            Você aprovou este entregável
          </p>
          <p style={{ fontSize: 13, color: "#4A4A4A", margin: "2px 0 0" }}>
            Se precisar de ajustes, deixe um comentário abaixo.
          </p>
        </div>
      </section>
    );
  }

  async function submit(action: "approve" | "revision") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portal/deliverables/${deliverableId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: [], action }),
      });
      if (res.ok) {
        setToast(action === "approve" ? "Entregável aprovado!" : "Revisão solicitada.");
        if (action === "approve") fireConfetti();
        setTimeout(() => {
          setToast(null);
          router.refresh();
        }, 1500);
      }
    } finally {
      setSubmitting(false);
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
          marginBottom: 12,
        }}
      >
        Validação
      </p>
      <p style={{ fontSize: 14.5, color: "#2A2A2A", lineHeight: 1.6, marginBottom: 20 }}>
        Revise o documento acima e nos avise se está aprovado ou se precisa de ajustes.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => submit("revision")}
          disabled={submitting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "white",
            color: "#9A3412",
            border: "1px solid #FED7AA",
            padding: "11px 18px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: submitting ? "wait" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
          }}
        >
          <RotateCcw size={14} strokeWidth={1.8} />
          Solicitar revisão
        </button>
        <button
          type="button"
          onClick={() => submit("approve")}
          disabled={submitting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent)",
            color: "white",
            border: "none",
            padding: "11px 20px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: submitting ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: submitting ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <Check size={14} strokeWidth={2} />
          {submitting ? "Enviando..." : "Aprovar entregável"}
        </button>
      </div>
      {toast && <div className="portal-toast">{toast}</div>}
    </section>
  );
}
