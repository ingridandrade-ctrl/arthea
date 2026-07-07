import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardConfigView } from "./_components/dashboard-config-view";

export const dynamic = "force-dynamic";

export default async function DashboardConfigPage({
  params,
}: {
  params: { id: string };
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
      dashboardConfig: true,
    },
  });
  if (!engagement) notFound();

  return (
    <div className="max-w-[1080px] mx-auto px-7 py-8 pb-24">
      <Link
        href={`/clientes/portal/${params.id}/performance?v2=1`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard de performance
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Métricas extras deste cliente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {engagement.name} · {engagement.client.name}
        </p>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Escolha até 12 métricas do Meta pra aparecerem na Camada 3 do dashboard —
          são as métricas específicas deste cliente. Elas ficam abaixo dos blocos
          padrão do perfil.
        </p>
      </div>
      <DashboardConfigView
        engagementId={engagement.id}
        initialSelected={
          Array.isArray(engagement.dashboardConfig?.customMetrics)
            ? (engagement.dashboardConfig.customMetrics as string[])
            : []
        }
      />
    </div>
  );
}
