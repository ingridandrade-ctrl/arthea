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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 40px 0",
          position: "absolute",
          zIndex: 10,
        }}
      >
        <Link
          href={`/clientes/portal/${params.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#6B7280",
            textDecoration: "none",
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={14} /> {engagement.name}
        </Link>
        <Link
          href={
            useV2
              ? `/clientes/portal/${params.id}/performance`
              : `/clientes/portal/${params.id}/performance?v2=1`
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: useV2 ? "#1D7070" : "#6B7280",
            textDecoration: "none",
            fontFamily: "inherit",
            padding: "3px 8px",
            borderRadius: 999,
            border: `1px solid ${useV2 ? "#1D707033" : "#E5E7EB"}`,
            background: useV2 ? "#1D707011" : "transparent",
            fontWeight: 500,
          }}
        >
          <Beaker size={12} />
          {useV2 ? "Beta v2 (ativo)" : "Testar Beta v2"}
        </Link>
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
