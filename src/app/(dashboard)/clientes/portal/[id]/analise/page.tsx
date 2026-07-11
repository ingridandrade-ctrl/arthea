import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InsightsCurationView } from "./_components/insights-curation-view";

export const dynamic = "force-dynamic";

export default async function InsightsCurationPage({
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
    },
  });
  if (!engagement) notFound();

  // Navegação vem das abas do layout do projeto.
  return (
    <div className="max-w-[1180px] mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Curadoria de Análise
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {engagement.name} · {engagement.client.name} · {engagement.businessType}
        </p>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Sugestões geradas pelo sistema entram como <strong>Pendentes</strong>. Você
          revisa, aprova (vira visível no dashboard do cliente) ou dispensa. Também
          dá pra escrever uma análise manual do zero — ela já entra aprovada.
        </p>
      </div>
      <InsightsCurationView engagementId={engagement.id} />
    </div>
  );
}
