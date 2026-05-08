import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPE_ICON: Record<string, string> = {
  pinterest: "📌",
  drive: "📁",
  pdf: "📄",
  miro: "🗂️",
  link: "🔗",
};

export default async function ReferenciasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const project = await prisma.clientProject.findUnique({
    where: { clientId: userId },
    include: { references: { orderBy: { order: "asc" } } },
  });

  if (!project) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280" }}>
        Projeto não disponível.
      </div>
    );
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
        Referências
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
        Materiais de inspiração, documentos e links úteis para o projeto.
      </p>

      {project.references.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
          Nenhuma referência cadastrada ainda.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {project.references.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                background: "white",
                border: "0.5px solid rgba(29,112,112,0.15)",
                borderRadius: 12,
                padding: 20,
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {TYPE_ICON[r.type] || "🔗"}
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>
                {r.title}
              </p>
              {r.description && (
                <p style={{ fontSize: 12, color: "#6B7280", margin: "6px 0 0" }}>
                  {r.description}
                </p>
              )}
              <p
                style={{
                  fontSize: 11,
                  color: "#1D7070",
                  margin: "8px 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                Abrir ↗
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
