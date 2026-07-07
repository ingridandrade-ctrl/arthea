import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Beaker } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPerformanceView } from "./_components/admin-performance-view";
import { DashboardV2 } from "./_components/dashboard-v2";
import type { DateRange, ComparePeriod } from "./_components/dashboard-v2/top-bar";

export const dynamic = "force-dynamic";

export default async function ClientPerformanceAdmin({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v2?: string; legacy?: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
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

  // Default agora é v2. Pra ver a versão antiga: ?legacy=1
  // (mantém ?v2=1 funcionando por compatibilidade)
  const useV2 = searchParams.legacy !== "1";

  return (
    <div>
      {/* Barra fixa no topo com voltar + toggle Beta bem visível */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1280px] mx-auto px-7 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/clientes/portal/${params.id}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
            {engagement.name}
          </Link>
          <Link
            href={
              useV2
                ? `/clientes/portal/${params.id}/performance?legacy=1`
                : `/clientes/portal/${params.id}/performance`
            }
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition"
          >
            <Beaker className="w-3.5 h-3.5" strokeWidth={1.8} />
            {useV2 ? "Ver versão antiga" : "Voltar pro novo dashboard"}
          </Link>
        </div>
      </div>

      {useV2 ? (
        <DashboardV2
          engagementId={engagement.id}
          clientName={engagement.client.name}
          engagementName={engagement.name}
          initialBusinessType={engagement.businessType}
          initialDateRange={(engagement.dashboardConfig?.defaultDateRange as DateRange) || "last_30d"}
          initialCompare={(engagement.dashboardConfig?.comparePeriod as ComparePeriod) || "previous"}
          hasConfig={engagement.dashboardConfig !== null}
          initialPlatforms={
            Array.isArray(engagement.dashboardConfig?.platforms)
              ? (engagement.dashboardConfig.platforms as ("meta" | "google")[])
              : ["meta"]
          }
        />
      ) : (
        <AdminPerformanceView
          engagementId={engagement.id}
          clientName={engagement.client.name}
          engagementName={engagement.name}
        />
      )}
    </div>
  );
}
