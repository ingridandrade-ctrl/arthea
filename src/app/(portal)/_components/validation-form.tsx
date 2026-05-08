"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.15)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
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
        {readOnly ? "Suas respostas" : "Validação"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q) => (
          <div key={q.id}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#2A2A2A",
                marginBottom: 8,
              }}
            >
              {q.question}
              {q.isRequired && <span style={{ color: "#1D7070", marginLeft: 4 }}>*</span>}
            </label>
            {q.type === "textarea" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                disabled={readOnly}
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid rgba(29,112,112,0.2)",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: readOnly ? "#FAF9F6" : "white",
                }}
              />
            )}
            {(q.type === "text" || !["textarea", "radio", "scale", "checkbox"].includes(q.type)) && (
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                disabled={readOnly}
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid rgba(29,112,112,0.2)",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: readOnly ? "#FAF9F6" : "white",
                }}
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
                      onClick={() => !readOnly && setAnswers({ ...answers, [q.id]: String(n) })}
                      disabled={readOnly}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid rgba(29,112,112,0.2)",
                        background: selected ? "#1D7070" : "white",
                        color: selected ? "white" : "#2A2A2A",
                        fontWeight: 500,
                        cursor: readOnly ? "default" : "pointer",
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
        <p style={{ color: "#9A3412", fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      {!readOnly && (
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => submit("revision")}
            disabled={submitting}
            style={{
              background: "white",
              color: "#9A3412",
              border: "1px solid #FED7AA",
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            Solicitar revisão
          </button>
          <button
            type="button"
            onClick={() => submit("approve")}
            disabled={submitting}
            style={{
              background: "#1D7070",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Enviando..." : "Aprovar entregável"}
          </button>
        </div>
      )}
    </div>
  );
}
