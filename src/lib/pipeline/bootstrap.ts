import { prisma } from "@/lib/prisma";
import { ensureGmbTemplates } from "@/lib/followups/bootstrap";

// Hooks chamados ao criar o pipeline de um serviço.
// Garante que templates / config dependentes do pipeline também sejam criados.
const POST_CREATE_HOOKS: Record<string, () => Promise<unknown>> = {
  "google-meu-negocio": ensureGmbTemplates,
};

// Define stages per service. If a service has no entry here, falls back
// to the default (shared) pipeline.
const SERVICE_PIPELINES: Record<string, { name: string; stages: { name: string; order: number; color: string }[] }> = {
  "google-meu-negocio": {
    name: "Pipeline GMB",
    stages: [
      { name: "Novo lead", order: 0, color: "#6366f1" },
      { name: "Análise gerada", order: 1, color: "#3b82f6" },
      { name: "Em contato", order: 2, color: "#0ea5e9" },
      { name: "Em negociação", order: 3, color: "#f97316" },
      { name: "Ganho", order: 4, color: "#22c55e" },
      { name: "Perdido", order: 5, color: "#ef4444" },
    ],
  },
};

// Returns the pipeline ID for a service: the dedicated one if it exists,
// otherwise creates it from the SERVICE_PIPELINES config, otherwise
// returns the default (no serviceId) pipeline.
export async function ensurePipelineForService(serviceSlug: string): Promise<string | null> {
  const svc = await prisma.service.findUnique({ where: { slug: serviceSlug }, select: { id: true } });
  if (!svc) return null;

  const existing = await prisma.pipeline.findUnique({ where: { serviceId: svc.id }, select: { id: true } });
  if (existing) {
    // Pipeline já existe; ainda assim garante que templates do serviço estejam plugados
    // (idempotente, custo baixo). Roda em background pra não atrasar o request.
    POST_CREATE_HOOKS[serviceSlug]?.().catch((err) =>
      console.error(`post-create hook for ${serviceSlug} failed:`, err)
    );
    return existing.id;
  }

  const config = SERVICE_PIPELINES[serviceSlug];
  if (!config) {
    const def = await prisma.pipeline.findFirst({ where: { serviceId: null }, select: { id: true } });
    return def?.id ?? null;
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      name: config.name,
      serviceId: svc.id,
      stages: { create: config.stages },
    },
    select: { id: true },
  });

  await POST_CREATE_HOOKS[serviceSlug]?.();
  return pipeline.id;
}
