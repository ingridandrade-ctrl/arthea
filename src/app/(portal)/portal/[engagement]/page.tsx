import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { StrategyDashboard } from "./_components/strategy-dashboard";
import { PaidTrafficDashboard } from "./_components/paid-traffic-dashboard";
import { LandingPageDashboard } from "./_components/landing-page-dashboard";
import { GmbDashboard } from "./_components/gmb-dashboard";

export default async function EngagementDashboard({
  params,
}: {
  params: { engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");
  const userName = session.user?.name || "";

  const project = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    include: {
      deliverables: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
    },
  });
  if (!project) notFound();

  switch (project.type) {
    case "PAID_TRAFFIC":
      return <PaidTrafficDashboard project={project} userName={userName} />;
    case "LANDING_PAGE":
      return <LandingPageDashboard project={project} userName={userName} />;
    case "GMB":
      return <GmbDashboard project={project} userName={userName} />;
    case "STRATEGY":
    default:
      return <StrategyDashboard project={project} userName={userName} />;
  }
}
