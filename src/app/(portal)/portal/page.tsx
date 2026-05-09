import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { PHASE_NAMES } from "../_components/deliverable-status";
import { CircularProgress } from "../_components/circular-progress";
import { PhaseTimeline } from "../_components/phase-timeline";

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const project = await prisma.clientProject.findUnique({
    where: { clientId: userId },
    include: {
      deliverables: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
      summary: true,
    },
  });

  if (!project) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "120px 0",
          color: "#6B7280",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "var(--accent-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Sparkles size={24} strokeWidth={1.6} color="var(--accent)" />
        </div>
        <p
          style={{
            fontSize: 22,
            fontFamily: "Fraunces, Georgia, serif",
            color: "#2A2A2A",
            margin: "0 0 8px",
          }}
        >
          Seu projeto está sendo configurado
        </p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Em breve você terá acesso a todos os entregáveis. ✨
        </p>
      </div>
    );
  }

  const total = project.deliverables.length;
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");
  const inProgress = project.deliverables.filter((d) => d.status === "IN_PROGRESS");

  // Recent comments (last 3) — fetch only on first deliverable to keep it light
  const recentComments = await prisma.deliverableComment.findMany({
    where: { deliverable: { projectId: project.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      deliverable: { select: { id: true, title: true } },
    },
  });

  // Stats per phase
  const perPhase = [1, 2, 3, 4].map((p) => {
    const items = project.deliverables.filter((d) => d.phase === p);
    return {
      total: items.length,
      approved: items.filter((d) => d.status === "APPROVED").length,
    };
  });

  // Next action: prefer waiting_review, else next pending in current phase
  const nextAction =
    waitingReview[0] ||
    project.deliverables.find(
      (d) => d.phase === project.currentPhase && d.status !== "APPROVED"
    ) ||
    project.deliverables.find((d) => d.status !== "APPROVED");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();
  const firstName = (session.user?.name || "").split(" ")[0];

  return (
    <div
      className="portal-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 48 }}
    >
      {/* HERO */}
      <header
        style={{
          position: "relative",
          padding: "8px 0 0",
        }}
      >
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
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: "clamp(36px, 5.5vw, 56px)",
            fontWeight: 400,
            color: "#1A1A1A",
            margin: "16px 0 12px",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {project.name}
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#4A4A4A",
            margin: 0,
            maxWidth: 580,
          }}
        >
          {project.description ||
            `Você está na fase ${project.currentPhase} de 4 — ${PHASE_NAMES[project.currentPhase]}.`}
        </p>
      </header>

      {/* Phase timeline */}
      <section
        style={{
          background: "white",
          borderRadius: 24,
          padding: "32px 36px",
          boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
          border: "0.5px solid rgba(29,112,112,0.08)",
        }}
      >
        <PhaseTimeline current={project.currentPhase} perPhase={perPhase} />
      </section>

      {/* Progress + Next action */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 32,
          alignItems: "stretch",
        }}
        className="portal-progress-grid"
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "36px 40px",
            boxShadow: "0 1px 2px rgba(13,74,74,0.04), 0 16px 40px rgba(13,74,74,0.04)",
            border: "0.5px solid rgba(29,112,112,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: 0,
            }}
          >
            Progresso geral
          </p>
          <CircularProgress value={approved} total={total} size={200} stroke={14} />
        </div>

        {/* Next action */}
        {nextAction ? (
          <Link
            href={`/portal/entregaveis/${nextAction.id}`}
            className="portal-card-hover"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 75%, black) 100%)",
              color: "white",
              borderRadius: 24,
              padding: "36px 40px",
              textDecoration: "none",
              border: "none",
              boxShadow: "0 24px 48px -16px var(--accent-soft)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* decorative ring */}
            <div
              style={{
                position: "absolute",
                top: -100,
                right: -100,
                width: 280,
                height: 280,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 200,
                height: 200,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.08)",
                pointerEvents: "none",
              }}
            />
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={13} strokeWidth={1.8} />
              {waitingReview.length > 0 ? "Aguardando você" : "Próximo passo"}
            </p>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <h2
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  fontWeight: 400,
                  margin: 0,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {nextAction.title}
              </h2>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.78)", margin: 0 }}>
                Fase {nextAction.phase} · {PHASE_NAMES[nextAction.phase]}
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "white",
                marginTop: 4,
              }}
            >
              {waitingReview.length > 0 ? "Revisar agora" : "Abrir"}
              <ArrowRight size={14} strokeWidth={2.4} />
            </span>
          </Link>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: "36px 40px",
              border: "0.5px solid rgba(29,112,112,0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 22, fontFamily: "Fraunces, Georgia, serif", margin: 0 }}>
              Tudo aprovado por aqui ✨
            </p>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              Nenhum entregável aguardando sua atenção no momento.
            </p>
          </div>
        )}
      </section>

      {/* Stats inline */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        <Stat label="Total" value={total} />
        <Stat label="Aprovados" value={approved} accent />
        <Stat label="Em produção" value={inProgress.length} />
      </section>

      {/* Recent comments timeline */}
      {recentComments.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: "0 0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MessageSquare size={12} strokeWidth={2} />
            Conversa recente
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentComments.map((c) => (
              <Link
                key={c.id}
                href={`/portal/entregaveis/${c.deliverable.id}`}
                className="portal-card-hover"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.08)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: c.isFromArthea ? "var(--accent)" : "#EDE9E0",
                    color: c.isFromArthea ? "white" : "#2A2A2A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {c.isFromArthea ? "A" : "V"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                    <strong style={{ color: "#2A2A2A" }}>
                      {c.isFromArthea ? "Arthea" : "Você"}
                    </strong>{" "}
                    em <em>{c.deliverable.title}</em>
                  </p>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "#2A2A2A",
                      margin: "4px 0 0",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sobre você */}
      {project.summary && (
        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: "40px 44px",
            boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
            border: "0.5px solid rgba(29,112,112,0.08)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 22,
            }}
          >
            Sobre você
          </p>
          <div
            className="portal-prose"
            dangerouslySetInnerHTML={{ __html: project.summary.content }}
          />
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 16,
        padding: "20px 22px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#A0A0A0",
          margin: "0 0 10px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 36,
          fontWeight: 400,
          color: accent ? "var(--accent)" : "#2A2A2A",
          margin: 0,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}
