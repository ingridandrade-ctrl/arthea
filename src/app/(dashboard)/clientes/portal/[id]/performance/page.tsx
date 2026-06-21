import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPerformanceView } from "./_components/admin-performance-view";

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
    <div>
      <Link
        href={`/clientes/portal/${params.id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#6B7280",
          textDecoration: "none",
          padding: "16px 40px 0",
          fontFamily: "inherit",
          position: "absolute",
          zIndex: 10,
        }}
      >
        <ArrowLeft size={14} /> {engagement.name}
      </Link>
      <AdminPerformanceView
        engagementId={engagement.id}
        clientName={engagement.client.name}
        engagementName={engagement.name}
      />
    </div>
  );
}
