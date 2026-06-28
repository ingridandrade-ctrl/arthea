import { prisma } from "@/lib/prisma";

// Constrói (ou reconstrói) os 6 fluxos canônicos do GMN.
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

  // Botões padrão no T2B (uma vez só, não sobrescreve customização)
  const t2bTpl = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T2B" } });
  const t3Tpl = await prisma.followUpTemplate.findUnique({ where: { code: "GMN_T3" } });
  if (t2bTpl && (!t2bTpl.buttons || (Array.isArray(t2bTpl.buttons) && (t2bTpl.buttons as any[]).length === 0))) {
    const defaultButtons = [
      {
        id: "gmn_t2b_yes",
        label: "Sim, quero receber",
        actions: [
          ...(t3Tpl ? [{ type: "trigger_template", templateId: t3Tpl.id }] : []),
          { type: "move_stage_by_name", stageNamePattern: "análise gerada" },
        ],
      },
      {
        id: "gmn_t2b_no",
        label: "Não, obrigado",
        actions: [{ type: "mark_lost", reason: "Sem interesse (recusou análise)" }],
      },
    ];
    await prisma.followUpTemplate.update({
      where: { id: t2bTpl.id },
      data: { buttons: defaultButtons as any },
    });
  }

  const stageByName = (pattern: string) =>
    pipeline.stages.find((s) => s.name.toLowerCase().includes(pattern.toLowerCase()));

  const novoLead = stageByName("novo lead");
  const analiseGerada = stageByName("análise gerada") || stageByName("analise gerada");
  const emContato = stageByName("em contato");
  const emNegociacao = stageByName("em negociação") || stageByName("em negociacao");
  const ganho = stageByName("ganho");
  const perdidoId = pipeline.stages.find((s) => /perdido/i.test(s.name))?.id;

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
  // Cadência: T2B (0h) → 48h → T4 → 72h → T7 (breakup) → 72h → Perdido.
  // 48h pro 1º follow-up garante recall enquanto a marca ainda está fresca;
  // 72h entre toques 2/3 evita parecer insistente. Total ~8 dias.
  if (T2B && T4) {
    flows.push({
      name: "GMN · Prospecção — Novo lead",
      description: "Disparo do primeiro contato e follow-ups pra prospecção fria.",
      triggerStageId: novoLead.id,
      condition: { source: "PROSPECCAO" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T2B.id, templateName: T2B.name } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T4.id, templateName: T4.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        ...(T7 ? [{ delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } }] : []),
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: perdidoId, stageName: "Perdido" } },
      ],
    });
  }

  // 2) FORMS — Novo lead · origem Forms
  // T1 é só a boas-vindas; a análise é gerada por processo separado e cai em
  // "Análise gerada" (fluxo 3). Adiciona uma rede de proteção: se em 24h o
  // lead ainda estiver em "Novo lead" sem mover, gera tarefa interna pra time.
  if (T1) {
    flows.push({
      name: "GMN · Forms — Boas-vindas",
      description: "Disparo inicial quando lead chega pelo formulário do site.",
      triggerStageId: novoLead.id,
      condition: { source: "FORMS" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T1.id, templateName: T1.name } },
        { delayHours: 24, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "internal_reminder", actionConfig: {
          title: "Lead Forms parado em Novo lead há 24h",
          priority: "high",
          message: "Lead {{nome}} ({{empresa}}) chegou via Forms e segue em 'Novo lead' sem resposta. Verificar se análise foi gerada e mover o estágio.",
        } },
      ],
    });
  }

  // 3) FORMS — Análise gerada (cadência da análise pra origem Forms)
  // Cadência: T2A (0h) → 48h → T5 → 72h → T6 → 72h → T7 (breakup) → 72h → Perdido.
  // 48h pro primeiro follow-up porque a análise gera pico de interesse curto;
  // depois espaça em 72h pra evitar fadiga. Total ~10 dias.
  if (T2A && T5 && T6 && T7) {
    flows.push({
      name: "GMN · Forms — Análise enviada",
      description: "Envia análise e cadência de follow-ups.",
      triggerStageId: analiseGerada.id,
      condition: { source: "FORMS" },
      steps: [
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T2A.id, templateName: T2A.name } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T5.id, templateName: T5.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T6.id, templateName: T6.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: perdidoId, stageName: "Perdido" } },
      ],
    });
  }

  // 4) EM CONTATO (ambos) — cadência de follow-ups da análise
  // Lead chega aqui já tendo recebido um toque inicial (T2A/T2B). Cadência:
  // 48h → T5 → 72h → T6 → 72h → T7 (breakup) → 72h → Perdido. Total ~11 dias.
  if (T5 && T6 && T7) {
    flows.push({
      name: "GMN · Em contato — Follow-ups",
      description: "Cadência de follow-ups quando lead está em contato (qualquer origem).",
      triggerStageId: emContato.id,
      condition: null,
      steps: [
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T5.id, templateName: T5.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T6.id, templateName: T6.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T7.id, templateName: T7.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: perdidoId, stageName: "Perdido" } },
      ],
    });
  }

  // 5) EM NEGOCIAÇÃO (ambos)
  // Lead em negociação = alta intenção; merece atenção humana imediata + cadência
  // mais espaçada (decisão exige tempo). Cobre o edge case de ir direto de "Novo
  // lead" pra "Em negociação" (sem passar por "Em contato"), pois condition=null.
  // Cadência: reminder interno (0h) → T8 (0h) → 48h → T9 → 72h → tarefa final → Perdido.
  if (T8 && T9) {
    flows.push({
      name: "GMN · Em negociação — Cadência",
      description: "Apresenta proposta e faz follow-ups da negociação.",
      triggerStageId: emNegociacao.id,
      condition: null,
      steps: [
        { delayHours: 0, actionType: "internal_reminder", actionConfig: {
          title: "Lead entrou em negociação — atenção humana",
          priority: "high",
          message: "Lead {{nome}} ({{empresa}}) entrou em 'Em negociação'. Acompanhe pessoalmente: T8 (proposta) será enviado em sequência.",
        } },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T8.id, templateName: T8.name } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "send_whatsapp", actionConfig: { templateId: T9.id, templateName: T9.name } },
        { delayHours: 72, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "internal_reminder", actionConfig: {
          title: "Negociação sem resposta — última tentativa humana",
          priority: "high",
          message: "Lead {{nome}} ({{empresa}}) não respondeu T8 nem T9. Faça uma última tentativa humana (ligação) antes de marcar como Perdido.",
        } },
        { delayHours: 48, actionType: "check_response", actionConfig: {} },
        { delayHours: 0, actionType: "move_stage", actionConfig: { stageId: perdidoId, stageName: "Perdido" } },
      ],
    });
  }

  // 6) GANHO — cria tarefa de onboarding/contrato quando o lead é fechado.
  // Fluxo novo: faltava no conjunto original. Não dispara WhatsApp (não há template
  // de boas-vindas pós-fechamento entre T1-T9), mas garante que o time não esquece
  // de iniciar o onboarding. Usa `internal_reminder` (não `create_task`) porque
  // o engine só renderiza placeholders {{nome}}/{{empresa}} em internal_reminder.
  if (ganho) {
    flows.push({
      name: "GMN · Ganho — Onboarding",
      description: "Cria tarefas de contrato e onboarding quando o lead é fechado.",
      triggerStageId: ganho.id,
      condition: null,
      steps: [
        { delayHours: 0, actionType: "internal_reminder", actionConfig: {
          title: "Enviar contrato — fechamento GMN",
          priority: "high",
          message: "Lead {{nome}} ({{empresa}}) fechou GMN. Enviar contrato/proposta formal e coletar assinatura. Telefone: {{telefone}}.",
        } },
        { delayHours: 0, actionType: "internal_reminder", actionConfig: {
          title: "Iniciar onboarding GMN",
          priority: "high",
          message: "Agendar kickoff com {{nome}} ({{empresa}}), coletar acessos (Google Business, perfis) e iniciar setup da conta.",
        } },
        { delayHours: 72, actionType: "internal_reminder", actionConfig: {
          title: "Follow-up onboarding 72h",
          priority: "medium",
          message: "72h desde o fechamento de {{nome}} ({{empresa}}). Verificar status do contrato e do onboarding.",
        } },
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
