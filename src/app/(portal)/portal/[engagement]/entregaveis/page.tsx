import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliverablesView } from "../../../_components/deliverables-view";

export default async function DeliverablesPage({
  params,
}: {
  params: { engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const project = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    include: {
      deliverables: {
        where: { isVisible: true },
        orderBy: [{ phase: "asc" }, { order: "asc" }],
      },
    },
  });
  if (!project) notFound();

  const items = project.deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    phase: d.phase,
    status: d.status,
  }));

  return <DeliverablesView items={items} engagementSlug={project.slug} />;
}
