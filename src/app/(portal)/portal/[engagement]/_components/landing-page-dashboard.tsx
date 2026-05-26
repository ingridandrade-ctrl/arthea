import Link from "next/link";
import { ArrowRight, Sparkles, Globe, Frame, ExternalLink, Check } from "lucide-react";
import type { ClientEngagement, ClientDeliverable } from "@prisma/client";
import { greetingPtBr } from "@/lib/time";

type Project = ClientEngagement & { deliverables: ClientDeliverable[] };

const STAGES = [
  { key: "BRIEFING", label: "Briefing" },
  { key: "WIREFRAME", label: "Wireframe" },
  { key: "DESIGN", label: "Design" },
  { key: "DEVELOPMENT", label: "Desenvolvimento" },
  { key: "LAUNCH", label: "Publicação" },
] as const;

export function LandingPageDashboard({
  project,
  userName,
}: {
  project: Project;
  userName: string;
}) {
  const firstName = (userName || "").split(" ")[0];

  // Por fase: cada categoria do entregável mapeia 1:1 num stage
  const byStage = STAGES.map((s) => {
    const items = project.deliverables.filter((d) => d.category === s.key);
    const approved = items.filter((d) => d.status === "APPROVED").length;
    const inFlight = items.some(
      (d) => d.status === "IN_PROGRESS" || d.status === "WAITING_REVIEW",
    );
    return {
      ...s,
      total: items.length,
      approved,
      done: items.length > 0 && approved === items.length,
      inFlight,
    };
  });

  const currentStageIdx = (() => {
    const idx = byStage.findIndex((s) => !s.done);
    return idx === -1 ? byStage.length - 1 : idx;
  })();

  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");

  // Links externos: olhamos no ClientAccess platform contendo "staging"/"figma"
  // (UX simples por enquanto; uma onda futura pode mover pra LandingPageEngagement)

  const greeting = greetingPtBr();

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <header style={{ padding: "8px 0 0" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          {greeting}, {firstName}
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(36px, 5.5vw, 52px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "16px 0 12px",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {project.name.split(" ").map((word, i, arr) => {
            const isLast = i === arr.length - 1 && arr.length > 1;
            return isLast ? (
              <em
                key={i}
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "var(--accent)",
                }}
              >
                {word}
              </em>
            ) : (
              <span key={i}>
                {word}
                {i < arr.length - 1 ? " " : ""}
              </span>
            );
          })}
        </h1>
        <p style={{ fontSize: 15, color: "#4A4A4A", margin: 0, maxWidth: 580 }}>
          {project.description ||
            `Acompanhamento da landing page · ${STAGES[currentStageIdx].label}.`}
        </p>
      </header>

      {/* Timeline das fases */}
      <section
        style={{
          background: "white",
          borderRadius: 20,
          padding: "32px 36px",
          border: "0.5px solid rgba(29,112,112,0.08)",
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 8 }}>
          {byStage.map((s, i) => {
            const isCurrent = i === currentStageIdx;
            const isDone = s.done;
            const colorBar = isDone ? "var(--accent)" : isCurrent ? "var(--accent)" : "rgba(13,74,74,0.10)";
            return (
              <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: colorBar,
                    opacity: isDone || isCurrent ? 1 : 0.6,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isDone ? (
                    <Check size={13} strokeWidth={2.4} color="var(--accent)" />
                  ) : (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: isCurrent ? "var(--accent)" : "rgba(13,74,74,0.20)",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isCurrent || isDone ? 600 : 500,
                      color: isCurrent || isDone ? "#1A1A1A" : "#8B867B",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "#8B867B",
                    fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                  }}
                >
                  {s.approved}/{s.total || 0} aprovados
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Aguardando você */}
      {waitingReview.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} strokeWidth={2} color="var(--accent)" />
            <h2
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
                margin: 0,
              }}
            >
              Aguardando você
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "white",
                background: "var(--accent)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {waitingReview.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {waitingReview.map((d) => (
              <Link
                key={d.id}
                href={`/portal/${project.slug}/entregaveis/${d.id}`}
                className="portal-card-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  background: "white",
                  border: "0.5px solid var(--accent-border)",
                  borderLeft: "3px solid var(--accent)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#A0A0A0",
                      margin: 0,
                    }}
                  >
                    {STAGES.find((s) => s.key === d.category)?.label || d.category}
                  </p>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#2A2A2A", margin: "4px 0 0" }}>
                    {d.title}
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--accent)",
                    background: "var(--accent-soft)",
                    padding: "6px 12px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Revisar
                  <ArrowRight size={13} strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Atalhos: staging e figma — vivem em ClientAccess */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        <ShortcutCard
          icon={Globe}
          label="Preview"
          title="Staging da página"
          subtitle="A versão mais recente em desenvolvimento"
          href={`/portal/${project.slug}/acessos`}
        />
        <ShortcutCard
          icon={Frame}
          label="Design"
          title="Layout no Figma"
          subtitle="Wireframes e telas aprovadas"
          href={`/portal/${project.slug}/acessos`}
        />
      </section>

      {/* Atalho pra entregáveis */}
      <Link
        href={`/portal/${project.slug}/entregaveis`}
        className="portal-card-hover"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.10)",
          borderRadius: 14,
          padding: "16px 22px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: 0,
            }}
          >
            Todos os entregáveis
          </p>
          <p style={{ fontSize: 14.5, fontWeight: 500, color: "#1A1A1A", margin: "4px 0 0" }}>
            {project.deliverables.length} no total ·{" "}
            {project.deliverables.filter((d) => d.status === "APPROVED").length} aprovados
          </p>
        </div>
        <ArrowRight size={16} strokeWidth={1.8} color="var(--accent)" />
      </Link>
    </div>
  );
}

function ShortcutCard({
  icon: Icon,
  label,
  title,
  subtitle,
  href,
}: {
  icon: any;
  label: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="portal-card-hover"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.10)",
        borderRadius: 16,
        padding: "22px 24px",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={17} strokeWidth={1.7} />
        </div>
        <ExternalLink size={13} strokeWidth={1.6} color="#A0A0A0" />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#A0A0A0",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A", margin: "4px 0 0" }}>
          {title}
        </p>
        <p style={{ fontSize: 12.5, color: "#8B867B", margin: "4px 0 0" }}>{subtitle}</p>
      </div>
    </Link>
  );
}
