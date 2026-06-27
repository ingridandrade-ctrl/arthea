import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetaClient } from "../../../clientes/meta/_components/meta-client";

export const dynamic = "force-dynamic";

export default async function IntegracoesMetaPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const userId = session.user.id;

  const [connections, engagements] = await Promise.all([
    prisma.metaConnection.findMany({
      where: { userId },
      include: {
        adAccounts: {
          include: { engagement: { select: { id: true, name: true } } },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.clientEngagement.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/sistema/integracoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Integrações
      </Link>
      <MetaClient
        initialConnections={JSON.parse(JSON.stringify(connections))}
        engagements={engagements.map((e) => ({
          id: e.id,
          name: e.name,
          clientName: e.client.name,
        }))}
        statusParam={searchParams.status ?? null}
      />
    </div>
  );
}
