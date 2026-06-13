import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerformanceDashboard } from "@/app/(portal)/portal/[engagement]/dashboard/_components/performance-dashboard";

export const dynamic = "force-dynamic";

export default async function ClientPerformanceAdmin({
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
    select: { id: true, name: true, client: { select: { name: true } } },
  });
  if (!engagement) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/clientes/portal/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para {engagement.name}
      </Link>
      <PerformanceDashboard
        engagementId={engagement.id}
        engagementName={`${engagement.client.name} · ${engagement.name}`}
      />
    </div>
  );
}
