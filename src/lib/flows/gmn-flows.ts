import { prisma } from "@/lib/prisma";

// Constrói (ou reconstrói) os 4 fluxos canônicos do GMN.
// Idempotente: se um fluxo com mesmo nome já existe, deleta passos antigos
// e recria — desde que não tenha execuções rodando.
//
// Templates esperados (busca por code): GMN_T1, GMN_T2A, GMN_T2B, GMN_T3,
// GMN_T4, GMN_T5, GMN_T6, GMN_T7, GMN_T8, GMN_T9.

export async function ensureGmnFlows() {
  const gmn = await prisma.service.findUnique({ where: { slug: "google-meu-negocio" }, select: { id: true } });
  if (!gmn) return { skipped: true, reason: "service_not_found" };

  const pipeline = await prisma.pipeline.findUnique({ where: { serviceId: gmn.id }, include: { stages: true } });
  if (!pipeline) return { skipped: true, reason: "pipeline_not_found" };

  const stageByName = (pattern: string) =>
    pipeline.stages.find((s) => s.name.toLowerCase().includes(pattern.toLowerCase()));

  const novoLead = stageByName("novo lead");
  const analiseGerada = stageByName("análise gerada") || stageByName("analise gerada");
  const emContato = stageByName("em contato");
  const emNegociacao = stageByName("em negociação") || stageByName("em negociacao");

  if (!novoLead || !analiseGerada || !emContato || !emNegociacao) {
    return { skipped: true, reason: "stages_missing" };
  }

  const templateByCode = async (code: string) =>
    prisma.followUpTemplate.findUnique({ where: { code }, select: { id: true, name: true } });

  const [T1, T2A, T2B, T3, T4, T5, T6, T7, T8, T9] = await Promise.all([
    templateByCode("GMN_T1"), templateByCode("GMN_T2A"), templateByCode("GMN_T2B"),
    templateByCode("GMN_T3"), templateByCode("GMN_T4"), templateByCode("GMN_T5"),
    templateByCode("GMN_T6"), templateByCode("GMN_T7"), templateByCode("GMN_T8"),
    templateByCode("GMN_T9"),
  ]);

  const flows: any[] = [];

  // 1) PROSPECÇÃO — Novo lead · origem Prospecção
  if (T2B && T4) {
    flows.push({
      name: "GMN · Prospecção — Novo lead",
      description: "Disparo do primeiro contato e follow-ups pra prospecção fria.",
      triggerStageId: novoLead.id,
      condition: { source: "PROSPECCAO" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T2B.id, templateName: T2B.name } },
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T4.id, templateName: T4.name } },
        { delayHours: 96, actionType: "check_response", actionConfig: {} },
        ...(T7 ? [{ delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } }] : []),
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: pipeline.stages.find((s) => /perdido/i.test(s.name))?.id, stageName: "Perdido" } },
      ],
    });
  }

  // 2) FORMS — Novo lead · origem Forms
  if (T1) {
    flows.push({
      name: "GMN · Forms — Boas-vindas",
      description: "Disparo inicial quando lead chega pelo formulário do site.",
      triggerStageId: novoLead.id,
      condition: { source: "FORMS" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T1.id, templateName: T1.name } },
      ],
    });
  }

  // 3) FORMS — Análise gerada (cadência da análise pra origem Forms)
  if (T2A && T5 && T6 && T7) {
    flows.push({
      name: "GMN · Forms — Análise enviada",
      description: "Envia análise e cadência de follow-ups.",
      triggerStageId: analiseGerada.id,
      condition: { source: "FORMS" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T2A.id, templateName: T2A.name } },
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T5.id, templateName: T5.name } },
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T6.id, templateName: T6.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: pipeline.stages.find((s) => /perdido/i.test(s.name))?.id, stageName: "Perdido" } },
      ],
    });
  }

  // 4) EM CONTATO (ambos) — cadência de follow-ups da análise
  if (T5 && T6 && T7) {
    flows.push({
      name: "GMN · Em contato — Follow-ups",
      description: "Cadência de follow-ups quando lead está em contato (qualquer origem).",
      triggerStageId: emContato.id,
      condition: null,
      steps: [
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T5.id, templateName: T5.name } },
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T6.id, templateName: T6.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: pipeline.stages.find((s) => /perdido/i.test(s.name))?.id, stageName: "Perdido" } },
      ],
    });
  }

  // 5) EM NEGOCIAÇÃO (ambos)
  if (T8 && T9) {
    flows.push({
      name: "GMN · Em negociação — Cadência",
      description: "Apresenta proposta e faz follow-ups da negociação.",
      triggerStageId: emNegociacao.id,
      condition: null,
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T8.id, templateName: T8.name } },
        { delayHours: 60, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T9.id, templateName: T9.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: pipeline.stages.find((s) => /perdido/i.test(s.name))?.id, stageName: "Perdido" } },
      ],
    });
  }

  let created = 0;
  let recreated = 0;

  for (const f of flows) {
    const existing = await prisma.automationFlow.findFirst({ where: { name: f.name, serviceId: gmn.id } });
    if (existing) {
      const running = await prisma.flowExecution.count({ where: { flowId: existing.id, status: "running" } });
      if (running > 0) continue; // Não mexe em fluxos com execuções rodando
      await prisma.flowStep.deleteMany({ where: { flowId: existing.id } });
      await prisma.automationFlow.update({
        where: { id: existing.id },
        data: {
          description: f.description,
          triggerStageId: f.triggerStageId,
          triggerCondition: f.condition || undefined,
          steps: { create: f.steps.map((s: any, i: number) => ({ ...s, order: i + 1, isActive: true })) },
        },
      });
      recreated++;
    } else {
      await prisma.automationFlow.create({
        data: {
          name: f.name,
          description: f.description,
          serviceId: gmn.id,
          isActive: true,
          triggerType: "STAGE_ENTER",
          triggerStageId: f.triggerStageId,
          triggerCondition: f.condition || undefined,
          steps: { create: f.steps.map((s: any, i: number) => ({ ...s, order: i + 1, isActive: true })) },
        },
      });
      created++;
    }
  }

  return { created, recreated, total: flows.length };
}
