import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
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

  // Cabeçalho e navegação vêm do layout do projeto (layout.tsx) — aqui só o editor.
  return (
    <ProjectEditor
      project={JSON.parse(JSON.stringify(projectWithExtras))}
      mode="entregaveis"
    />
  );
}
