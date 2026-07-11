import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectEditor } from "../_components/project-editor";
import { DashboardConfigView } from "./_components/dashboard-config-view";

export const dynamic = "force-dynamic";

// Aba Configuração do PROJETO — tudo de setup numa página só, empilhado:
// Identidade · Acessos · Sobre você · Interno · Acervo · Métricas do dashboard.
// (As antigas sub-abas do editor + o seletor de métricas viraram seções aqui.)
export default async function ProjectConfigPage({
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
      deliverables: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
      accesses: { orderBy: { order: "asc" } },
      references: { orderBy: { order: "asc" } },
      dashboardConfig: true,
    },
  });
  if (!project) notFound();

  const dossier = await prisma.clientDossier.findUnique({
    where: { clientId: project.clientId },
  });

  const scenes = project.client.scenesEnabled
    ? await prisma.scene.findMany({
        where: { clientId: project.clientId },
        orderBy: [{ theme: "asc" }, { order: "asc" }],
        include: { _count: { select: { comments: true } } },
      })
    : [];

  const projectWithExtras = { ...project, dossier, scenes };

  return (
    <div className="max-w-[1080px] pb-24">
      <ProjectEditor
        project={JSON.parse(JSON.stringify(projectWithExtras))}
        mode="config"
      />

      <section className="pt-10 mt-10 border-t border-border">
        <div className="mb-5">
          <h2 className="text-[17px] font-semibold tracking-tight">Métricas do dashboard</h2>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Até 12 métricas extras que aparecem na zona "Extras" do dashboard deste cliente
          </p>
        </div>
        <DashboardConfigView
          engagementId={project.id}
          initialSelected={
            Array.isArray(project.dashboardConfig?.customMetrics)
              ? (project.dashboardConfig.customMetrics as string[])
              : []
          }
        />
      </section>
    </div>
  );
}
