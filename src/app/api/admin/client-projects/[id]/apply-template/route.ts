import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import { getTemplate } from "@/lib/engagement-templates";

// Aplica o template do tipo do engagement: cria os entregáveis padrão.
// Por segurança, só roda se a frente ainda não tem entregáveis (evita
// duplicar se admin clicar duas vezes). Pra reaplicar, body { force: true }.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: { id: true, type: true, _count: { select: { deliverables: true } } },
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

  if (engagement._count.deliverables > 0 && !force) {
    return NextResponse.json(
      {
        error:
          "Essa frente já tem entregáveis. Use { force: true } pra adicionar por cima ou apague os atuais antes.",
      },
      { status: 409 },
    );
  }

  await prisma.clientDeliverable.createMany({
    data: template.deliverables.map((d) => ({
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

  // Atualiza totalPhases se template prevê mais que o engagement atual
  await prisma.clientEngagement.update({
    where: { id: engagement.id },
    data: { totalPhases: template.totalPhases },
  });

  return NextResponse.json({
    ok: true,
    created: template.deliverables.length,
    template: template.label,
  });
}
