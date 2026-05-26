import Link from "next/link";
import { ArrowRight, MapPin, MessageSquare, Star, Sparkles, ExternalLink } from "lucide-react";
import type { ClientEngagement, ClientDeliverable } from "@prisma/client";
import { greetingPtBr } from "@/lib/time";

type Project = ClientEngagement & { deliverables: ClientDeliverable[] };

export function GmbDashboard({
  project,
  userName,
}: {
  project: Project;
  userName: string;
}) {
  const firstName = (userName || "").split(" ")[0];

  const setup = project.deliverables.filter((d) => d.category === "PROFILE_SETUP");
  const posts = project.deliverables.filter((d) => d.category === "POST");
  const reviews = project.deliverables.filter((d) => d.category === "REVIEW_RESPONSE");
  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");

  const setupDone =
    setup.length > 0 && setup.every((d) => d.status === "APPROVED");
  const postsApproved = posts.filter((d) => d.status === "APPROVED").length;
  const reviewsHandled = reviews.filter((d) => d.status === "APPROVED").length;

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
          {project.description || "Acompanhamento da presença local no Google Meu Negócio."}
        </p>
      </header>

      {/* Status ficha */}
      <section
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.10)",
          borderRadius: 18,
          padding: "26px 28px",
          display: "flex",
          alignItems: "center",
          gap: 22,
          flexWrap: "wrap",
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MapPin size={24} strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
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
            Ficha do Google Meu Negócio
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#1A1A1A",
              margin: "4px 0 0",
              fontFamily: "Fraunces, Georgia, serif",
              fontStyle: "italic",
            }}
          >
            {setupDone ? "Configurada e ativa" : "Em configuração"}
          </p>
        </div>
        <Link
          href={`/portal/${project.slug}/acessos`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            background: "white",
            border: "0.5px solid rgba(29,112,112,0.18)",
            color: "var(--accent-deep)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Ver acessos
          <ExternalLink size={13} strokeWidth={1.7} />
        </Link>
      </section>

      {/* Métricas */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <MetricCard
          icon={MapPin}
          label="Setup"
          value={setupDone ? "100%" : `${setup.filter((d) => d.status === "APPROVED").length}/${setup.length || 1}`}
          tag={setupDone ? "Concluído" : "Em andamento"}
          accent={setupDone}
        />
        <MetricCard
          icon={MessageSquare}
          label="Posts publicados"
          value={String(postsApproved)}
          tag={`de ${posts.length} planejados`}
        />
        <MetricCard
          icon={Star}
          label="Reviews respondidas"
          value={String(reviewsHandled)}
          tag={`de ${reviews.length} no total`}
        />
      </section>

      {/* Aguardando você */}
      {waitingReview.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
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
                    {d.category === "POST"
                      ? "Post"
                      : d.category === "REVIEW_RESPONSE"
                        ? "Resposta a review"
                        : d.category === "PROFILE_SETUP"
                          ? "Configuração"
                          : d.category}
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

function MetricCard({
  icon: Icon,
  label,
  value,
  tag,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  tag?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.10)",
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: accent ? "var(--accent-soft)" : "rgba(13,74,74,0.05)",
            color: accent ? "var(--accent)" : "#8B867B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={15} strokeWidth={1.7} />
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: accent ? "var(--accent-deep)" : "#1A1A1A",
            margin: 0,
            lineHeight: 1.1,
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          }}
        >
          {value}
        </p>
        {tag && (
          <p style={{ fontSize: 11.5, color: "#8B867B", margin: "4px 0 0" }}>{tag}</p>
        )}
      </div>
    </div>
  );
}
