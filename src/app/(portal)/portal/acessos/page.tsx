import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        Acessos e contas
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Credenciais e links das contas configuradas durante o projeto.
      </p>

      <div
        style={{
          background: "#FEF3C7",
          border: "1px solid #FDE68A",
          padding: "12px 16px",
          borderRadius: 8,
          marginBottom: 32,
          fontSize: 13,
          color: "#92400E",
        }}
      >
        Estas credenciais são confidenciais. Não compartilhe com terceiros.
      </div>

      {project.accesses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
          Nenhum acesso cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {project.accesses.map((a) => (
            <AccessCard
              key={a.id}
              platform={a.platform}
              icon={a.icon}
              username={a.username}
              password={a.password}
              url={a.url}
              notes={a.notes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
