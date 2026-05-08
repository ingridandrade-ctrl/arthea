import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  PHASE_NAMES,
  STATUS_BG,
  STATUS_FG,
  STATUS_LABEL,
  type DeliverableStatus,
} from "../../_components/deliverable-status";

export default async function DeliverablesList() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const project = await prisma.clientProject.findUnique({
    where: { clientId: userId },
    include: {
      deliverables: {
        where: { isVisible: true },
        orderBy: [{ phase: "asc" }, { order: "asc" }],
      },
    },
  });

  if (!project) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280" }}>
        <p>Projeto não disponível.</p>
      </div>
    );
  }

  const byPhase: Record<number, typeof project.deliverables> = {};
  for (const d of project.deliverables) {
    if (!byPhase[d.phase]) byPhase[d.phase] = [];
    byPhase[d.phase].push(d);
  }

  return (
    <div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: "#2A2A2A",
          marginBottom: 8,
          fontFamily: "Georgia, serif",
        }}
      >
        Entregáveis
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 40 }}>
        Acompanhe cada etapa do seu projeto. Clique em um item para revisar e validar.
      </p>

      {[1, 2, 3, 4].map((phase) => {
        const items = byPhase[phase] || [];
        if (items.length === 0) return null;
        return (
          <div key={phase} style={{ marginBottom: 40 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#1D7070",
                marginBottom: 12,
              }}
            >
              Fase {phase} — {PHASE_NAMES[phase]}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((d) => {
                const status = d.status as DeliverableStatus;
                return (
                  <Link
                    key={d.id}
                    href={`/portal/entregaveis/${d.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "white",
                      border: "0.5px solid rgba(29,112,112,0.15)",
                      borderRadius: 10,
                      padding: "16px 20px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{d.title}</p>
                      {d.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            margin: "4px 0 0",
                          }}
                        >
                          {d.description}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        background: STATUS_BG[status],
                        color: STATUS_FG[status],
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {project.deliverables.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
          Nenhum entregável visível no momento.
        </div>
      )}
    </div>
  );
}
