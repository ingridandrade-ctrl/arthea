import { prisma } from "@/lib/prisma";

// Constrói os fluxos canônicos do GMN (Junho 2026 — versão 2).
//
// MUDANÇA IMPORTANTE: agora só temos 2 fluxos canônicos (em vez de 6-7):
//   1. "GMN · Forms — Fluxo completo" — TUDO do journey Forms numa cadência só
//   2. "GMN · Em negociação — Follow-ups" — cadência da proposta (qualquer origem)
//
// Os fluxos antigos (Prospecção, Em contato isolado, etc) são DELETADOS no
// próximo setup-gmn — ensureGmnFlows() faz wipe completo dos fluxos GMN
// existentes antes de recriar.
//
// Templates esperados (busca por code, codes mantidos antigos por compat):
//   F1 → GMN_T1 · F2 → GMN_T2A · P1 → GMN_T2B · P2 → GMN_T3 · P3 → GMN_T4
//   C1 → GMN_T5 · C2 → GMN_T6 · C3 → GMN_T7 · C4 → GMN_T8 · C5 → GMN_T9

export async function ensureGmnFlows() {
  const gmn = await prisma.service.findUnique({ where: { slug: "google-meu-negocio" }, select: { id: true } });
  if (!gmn) return { skipped: true, reason: "service_not_found" };

  const pipeline = await prisma.pipeline.findUnique({ where: { serviceId: gmn.id }, include: { stages: true } });
  if (!pipeline) return { skipped: true, reason: "pipeline_not_found" };

  // Botões padrão no P1 (T2B) e P4 (T4). Quando lead clica "Sim":
  //   - Manda P2 (confirmação imediata, lead vê resposta na hora)
  //   - Cria task pra admin gerar a análise
  //   - NÃO move estágio aqui — admin move manualmente depois de gerar
  //     a análise e preencher o linkAnalise. O Flow B (Prospecção/Análise
  //     gerada) toma conta a partir daí.
  const p2Tpl = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_P2" } });
  const buildYesNoButtons = (idPrefix: string) => [
    {
      id: `${idPrefix}_yes`,
      label: "Sim, quero receber",
      actions: [
        ...(p2Tpl ? [{ type: "trigger_template", templateId: p2Tpl.id }] : []),
        {
          type: "create_task",
          title: "Gerar análise para {{empresa}}",
          description: "Lead {{nome}} aceitou receber análise. Gere o relatório, preencha o campo \"Link da análise\" no card e mova pra \"Análise gerada\".",
          priority: "high",
        },
      ],
    },
    {
      id: `${idPrefix}_no`,
      label: "Não tenho interesse",
      actions: [{ type: "mark_lost", reason: "Recusou análise" }],
    },
  ];

  const t2bTpl = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T2B" } });
  if (t2bTpl) {
    await prisma.followUpTemplate.update({
      where: { id: t2bTpl.id },
      data: { buttons: buildYesNoButtons("gmn_t2b") as any },
    });
  }

  // P4 (Follow-up Permissão Prospecção, antigo T4): mesmos botões.
  const t4Tpl = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T4" } });
  if (t4Tpl) {
    await prisma.followUpTemplate.update({
      where: { id: t4Tpl.id },
      data: { buttons: buildYesNoButtons("gmn_t4") as any },
    });
  }

  const stageByName = (pattern: string) =>
    pipeline.stages.find((s) => s.name.toLowerCase().includes(pattern.toLowerCase()));

  const novoLead = stageByName("novo lead");
  const analiseGerada = stageByName("análise gerada") || stageByName("analise gerada");
  const emContato = stageByName("em contato");
  const emNegociacao = stageByName("em negociação") || stageByName("em negociacao");
  const perdidoStage = pipeline.stages.find((s) => /perdido/i.test(s.name));
  const perdidoId = perdidoStage?.id;

  if (!novoLead || !analiseGerada || !emContato || !emNegociacao) {
    return { skipped: true, reason: "stages_missing" };
  }

  const templateByCode = async (code: string) =>
    prisma.followUpTemplate.findUnique({ where: { code }, select: { id: true, name: true } });

  const [F1, F2, _P1, P2, _P3, C1, C2, C3, C4, C5] = await Promise.all([
    templateByCode("GMN_T1"),   // F1 — Boas-vindas Formulário
    templateByCode("GMN_T2A"),  // F2 — Análise Pronta Formulário
    templateByCode("GMN_T2B"),  // P1 — Primeiro Contato Prospecção (sai pelo Prospecção que admin cria manual)
    templateByCode("GMN_T3"),   // P2 — Análise Enviada Prospecção
    templateByCode("GMN_T4"),   // P3 — Follow-up Permissão Prospecção
    templateByCode("GMN_T5"),   // C1 — Follow-up Análise 1
    templateByCode("GMN_T6"),   // C2 — Follow-up Análise 2
    templateByCode("GMN_T7"),   // C3 — Último Toque
    templateByCode("GMN_T8"),   // C4 — Proposta
    templateByCode("GMN_T9"),   // C5 — Follow-up Proposta
  ]);

  // Action helpers — DRY pros configs repetitivos
  const sendWA = (tpl: { id: string; name: string }, delayHours = 0) => ({
    delayHours,
    actionType: "send_whatsapp",
    actionConfig: { templateId: tpl.id, templateName: tpl.name },
  });
  const waitBiz = (days: number) => ({
    delayHours: 0,
    actionType: "wait_business_days",
    actionConfig: { days },
  });
  const checkResponseToEmContato = () => ({
    delayHours: 0,
    actionType: "check_response",
    actionConfig: {
      moveStageIdOnReply: emContato.id,
      moveStageNameOnReply: emContato.name,
    },
  });
  const checkResponse = () => ({
    delayHours: 0,
    actionType: "check_response",
    actionConfig: {},
  });
  const setLossReason = (reason: string) => ({
    delayHours: 0,
    actionType: "set_loss_reason",
    actionConfig: { reason },
  });

  const flows: any[] = [];

  // ──────────────────────────────────────────────────────────────────────
  // 1) GMN · Forms — Fluxo completo
  // ──────────────────────────────────────────────────────────────────────
  // Inicia em "Novo lead" + source=FORMS. Cobre o jornada inteiro:
  //   F1 (boas-vindas) → admin move pra "Análise gerada" → guard linkAnalise
  //   → F2 → cadência C1/C2/C3 com checks de resposta em dias úteis →
  //   marca Perdido se nunca respondeu.
  if (F1 && F2 && C1 && C2 && C3) {
    flows.push({
      name: "GMN · Forms — Fluxo completo",
      description: "Jornada inteira do Forms: boas-vindas → análise → cadência → perdido.",
      triggerStageId: novoLead.id,
      condition: { source: "FORMS" },
      steps: [
        sendWA(F1, 0),
        // Pausa até admin gerar a análise e mover o lead manualmente
        { delayHours: 0, actionType: "wait_stage_change", actionConfig: { stageId: analiseGerada.id, stageName: analiseGerada.name } },
        // Não manda F2 com {{linkAnalise}} vazio
        { delayHours: 0, actionType: "field_check", actionConfig: { field: "linkAnalise" } },
        sendWA(F2, 0),
        waitBiz(1),
        checkResponseToEmContato(),
        sendWA(C1, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        sendWA(C2, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        sendWA(C3, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        setLossReason("Sem resposta após cadência"),
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2) GMN · Prospecção — Novo lead (com fallback P4)
  // ──────────────────────────────────────────────────────────────────────
  // Inicia em "Novo lead" + source=PROSPECCAO. Manda P1 com botões.
  // Aguarda clique:
  //   - Sim → botão dispara P2 + cria task "Gerar análise" + flow termina
  //     (Flow C toma conta quando admin mover pra Análise gerada)
  //   - Não → botão marca Perdido + flow termina
  //   - Sem clique em 2 dias úteis → manda P4 (último apelo) + aguarda
  //     mais 2 dias úteis → se ainda sem clique, marca Perdido "Sem resposta"
  //
  // Os botões do P1 e P4 são configurados acima em buildYesNoButtons.
  const P1 = await templateByCode("GMN_T2B");
  const P4 = await templateByCode("GMN_T4");
  if (P1 && P4) {
    const buttonClickedYesNo = () => ({
      delayHours: 0,
      actionType: "button_clicked",
      actionConfig: {
        branches: [
          { buttonId: "gmn_t2b_yes", label: "Sim (P1)", terminate: true, actions: [] },
          { buttonId: "gmn_t2b_no", label: "Não (P1)", terminate: true, actions: [] },
          { buttonId: "gmn_t4_yes", label: "Sim (P4)", terminate: true, actions: [] },
          { buttonId: "gmn_t4_no", label: "Não (P4)", terminate: true, actions: [] },
        ],
      },
    });
    flows.push({
      name: "GMN · Prospecção — Novo lead",
      description: "P1 → aguarda decisão → fallback P4 → Perdido se sem resposta.",
      triggerStageId: novoLead.id,
      condition: { source: "PROSPECCAO" },
      steps: [
        sendWA(P1, 0),
        waitBiz(2),
        // Roteia: Sim/Não terminam o fluxo. Sem clique → continua pra P4.
        buttonClickedYesNo(),
        sendWA(P4, 0),
        waitBiz(2),
        // Segundo check: Sim/Não terminam, sem clique = Perdido por sem resposta.
        {
          ...buttonClickedYesNo(),
          actionConfig: {
            branches: [
              { buttonId: "gmn_t2b_yes", label: "Sim", terminate: true, actions: [] },
              { buttonId: "gmn_t2b_no", label: "Não", terminate: true, actions: [] },
              { buttonId: "gmn_t4_yes", label: "Sim (P4)", terminate: true, actions: [] },
              { buttonId: "gmn_t4_no", label: "Não (P4)", terminate: true, actions: [] },
              {
                buttonId: "_none",
                label: "Sem resposta",
                terminate: true,
                actions: [{ type: "mark_lost", reason: "Sem resposta" }],
              },
            ],
          },
        },
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // 3) GMN · Prospecção — Análise gerada
  // ──────────────────────────────────────────────────────────────────────
  // Trigger: Análise gerada + source=PROSPECCAO. Admin moveu manualmente
  // depois de gerar análise e preencher linkAnalise. Cadência espelha a
  // do Forms — só não tem o F2 inicial (foi P3 enviado aqui).
  const P3 = await templateByCode("GMN_T3"); // P3 = código antigo T3
  if (P3 && C1 && C2 && C3) {
    flows.push({
      name: "GMN · Prospecção — Análise gerada",
      description: "Envia P3 (com guard linkAnalise) e cadência de follow-ups.",
      triggerStageId: analiseGerada.id,
      condition: { source: "PROSPECCAO" },
      steps: [
        // Guard: P3 referencia {{linkAnalise}}. Se vazio, pausa + notifica.
        { delayHours: 0, actionType: "field_check", actionConfig: { field: "linkAnalise" } },
        sendWA(P3, 0),
        waitBiz(1),
        checkResponseToEmContato(),
        sendWA(C1, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        sendWA(C2, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        sendWA(C3, 0),
        waitBiz(2),
        checkResponseToEmContato(),
        setLossReason("Sem resposta após cadência"),
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2) GMN · Em negociação — Follow-ups
  // ──────────────────────────────────────────────────────────────────────
  // Trigger único cobre todas as origens (Forms / Prospecção / Indicação).
  // Cadência espaçada (3 dias úteis entre toques) porque negociação exige
  // tempo de decisão.
  if (C4 && C5) {
    flows.push({
      name: "GMN · Em negociação — Follow-ups",
      description: "Cadência da proposta — vale pra qualquer origem.",
      triggerStageId: emNegociacao.id,
      condition: null,
      steps: [
        waitBiz(3),
        checkResponse(),
        sendWA(C4, 0),
        waitBiz(3),
        checkResponse(),
        sendWA(C5, 0),
        waitBiz(3),
        checkResponse(),
        setLossReason("Sem resposta na negociação"),
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // WIPE + RECREATE: deleta TODOS os fluxos GMN existentes (incluindo os
  // antigos canônicos como "Prospecção — Novo lead", "Em contato —
  // Follow-ups", etc) e recria os 2 canônicos novos. Para FlowExecutions
  // em running antes pra não deixar steps órfãos rodando.
  // ──────────────────────────────────────────────────────────────────────
  const existingFlows = await prisma.automationFlow.findMany({
    where: { serviceId: gmn.id },
    select: { id: true, name: true },
  });
  const targetNames = new Set(flows.map((f) => f.name));

  for (const existing of existingFlows) {
    // Para execuções rodando ANTES de deletar pra não deixar steps órfãos
    await prisma.flowExecution.updateMany({
      where: { flowId: existing.id, status: "running" },
      data: { status: "stopped", completedAt: new Date() },
    });
    // Marca steps pendentes como skipped
    await prisma.flowStepExecution.updateMany({
      where: { execution: { flowId: existing.id }, status: "pending" },
      data: { status: "skipped", executedAt: new Date(), result: { reason: "flow_wipe_setup" } },
    });
    // Se o flow não tá na lista nova, deleta
    if (!targetNames.has(existing.name)) {
      await prisma.flowStep.deleteMany({ where: { flowId: existing.id } });
      await prisma.automationFlow.delete({ where: { id: existing.id } });
    }
  }

  let created = 0;
  let recreated = 0;
  let deleted = existingFlows.filter((e) => !targetNames.has(e.name)).length;

  for (const f of flows) {
    const existing = await prisma.automationFlow.findFirst({ where: { name: f.name, serviceId: gmn.id } });
    if (existing) {
      await prisma.flowStep.deleteMany({ where: { flowId: existing.id } });
      await prisma.automationFlow.update({
        where: { id: existing.id },
        data: {
          description: f.description,
          triggerStageId: f.triggerStageId,
          triggerCondition: f.condition || undefined,
          isActive: true,
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

  // Sentinel pra evitar warning de var não usada (perdidoId ainda relevante
  // pra futuras evoluções dos fluxos).
  void perdidoId;

  return { created, recreated, deleted, total: flows.length };
}
