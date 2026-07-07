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
  searchParams: { v2?: string };
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
      dashboardConfig: { select: { defaultDateRange: true, comparePeriod: true } },
    },
  });
  if (!engagement) notFound();

  const useV2 = searchParams.v2 === "1";

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
                ? `/clientes/portal/${params.id}/performance`
                : `/clientes/portal/${params.id}/performance?v2=1`
            }
            className={
              useV2
                ? "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold bg-brand text-white hover:opacity-90 transition"
                : "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold bg-brand/10 text-brand border border-brand/30 hover:bg-brand/15 transition"
            }
          >
            <Beaker className="w-4 h-4" strokeWidth={1.9} />
            {useV2 ? "Voltar pra versão antiga" : "Testar Beta v2 (novo dashboard)"}
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
