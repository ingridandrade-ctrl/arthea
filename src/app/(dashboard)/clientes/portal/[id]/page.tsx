import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectEditor } from "./_components/project-editor";

export default async function PortalClienteDetail({
  params,
}: {
  params: { id: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const project = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true, email: true, scenesEnabled: true } },
      deliverables: {
        orderBy: [{ phase: "asc" }, { order: "asc" }],
      },
      accesses: { orderBy: { order: "asc" } },
      references: { orderBy: { order: "asc" } },
    },
  });

  if (!project) notFound();

  // Dossier vive no cliente — buscado separadamente
  const dossier = await prisma.clientDossier.findUnique({
    where: { clientId: project.clientId },
  });

  // Cenas (só se módulo está ligado pro cliente)
  const scenes = project.client.scenesEnabled
    ? await prisma.scene.findMany({
        where: { clientId: project.clientId },
        orderBy: [{ theme: "asc" }, { order: "asc" }],
        include: { _count: { select: { comments: true } } },
      })
    : [];

  const projectWithExtras = { ...project, dossier, scenes };

  return (
    <div className="space-y-6">
      <Link
        href="/clientes/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Portal de Clientes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {project.client.name} · {project.client.email}
          </p>
          <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fase {project.currentPhase} · {project.deliverables.length} entregáveis ·{" "}
            {project.accesses.length} acessos · {project.references.length} referências
          </p>
        </div>
        {project.type === "PAID_TRAFFIC" && (
          <Link
            href={`/clientes/portal/${project.id}/performance`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D4A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3838]"
          >
            <BarChart3 className="w-4 h-4" />
            Ver performance
          </Link>
        )}
      </div>

      <ProjectEditor
        project={JSON.parse(JSON.stringify(projectWithExtras))}
      />
    </div>
  );
}
