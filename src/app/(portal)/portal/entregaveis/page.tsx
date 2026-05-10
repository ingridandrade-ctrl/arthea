import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliverablesView } from "../../_components/deliverables-view";

export default async function DeliverablesPage() {
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
        Projeto não disponível.
      </div>
    );
  }

  const items = project.deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    phase: d.phase,
    status: d.status,
  }));

  return <DeliverablesView items={items} />;
}
