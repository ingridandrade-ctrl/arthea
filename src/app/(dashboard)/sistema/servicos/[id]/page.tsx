import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceTemplatesEditor } from "./_components/service-templates-editor";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  STRATEGY: "Estratégia",
  PAID_TRAFFIC: "Tráfego Pago",
  LANDING_PAGE: "Landing page",
  GMB: "Google Meu Negócio",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const [service, templates] = await Promise.all([
    prisma.service.findUnique({ where: { id: params.id } }),
    prisma.serviceDeliverableTemplate.findMany({
      where: { serviceId: params.id },
      orderBy: [{ phase: "asc" }, { order: "asc" }],
    }),
  ]);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/sistema/servicos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Serviços
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ background: service.color }}
        >
          {service.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{service.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {service.description || "Sem descrição"}
          </p>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            {service.basePrice && (
              <span>R$ {service.basePrice.toFixed(2)} base</span>
            )}
            {service.engagementType && (
              <span>
                Tipo de frente:{" "}
                <strong className="text-foreground">{TYPE_LABEL[service.engagementType]}</strong>
              </span>
            )}
            <span>
              Duração default:{" "}
              <strong className="text-foreground">{service.defaultDurationMonths} meses</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Templates de entregáveis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quando esse serviço for contratado pelo wizard de novo cliente, esses entregáveis serão
            criados automaticamente na frente do cliente.
          </p>
        </div>
        <ServiceTemplatesEditor serviceId={service.id} initialTemplates={templates} />
      </div>
    </div>
  );
}
