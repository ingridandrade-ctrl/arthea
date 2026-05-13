import { Check, Wrench, Clock } from "lucide-react";
import type { DeliverableStatus } from "./deliverable-status";

// Card que aparece pra entregáveis kind=TASK em vez do DocumentViewer.
// Esses itens não têm documento pro cliente revisar — só status do que a
// Arthea está executando internamente (acesso a contas, setup, estudos).
export function TaskStatusCard({
  status,
  documentUrl,
}: {
  status: DeliverableStatus;
  documentUrl?: string | null;
}) {
  const isDone = status === "APPROVED";
  const inProgress = status === "IN_PROGRESS";

  const icon = isDone ? Check : inProgress ? Wrench : Clock;
  const Icon = icon;

  const title = isDone
    ? "Tudo configurado"
    : inProgress
      ? "A Arthea está trabalhando"
      : "Aguardando o início";

  const subtitle = isDone
    ? "Setup finalizado pela Arthea. Você não precisa fazer nada por aqui."
    : inProgress
      ? "Estamos cuidando dessa configuração. Te avisamos assim que estiver pronto."
      : "Esse setup faz parte do trabalho interno da Arthea. Você acompanha o status por aqui.";

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 18,
        padding: "44px 32px",
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: isDone ? "var(--accent-soft)" : "rgba(13,74,74,0.05)",
          color: isDone ? "var(--accent)" : "#8B867B",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <p
        style={{
          fontSize: 17,
          color: "#1A1A1A",
          margin: 0,
          fontWeight: 500,
          fontFamily: "Fraunces, Georgia, serif",
          fontStyle: "italic",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 13.5,
          color: "#6B7280",
          margin: "8px auto 0",
          maxWidth: 460,
          lineHeight: 1.55,
        }}
      >
        {subtitle}
      </p>
      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 22,
            padding: "10px 18px",
            borderRadius: 10,
            border: "0.5px solid var(--accent-border)",
            color: "var(--accent-deep)",
            background: "var(--accent-soft)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Ver referência
        </a>
      )}
    </section>
  );
}
