import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Pin, FolderOpen, FileText, LayoutGrid, Link2 } from "lucide-react";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  pinterest: { icon: Pin, label: "Pinterest", color: "#E60023" },
  drive: { icon: FolderOpen, label: "Google Drive", color: "#0F9D58" },
  pdf: { icon: FileText, label: "PDF", color: "#DC2626" },
  miro: { icon: LayoutGrid, label: "Miro", color: "#FFD02F" },
  link: { icon: Link2, label: "Link", color: "#1D7070" },
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
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
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
          Referências
        </p>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 36,
            fontWeight: 400,
            color: "#2A2A2A",
            margin: "8px 0 8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Materiais e inspirações
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Documentos, painéis e links úteis para o projeto.
        </p>
      </header>

      {project.references.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#A0A0A0", fontSize: 14 }}>
          Nenhuma referência cadastrada ainda.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {project.references.map((r) => {
            const meta = TYPE_META[r.type] || TYPE_META.link;
            const Icon = meta.icon;
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="portal-card-hover"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.08)",
                  borderRadius: 16,
                  padding: 22,
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: meta.color + "1A",
                    color: meta.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} strokeWidth={1.7} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14.5,
                      fontWeight: 500,
                      color: "#2A2A2A",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {r.title}
                  </p>
                  {r.description && (
                    <p style={{ fontSize: 12.5, color: "#6B7280", margin: "6px 0 0" }}>
                      {r.description}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 10.5,
                    color: "var(--accent)",
                    margin: "auto 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {meta.label} →
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
