import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewClientWizard } from "./_components/new-client-wizard";

export const dynamic = "force-dynamic";

export default async function NovoClientePage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  // Puxa serviços ativos com seus templates pra preview no wizard
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { deliverableTemplates: true } },
    },
    orderBy: { name: "asc" },
  });

  // Leads disponíveis pra vincular (sem clientUser ainda)
  const availableLeads = await prisma.lead.findMany({
    where: {
      clientUser: null,
    },
    select: { id: true, name: true, email: true, phone: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <NewClientWizard
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        color: s.color,
        basePrice: s.basePrice,
        engagementType: s.engagementType,
        defaultDurationMonths: s.defaultDurationMonths,
        templateCount: s._count.deliverableTemplates,
      }))}
      leads={availableLeads}
    />
  );
}
