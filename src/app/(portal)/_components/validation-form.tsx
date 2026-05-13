"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
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
    ticks: 200,
  });
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.6, x: 0.7 },
      colors: [accent, "#9bf0e0"],
      scalar: 0.8,
    });
  }, 180);
}

type Question = {
  id: string;
  question: string;
  type: string;
  options: string[];
  isRequired: boolean;
  previousAnswer: string;
};

export function ValidationForm({
  deliverableId,
  questions,
  readOnly,
  initialStatus,
}: {
  deliverableId: string;
  questions: Question[];
  readOnly: boolean;
  initialStatus: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((q) => [q.id, q.previousAnswer]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function submit(action: "approve" | "revision") {
    setError("");
    setSubmitting(true);
    try {
      const missing = questions.find((q) => q.isRequired && !answers[q.id]?.trim());
      if (missing) {
        setError(`Por favor responda: "${missing.question}"`);
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/portal/deliverables/${deliverableId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
          action,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao enviar.");
      } else {
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
          marginBottom: 18,
        }}
      >
        {readOnly ? "Suas respostas" : "Validação"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {questions.map((q) => (
          <div key={q.id}>
            <label
              style={{
                display: "block",
                fontSize: 13.5,
                fontWeight: 500,
                color: "#2A2A2A",
                marginBottom: 8,
              }}
            >
              {q.question}
              {q.isRequired && <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>}
            </label>
            {q.type === "textarea" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                disabled={readOnly}
                rows={3}
                style={inputStyle(readOnly)}
              />
            )}
            {(q.type === "text" ||
              !["textarea", "radio", "scale", "checkbox"].includes(q.type)) && (
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                disabled={readOnly}
                style={inputStyle(readOnly)}
              />
            )}
            {q.type === "radio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      color: "#2A2A2A",
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      disabled={readOnly}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "scale" && (
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = answers[q.id] === String(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        !readOnly && setAnswers({ ...answers, [q.id]: String(n) })
                      }
                      disabled={readOnly}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: "1px solid rgba(29,112,112,0.2)",
                        background: selected ? "var(--accent)" : "white",
                        color: selected ? "white" : "#2A2A2A",
                        fontWeight: 500,
                        cursor: readOnly ? "default" : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: "#9A3412", fontSize: 13, marginTop: 16 }}>{error}</p>
      )}

      {!readOnly && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => submit("revision")}
            disabled={submitting}
            style={secondaryBtn(submitting)}
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            Solicitar revisão
          </button>
          <button
            type="button"
            onClick={() => submit("approve")}
            disabled={submitting}
            style={primaryBtn(submitting)}
          >
            <Check size={14} strokeWidth={2} />
            {submitting ? "Enviando..." : "Aprovar entregável"}
          </button>
        </div>
      )}

      {toast && <div className="portal-toast">{toast}</div>}
    </section>
  );
}

function inputStyle(readOnly: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid rgba(29,112,112,0.2)",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "inherit",
    background: readOnly ? "#FAF9F6" : "white",
    color: "#2A2A2A",
    outline: "none",
  };
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
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
    cursor: disabled ? "wait" : "pointer",
    fontFamily: "inherit",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease",
  };
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
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
    cursor: disabled ? "wait" : "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  };
}
