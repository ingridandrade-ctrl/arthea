import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PHASE_NAMES } from "../_components/deliverable-status";

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
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280" }}>
        <p style={{ fontSize: 18, fontFamily: "Fraunces, Georgia, serif" }}>
          Seu projeto ainda está sendo configurado.
        </p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Em breve você terá acesso a todos os entregáveis.
        </p>
      </div>
    );
  }

  const total = project.deliverables.length;
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");
  const inProgress = project.deliverables.filter((d) => d.status === "IN_PROGRESS");
  const progressPct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();
  const firstName = (session.user?.name || "").split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Greeting + project title */}
      <header>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
          }}
        >
          {greeting}, {firstName} ✨
        </p>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 40,
            fontWeight: 400,
            color: "#2A2A2A",
            margin: "8px 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {project.name}
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", margin: 0 }}>
          Fase {project.currentPhase} de 4 · {PHASE_NAMES[project.currentPhase]}
        </p>
      </header>

      {/* Big progress card */}
      <section
        style={{
          background: "white",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 1px 2px rgba(13,74,74,0.04), 0 8px 24px rgba(13,74,74,0.04)",
          border: "0.5px solid rgba(29,112,112,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
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
            <p
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 56,
                fontWeight: 400,
                color: "#2A2A2A",
                margin: "4px 0 0",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {progressPct}<span style={{ fontSize: 28, color: "#A0A0A0" }}>%</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 13, color: "#4A4A4A", margin: 0 }}>
              <strong style={{ color: "var(--accent)", fontSize: 18, fontWeight: 600 }}>
                {approved}
              </strong>
              <span style={{ marginLeft: 4 }}>de {total} aprovados</span>
            </p>
          </div>
        </div>
        <div
          style={{
            height: 8,
            background: "var(--accent-soft)" as any,
            borderRadius: 999,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "var(--accent)",
              borderRadius: 999,
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </section>

      {/* Stats cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Total de entregáveis" value={total} />
        <StatCard label="Aprovados" value={approved} highlight />
        <StatCard label="Em produção" value={inProgress.length} />
      </section>

      {/* Awaiting validation */}
      {waitingReview.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Sparkles size={16} color={"var(--accent)"} strokeWidth={1.8} />
            <h2 style={{ fontSize: 16, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>
              Aguardando sua validação
            </h2>
            <span
              style={{
                background: "var(--accent-soft)" as any,
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 10px",
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
                href={`/portal/entregaveis/${d.id}`}
                className="portal-card-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "0.5px solid var(--accent-border)" as any,
                  borderRadius: 14,
                  padding: "18px 20px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.18s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: "var(--accent)",
                  }}
                />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>
                    {d.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>
                    Fase {d.phase} · {PHASE_NAMES[d.phase]}
                  </p>
                </div>
                <ArrowRight size={16} strokeWidth={1.6} color="var(--accent)" />
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
            borderRadius: 20,
            padding: 36,
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
              marginBottom: 18,
            }}
          >
            Sobre você
          </p>
          <div
            style={{ fontSize: 14.5, lineHeight: 1.8, color: "#4A4A4A" }}
            dangerouslySetInnerHTML={{ __html: project.summary.content }}
          />
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 14,
        padding: 22,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <p
        style={{
          fontSize: 10.5,
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
          color: highlight ? ("var(--accent)") : "#2A2A2A",
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
