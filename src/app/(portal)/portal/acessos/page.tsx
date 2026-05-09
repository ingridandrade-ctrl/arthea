import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert } from "lucide-react";
import { AccessCard } from "../../_components/access-card";

export default async function AcessosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const project = await prisma.clientProject.findUnique({
    where: { clientId: userId },
    include: { accesses: { orderBy: { order: "asc" } } },
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
          Acessos
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
          Suas contas e credenciais
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Plataformas configuradas pela Arthea durante o projeto.
        </p>
      </header>

      <div
        style={{
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 12,
          padding: "14px 18px",
          fontSize: 13,
          color: "#92400E",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <ShieldAlert size={18} strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong style={{ fontWeight: 600 }}>Confidencial.</strong> Não compartilhe estas
          credenciais com terceiros.
        </span>
      </div>

      {project.accesses.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#A0A0A0",
            fontSize: 14,
            border: "1px dashed rgba(13,74,74,0.15)",
            borderRadius: 18,
          }}
        >
          Nenhum acesso cadastrado ainda.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {project.accesses.map((a, idx) => (
            <div
              key={a.id}
              className="portal-stagger"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <AccessCard
                platform={a.platform}
                icon={a.icon}
                username={a.username}
                password={a.password}
                url={a.url}
                notes={a.notes}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
