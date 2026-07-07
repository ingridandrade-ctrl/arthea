import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectTabs } from "./_components/project-tabs";

// Layout do PROJETO — cabeçalho fixo (cliente · projeto) + abas internas.
// Tudo do projeto (conteúdo, performance, análise, configuração) mora aqui
// dentro; nenhuma dessas telas é mais uma "viagem" pra fora.
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const project = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      currentPhase: true,
      accentColor: true,
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { deliverables: true, accesses: true, references: true } },
    },
  });
  if (!project) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/clientes/${project.client.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> {project.client.name}
      </Link>

      <div className="flex items-start gap-3">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 mt-0.5"
          style={{ background: project.accentColor || "#1D7070" }}
        >
          {project.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {project.client.name} · {project.client.email}
          </p>
          <h1 className="text-2xl font-bold mt-0.5 truncate">{project.name}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Fase {project.currentPhase} · {project._count.deliverables} entregáveis ·{" "}
            {project._count.accesses} acessos · {project._count.references} referências
          </p>
        </div>
      </div>

      <ProjectTabs projectId={project.id} />

      <div>{children}</div>
    </div>
  );
}
