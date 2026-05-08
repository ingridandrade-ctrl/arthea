import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const phaseNames = [
  "",
  "Imersão e Posicionamento",
  "Construção e Conteúdo",
  "Rastreamento e Ads",
  "Entrega Final",
];

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
        <p style={{ fontSize: 18 }}>Seu projeto ainda está sendo configurado.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Em breve você terá acesso a todos os entregáveis.
        </p>
      </div>
    );
  }

  const total = project.deliverables.length;
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#6B7280",
            marginBottom: 8,
          }}
        >
          Projeto ativo
        </p>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#2A2A2A",
            marginBottom: 8,
            fontFamily: "Georgia, serif",
          }}
        >
          {project.name}
        </h1>
        <p style={{ fontSize: 14, color: "#4A4A4A" }}>
          Fase {project.currentPhase} de 4 — {phaseNames[project.currentPhase]}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Total de entregáveis", value: total },
          { label: "Aprovados", value: approved },
          { label: "Aguardando sua validação", value: waitingReview.length },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "white",
              border: "0.5px solid rgba(29,112,112,0.15)",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#A0A0A0",
                marginBottom: 8,
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 400,
                color: "#2A2A2A",
                fontFamily: "Georgia, serif",
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#4A4A4A" }}>Progresso geral</span>
          <span style={{ fontSize: 13, color: "#1D7070", fontWeight: 500 }}>
            {total > 0 ? Math.round((approved / total) * 100) : 0}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(29,112,112,0.12)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${total > 0 ? (approved / total) * 100 : 0}%`,
              background: "#1D7070",
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {waitingReview.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: "#2A2A2A", marginBottom: 16 }}>
            Aguardando sua validação
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {waitingReview.map((d) => (
              <Link
                key={d.id}
                href={`/portal/entregaveis/${d.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.2)",
                  borderLeft: "3px solid #1D7070",
                  borderRadius: 8,
                  padding: "16px 20px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>
                    {d.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
                    Fase {d.phase} · Clique para revisar
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    background: "#E8F5F2",
                    color: "#0D4A4A",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 500,
                  }}
                >
                  Revisar
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {project.summary && (
        <div
          style={{
            background: "white",
            border: "0.5px solid rgba(29,112,112,0.12)",
            borderRadius: 12,
            padding: 32,
            marginTop: 40,
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
            Sobre você
          </p>
          <div
            style={{ fontSize: 14, lineHeight: 1.8, color: "#4A4A4A" }}
            dangerouslySetInnerHTML={{ __html: project.summary.content }}
          />
        </div>
      )}
    </div>
  );
}
