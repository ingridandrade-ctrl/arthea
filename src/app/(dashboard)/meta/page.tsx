import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetaClient } from "./_components/meta-client";

export const dynamic = "force-dynamic";

export default async function MetaPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");

  const userId = session.user.id;

  const [connections, projects] = await Promise.all([
    prisma.metaConnection.findMany({
      where: { userId },
      include: {
        adAccounts: {
          include: { clientProject: { select: { id: true, name: true } } },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.clientProject.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <MetaClient
      initialConnections={JSON.parse(JSON.stringify(connections))}
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.client.name,
      }))}
      statusParam={searchParams.status ?? null}
    />
  );
}
