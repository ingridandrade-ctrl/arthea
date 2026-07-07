import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { PerformanceDashboard } from "./_components/performance-dashboard";

export default async function DashboardPage({
  params,
}: {
  params: { engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");

  const engagement = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    select: { id: true, name: true, type: true },
  });
  if (!engagement) notFound();

  return (
    <PerformanceDashboard engagementId={engagement.id} engagementName={engagement.name} />
  );
}
