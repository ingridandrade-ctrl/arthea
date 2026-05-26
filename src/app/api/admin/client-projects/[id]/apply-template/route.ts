import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import { getTemplate } from "@/lib/engagement-templates";

// Aplica o template do tipo do engagement.
// Body opcional:
//   { phase: 2 }          → cria só os entregáveis daquela fase
//   { force: true }       → adiciona mesmo se já existem entregáveis
// Sem phase, aplica o template inteiro. Por segurança, sem force só roda
// se o escopo (fase ou tudo) ainda estiver vazio.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: { id: true, type: true },
  });
  if (!engagement) {
    return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });
  }

  const template = getTemplate(engagement.type);
  if (!template) {
    return NextResponse.json(
      { error: `Não há template ainda pra tipo ${engagement.type}` },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const force = !!body.force;
  const phaseFilter = typeof body.phase === "number" ? body.phase : null;

  // Quais itens vamos criar
  const toCreate = phaseFilter
    ? template.deliverables.filter((d) => d.phase === phaseFilter)
    : template.deliverables;

  if (toCreate.length === 0) {
    return NextResponse.json(
      { error: `Template não tem entregáveis pra fase ${phaseFilter}` },
      { status: 400 },
    );
  }

  // Conflito: se o escopo já tem itens e sem force, avisa
  const existingCount = await prisma.clientDeliverable.count({
    where: {
      engagementId: engagement.id,
      ...(phaseFilter && { phase: phaseFilter }),
    },
  });
  if (existingCount > 0 && !force) {
    const scope = phaseFilter ? `a Fase ${phaseFilter}` : "essa frente";
    return NextResponse.json(
      {
        error: `${scope} já tem ${existingCount} entregáveis. Use { force: true } pra adicionar por cima ou apague os atuais antes.`,
      },
      { status: 409 },
    );
  }

  await prisma.clientDeliverable.createMany({
    data: toCreate.map((d) => ({
      engagementId: engagement.id,
      title: d.title,
      description: d.description,
      category: d.category,
      kind: d.kind,
      phase: d.phase,
      order: d.order,
      status: "PENDING",
      isVisible: true,
    })),
  });

  // Atualiza totalPhases se o template prevê mais que o engagement atual
  await prisma.clientEngagement.update({
    where: { id: engagement.id },
    data: { totalPhases: template.totalPhases },
  });

  return NextResponse.json({
    ok: true,
    created: toCreate.length,
    phase: phaseFilter,
    template: template.label,
  });
}
