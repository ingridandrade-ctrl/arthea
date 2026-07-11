import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { DashboardV2 } from "@/app/(dashboard)/clientes/portal/[id]/performance/_components/dashboard-v2";
import type {
  DateRange,
  ComparePeriod,
} from "@/app/(dashboard)/clientes/portal/[id]/performance/_components/dashboard-v2/top-bar";

// Dashboard de performance na ÁREA DE MEMBROS — o mesmo dashboard v2 do
// admin, em modo cliente: sem setup, sem links de curadoria/configuração,
// sem diagnóstico interno. O que o cliente vê é o que a Arthea aprovou.
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
    select: {
      id: true,
      name: true,
      businessType: true,
      client: { select: { name: true } },
      dashboardConfig: {
        select: { defaultDateRange: true, comparePeriod: true, platforms: true },
      },
    },
  });
  if (!engagement) notFound();

  return (
    <DashboardV2
      engagementId={engagement.id}
      clientName={engagement.client.name}
      engagementName={engagement.name}
      initialBusinessType={engagement.businessType}
      initialDateRange={
        (engagement.dashboardConfig?.defaultDateRange as DateRange) || "last_30d"
      }
      initialCompare={
        (engagement.dashboardConfig?.comparePeriod as ComparePeriod) || "previous"
      }
      hasConfig={engagement.dashboardConfig !== null}
      initialPlatforms={
        Array.isArray(engagement.dashboardConfig?.platforms)
          ? (engagement.dashboardConfig.platforms as ("meta" | "google")[])
          : ["meta"]
      }
      viewer="client"
    />
  );
}
