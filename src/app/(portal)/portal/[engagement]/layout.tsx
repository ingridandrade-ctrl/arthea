import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Layout aninhado de cada frente — sobrescreve as CSS vars de accent pra que
// cada engagement tenha sua identidade visual mesmo dentro do mesmo cliente.
export default async function EngagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { engagement: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return <>{children}</>;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    select: { accentColor: true },
  });

  // Não achou? Deixa o page tratar com notFound — passa direto sem override.
  if (!engagement) return <>{children}</>;

  const accent = engagement.accentColor || "#1D7070";

  return (
    <div
      style={{
        ["--accent" as any]: accent,
        ["--accent-hover" as any]: accent + "EE",
        ["--accent-soft" as any]: accent + "12",
        ["--accent-border" as any]: accent + "33",
      }}
    >
      {children}
    </div>
  );
}
