import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAdsAdmin } from "../../../clientes/google-ads/_components/google-ads-admin";

export const dynamic = "force-dynamic";

export default async function IntegracoesGoogleAdsPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const userId = session.user.id;

  const [connection, accounts, engagements] = await Promise.all([
    prisma.googleAdsConnection.findUnique({ where: { userId } }),
    prisma.googleAdsAccount.findMany({
      where: { connection: { userId } },
      include: { engagement: { select: { id: true, name: true, client: { select: { name: true } } } } },
      orderBy: { name: "asc" },
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
      <GoogleAdsAdmin
        initialConnection={
          connection
            ? {
                id: connection.id,
                status: connection.status,
                mccCustomerId: connection.mccCustomerId,
                updatedAt: connection.updatedAt.toISOString(),
              }
            : null
        }
        initialAccounts={accounts.map((a) => ({
          id: a.id,
          customerId: a.customerId,
          name: a.name,
          currencyCode: a.currencyCode,
          engagementId: a.engagementId,
          engagement: a.engagement
            ? { id: a.engagement.id, name: a.engagement.name, clientName: a.engagement.client.name }
            : null,
        }))}
        engagements={engagements.map((e) => ({
          id: e.id,
          name: e.name,
          clientName: e.client.name,
        }))}
      />
    </div>
  );
}
