import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";
import { ensureGmnFlows } from "@/lib/flows/gmn-flows";

// Configura/reconfigura os fluxos canônicos do GMN: pipeline, templates,
// botões do T2B e os 5 fluxos pré-construídos.
export async function POST() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // 1. Garante pipeline + templates GMN (idempotente)
  await ensurePipelineForService("google-meu-negocio");

  // 2. Adiciona botões padrão no T2B (se ainda não tem)
  const t2b = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T2B" } });
  const t3 = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T3" } });
  if (t2b && (!t2b.buttons || (Array.isArray(t2b.buttons) && (t2b.buttons as any[]).length === 0))) {
    const buttons = [
      {
        id: "gmn_t2b_yes",
        label: "Sim, quero receber",
        actions: [
          ...(t3 ? [{ type: "trigger_template", templateId: t3.id }] : []),
          { type: "move_stage_by_name", stageNamePattern: "análise gerada" },
        ],
      },
      {
        id: "gmn_t2b_no",
        label: "Não, obrigado",
        actions: [
          { type: "mark_lost", reason: "Sem interesse (recusou análise)" },
        ],
      },
    ];
    await prisma.followUpTemplate.update({
      where: { id: t2b.id },
      data: { buttons: buttons as any },
    });
  }

  // 3. Cria/recria os 5 fluxos
  const flowResult = await ensureGmnFlows();

  return NextResponse.json({ ok: true, ...flowResult });
}
