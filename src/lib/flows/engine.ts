import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendTemplateMessage, sendInteractiveButtons } from "@/lib/whatsapp-official";
import { renderTemplate } from "@/lib/followups/engine";
import { resolveMetaParams } from "@/lib/templates/meta-conversion";
import { addBusinessDays } from "./business-days";

// Dispara fluxos quando um evento acontece:
// - stage_enter: leadService entrou num estágio novo
// - lead_created: novo lead criado
export async function triggerFlows(opts: {
  type: "STAGE_ENTER" | "LEAD_CREATED";
  leadId: string;
  leadServiceId?: string;
  stageId?: string;
}) {
  // Carrega o lead + leadService (se houver) pra avaliar condições
  const [lead, leadService] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: opts.leadId },
      select: { source: true, status: true },
    }),
    opts.leadServiceId
      ? prisma.leadService.findUnique({
          where: { id: opts.leadServiceId },
          select: { serviceId: true, customData: true },
        })
      : Promise.resolve(null),
  ]);
  if (!lead) return;

  // Busca fluxos que casam com o gatilho
  const where: any = { isActive: true, triggerType: opts.type };
  if (opts.type === "STAGE_ENTER" && opts.stageId) where.triggerStageId = opts.stageId;
  if (leadService?.serviceId) where.OR = [{ serviceId: leadService.serviceId }, { serviceId: null }];

  const flows = await prisma.automationFlow.findMany({
    where,
    include: { steps: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  const ctx: Record<string, any> = {
    source: lead.source,
    status: lead.status,
    ...((leadService?.customData || {}) as Record<string, any>),
  };

  for (const flow of flows) {
    if (!matchesCondition(flow.triggerCondition as any, ctx)) continue;
    if (flow.steps.length === 0) continue;

    // Idempotência: não cria nova execução se já existe uma running deste flow pro mesmo leadService
    const existing = await prisma.flowExecution.findFirst({
      where: {
        flowId: flow.id,
        leadId: opts.leadId,
        leadServiceId: opts.leadServiceId ?? null,
        status: "running",
      },
    });
    if (existing) continue;

    const execution = await prisma.flowExecution.create({
      data: {
        flowId: flow.id,
        leadId: opts.leadId,
        leadServiceId: opts.leadServiceId ?? null,
        status: "running",
      },
    });

    // Agenda todos os passos. Acumulador `cursor` representa o "horário atual"
    // conforme a gente avança pelos passos. delayHours é o jeito padrão de
    // somar tempo. wait_business_days pula fins de semana e feriados BR.
    let cursor = new Date();
    for (const step of flow.steps) {
      if (step.actionType === "wait_business_days") {
        const cfg = (step.actionConfig || {}) as any;
        const days = Number(cfg.days || 1);
        cursor = addBusinessDays(cursor, days);
      } else if (step.delayHours > 0) {
        cursor = new Date(cursor.getTime() + step.delayHours * 60 * 60 * 1000);
      }
      await prisma.flowStepExecution.create({
        data: {
          executionId: execution.id,
          stepId: step.id,
          order: step.order,
          scheduledAt: new Date(cursor),
          status: "pending",
        },
      });
    }
  }
}

export async function processDueFlowSteps() {
  const now = new Date();
  const due = await prisma.flowStepExecution.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: {
      step: true,
      execution: {
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true, company: true, source: true, status: true } },
          flow: { select: { id: true, name: true } },
        },
      },
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  const results: { id: string; ok: boolean; action: string }[] = [];

  for (const item of due) {
    const lead = item.execution.lead;
    const leadServiceId = item.execution.leadServiceId;
    let leadService: any = null;
    if (leadServiceId) {
      leadService = await prisma.leadService.findUnique({
        where: { id: leadServiceId },
        select: { id: true, customData: true, stageId: true, service: { select: { name: true } } },
      });
    }

    const customData = (leadService?.customData || {}) as Record<string, any>;
    const ctx: Record<string, any> = { source: lead.source, status: lead.status, ...customData };

    // Avalia condição do passo (se existir)
    if (!matchesCondition(item.step.condition as any, ctx)) {
      await prisma.flowStepExecution.update({
        where: { id: item.id },
        data: { status: "skipped", executedAt: now },
      });
      results.push({ id: item.id, ok: true, action: "skipped" });
      continue;
    }

    const action = item.step.actionType;
    const config = (item.step.actionConfig || {}) as Record<string, any>;

    try {
      if (action === "send_whatsapp" || action === "internal_reminder") {
        // Resolve template (sempre busca versão atual do banco)
        let raw = (config.message as string) || "";
        let metaName: string | null = null;
        let metaParamOrder: string[] = [];
        let metaApproved = false;
        let templateButtons: { id: string; label: string }[] = [];
        if (config.templateId) {
          const tpl = await prisma.followUpTemplate.findUnique({
            where: { id: config.templateId as string },
            select: {
              messageTemplate: true,
              isActive: true,
              metaName: true,
              metaStatus: true,
              metaParamOrder: true,
              buttons: true,
            },
          });
          if (tpl && tpl.isActive) {
            raw = tpl.messageTemplate;
            metaName = tpl.metaName;
            metaParamOrder = (tpl.metaParamOrder as string[]) || [];
            metaApproved = tpl.metaStatus === "APPROVED";
            templateButtons = ((tpl.buttons as any[]) || []).map((b: any) => ({ id: b.id, label: b.label }));
          } else if (!tpl) {
            // Template foi deletado mas o FlowStep ainda referencia. Skip ao
            // invés de mandar uma string vazia (config.message provavelmente
            // também está vazio).
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "skipped", executedAt: now, result: { reason: "template_deleted", templateId: config.templateId } },
            });
            results.push({ id: item.id, ok: false, action: "template_missing" });
            continue;
          } else if (!tpl.isActive) {
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "skipped", executedAt: now, result: { reason: "template_inactive", templateId: config.templateId } },
            });
            results.push({ id: item.id, ok: false, action: "template_inactive" });
            continue;
          }
        }
        const variables = {
          nome: lead.name,
          servico: leadService?.service?.name || "",
          empresa: lead.company || "",
          telefone: lead.phone,
          email: lead.email || "",
          ...customData,
        };
        const message = renderTemplate(raw, variables);

        // Guarda: se a mensagem ainda contém placeholders {{var}} não resolvidos,
        // notifica a equipe em vez de enviar texto quebrado. Cobre o caso clássico
        // de T2A/T3 dispararem antes da Ingrid preencher {{linkAnalise}} em
        // LeadService.customData.
        if (action === "send_whatsapp") {
          const unresolved = message.match(/\{\{\s*\w+\s*\}\}/g);
          if (unresolved && unresolved.length > 0) {
            const recipients = await prisma.user.findMany({
              where: { role: { in: ["ADMIN", "MANAGER"] } },
              select: { id: true },
            });
            const missing = Array.from(new Set(unresolved.map((s) => s.replace(/[{}\s]/g, ""))));
            for (const u of recipients) {
              await prisma.notification.create({
                data: {
                  userId: u.id,
                  type: "flow_missing_vars",
                  title: `Mensagem do fluxo bloqueada: faltam variáveis`,
                  body: `Lead ${lead.name}: o passo do fluxo "${item.execution.flow.name}" tem variáveis não preenchidas (${missing.join(", ")}). Preencha em "Dados do serviço" antes que o lead receba mensagem quebrada.`,
                  data: { leadId: lead.id, missing, executionId: item.executionId },
                },
              });
            }
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "skipped", executedAt: now, result: { reason: "unresolved_variables", missing } },
            });
            results.push({ id: item.id, ok: false, action: "missing_variables" });
            continue;
          }
        }

        // Guarda: se a mensagem final ficou vazia (template vazio + config.message
        // vazio), não envia — pra evitar erro na API ou WhatsApp em branco.
        if (action === "send_whatsapp" && !message.trim()) {
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "skipped", executedAt: now, result: { reason: "empty_message" } },
          });
          results.push({ id: item.id, ok: false, action: "empty_message" });
          continue;
        }

        if (action === "send_whatsapp") {
          // ── Otimização de custo: usa janela de 24h quando disponível ────
          // Meta cobra mensagens iniciadas pelo negócio (template), mas
          // dentro da "janela de atendimento" (24h após qualquer mensagem
          // recebida do lead) podemos mandar texto livre / interactive
          // DE GRAÇA. Só caímos pro template se a janela fechou.
          const lastInbound = await prisma.message.findFirst({
            where: {
              conversation: { leadId: lead.id },
              sender: "LEAD",
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });
          const isWithinWindow =
            !!lastInbound &&
            Date.now() - lastInbound.createdAt.getTime() < 24 * 60 * 60 * 1000;

          if (isWithinWindow && templateButtons.length > 0) {
            // Janela aberta + tem botões → interactive (grátis, com botões)
            await sendInteractiveButtons(lead.phone, message, templateButtons);
          } else if (isWithinWindow) {
            // Janela aberta sem botões → texto livre (grátis)
            await sendWhatsAppMessage(lead.phone, message);
          } else if (metaApproved && metaName) {
            // Janela fechada e tem template aprovado → manda template (pago)
            const params = resolveMetaParams(metaParamOrder, variables);
            await sendTemplateMessage(lead.phone, metaName, "pt_BR", [
              { type: "body", parameters: params.map((p) => ({ type: "text", text: p })) },
            ]);
          } else if (templateButtons.length > 0) {
            // Janela fechada sem template aprovado mas com botões — tenta
            // interactive (vai falhar fora da janela, mas mantém o
            // comportamento anterior pra não quebrar fluxos legacy)
            await sendInteractiveButtons(lead.phone, message, templateButtons);
          } else {
            // Janela fechada sem template aprovado — texto livre (vai falhar)
            await sendWhatsAppMessage(lead.phone, message);
          }
          // Registra na conversa
          let conv = await prisma.conversation.findFirst({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" } });
          if (!conv) {
            conv = await prisma.conversation.create({ data: { leadId: lead.id, isAiActive: true, lastMessageAt: new Date() } });
          }
          await prisma.message.create({ data: { conversationId: conv.id, content: message, sender: "AI" } });
        } else {
          // internal_reminder: cria como Task pra aparecer em /crm/tarefas
          await prisma.task.create({
            data: {
              title: (config.title as string) || `Passo do fluxo: ${item.execution.flow.name}`,
              description: message,
              priority: (config.priority as string) || "medium",
              leadId: lead.id,
              leadServiceId,
              dueDate: new Date(),
            },
          });
        }

        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "move_stage") {
        if (leadServiceId && config.stageId) {
          // Guarda: confere que o stage destino ainda existe antes de mover,
          // pra evitar foreign key error se o estágio foi deletado depois
          // que o fluxo foi configurado.
          const target = await prisma.pipelineStage.findUnique({
            where: { id: config.stageId as string },
            select: { id: true },
          });
          if (target) {
            await prisma.leadService.update({ where: { id: leadServiceId }, data: { stageId: target.id } });
            await resolveWaitStageChanges(leadServiceId, target.id);
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "executed", executedAt: now },
            });
            results.push({ id: item.id, ok: true, action });
          } else {
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "skipped", executedAt: now, result: { reason: "target_stage_deleted", stageId: config.stageId } },
            });
            results.push({ id: item.id, ok: false, action: "move_stage_skipped" });
          }
        } else {
          // stageId não foi configurado (ex: pipeline sem "Perdido") — skip
          // em vez de quebrar o fluxo todo.
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "skipped", executedAt: now, result: { reason: "missing_stage_id" } },
          });
          results.push({ id: item.id, ok: false, action: "move_stage_skipped" });
        }
      } else if (action === "check_response") {
        // Verifica se o lead enviou alguma mensagem (sender=LEAD) APÓS o
        // início desta execução. Se sim, para o fluxo + notifica.
        const replied = await prisma.message.findFirst({
          where: {
            sender: "LEAD",
            createdAt: { gte: item.execution.startedAt },
            conversation: { leadId: lead.id },
          },
          orderBy: { createdAt: "desc" },
          select: { content: true },
        });
        if (replied) {
          const { onLeadReplied } = await import("./lead-replied");
          await onLeadReplied({ leadId: lead.id, lastMessage: replied.content }).catch(() => {});

          // Opcional: move o lead pra estágio específico ao detectar resposta.
          // Configurado por { moveStageIdOnReply, moveStageNameOnReply } no
          // actionConfig. Usado nos fluxos pra mover Forms cadência → "Em
          // contato" quando o lead responde mid-cadência.
          const moveStageId = (config.moveStageIdOnReply as string) || null;
          if (moveStageId && leadServiceId) {
            const target = await prisma.pipelineStage.findUnique({
              where: { id: moveStageId },
              select: { id: true },
            });
            if (target) {
              await prisma.leadService.update({
                where: { id: leadServiceId },
                data: { stageId: target.id },
              });
              await resolveWaitStageChanges(leadServiceId, target.id);
            }
          }

          // Marca todos os passos pendentes desta execução como skipped
          await prisma.flowStepExecution.updateMany({
            where: { executionId: item.executionId, status: "pending" },
            data: { status: "skipped", executedAt: now, result: { reason: "lead_replied_at_check" } },
          });
          await prisma.flowExecution.update({
            where: { id: item.executionId },
            data: { status: "stopped", completedAt: now },
          });
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "executed", executedAt: now, result: { branch: "replied", movedToStageId: moveStageId } },
          });
          results.push({ id: item.id, ok: true, action: "check_response_stopped" });
        } else {
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "executed", executedAt: now, result: { branch: "no_reply" } },
          });
          results.push({ id: item.id, ok: true, action: "check_response_continue" });
        }
      } else if (action === "create_task") {
        await prisma.task.create({
          data: {
            title: (config.title as string) || "Tarefa do fluxo",
            description: (config.description as string) || null,
            priority: (config.priority as string) || "medium",
            leadId: lead.id,
            leadServiceId,
            dueDate: config.dueAtIso ? new Date(config.dueAtIso) : null,
          },
        });
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "wait_business_days") {
        // Espera pura — quando o scheduledAt bater, só marca executed.
        // O delay já foi calculado em triggerFlows considerando dias úteis.
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now, result: { branch: "elapsed" } },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "wait_stage_change") {
        // Pausa o fluxo até o leadService entrar no estágio configurado.
        // Tem 2 mecanismos:
        //   a) Polling: se cron rodar e o stage não bate, reagenda esse step
        //      pra 15min depois (e empurra os subsequentes pra preservar cadência).
        //   b) Responsivo: quando admin move o lead pro stage alvo, o helper
        //      resolveWaitStageChanges (chamado em quem muda stage) força
        //      todos os steps "wait_stage_change" pendentes a executarem
        //      agora — sem esperar o polling.
        const targetStageId = String(config.stageId || "");
        if (!targetStageId || !leadService) {
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "skipped", executedAt: now, result: { reason: "missing_target_stage" } },
          });
          results.push({ id: item.id, ok: false, action: "wait_stage_no_target" });
        } else {
          // Lê estágio atual do leadService (não usa o snapshot — pode ter mudado
          // entre o agendamento e agora).
          const lsFresh = await prisma.leadService.findUnique({
            where: { id: leadService.id },
            select: { stageId: true },
          });
          if (lsFresh?.stageId === targetStageId) {
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { status: "executed", executedAt: now, result: { branch: "stage_matched" } },
            });
            results.push({ id: item.id, ok: true, action: "wait_stage_matched" });
          } else {
            // Polling: tenta de novo em 15 min, empurra subsequentes pra
            // não furar cadência.
            const POLL_INTERVAL_MS = 15 * 60 * 1000;
            const nextRetry = new Date(Date.now() + POLL_INTERVAL_MS);
            await prisma.flowStepExecution.update({
              where: { id: item.id },
              data: { scheduledAt: nextRetry, result: { reason: "waiting_stage", targetStageId } },
            });
            const downstream = await prisma.flowStepExecution.findMany({
              where: {
                executionId: item.executionId,
                status: "pending",
                order: { gt: item.order },
              },
              select: { id: true, scheduledAt: true },
            });
            for (const d of downstream) {
              await prisma.flowStepExecution.update({
                where: { id: d.id },
                data: { scheduledAt: new Date(d.scheduledAt.getTime() + POLL_INTERVAL_MS) },
              });
            }
            results.push({ id: item.id, ok: false, action: "wait_stage_polling" });
          }
        }
      } else if (action === "field_check") {
        // Verifica se um campo do leadService.customData está preenchido.
        // Se sim: continua. Se não: notifica admin + reagenda esse step
        // pra 1h depois (pausa o fluxo até o campo aparecer ou desistir
        // manualmente).
        const field = String(config.field || "").trim();
        const value = field ? customData[field] : undefined;
        const hasValue = value !== undefined && value !== null && String(value).trim() !== "";

        if (hasValue) {
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "executed", executedAt: now, result: { branch: "filled", field } },
          });
          results.push({ id: item.id, ok: true, action: "field_check_pass" });
        } else {
          // Notifica admin (dedupe: só 1x a cada 6h pra esse lead+campo)
          const recentNotif = await prisma.notification.findFirst({
            where: {
              type: "field_check_waiting",
              createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
              data: { path: ["leadId"], equals: lead.id },
            },
          });
          if (!recentNotif) {
            const recipients = await prisma.user.findMany({
              where: { role: { in: ["ADMIN", "MANAGER"] } },
              select: { id: true },
            });
            for (const u of recipients) {
              await prisma.notification.create({
                data: {
                  userId: u.id,
                  type: "field_check_waiting",
                  title: `Fluxo pausado: preencha "${field}" do lead ${lead.name}`,
                  body: `O fluxo "${item.execution.flow.name}" está esperando o campo "${field}" ser preenchido em "Dados do serviço" antes de continuar.`,
                  data: { leadId: lead.id, field, executionId: item.executionId },
                },
              });
            }
          }
          // Reagenda esse step pra 1h depois (mantém pending)
          const nextRetry = new Date(Date.now() + 60 * 60 * 1000);
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { scheduledAt: nextRetry, result: { reason: "waiting_field", field } },
          });
          // Também empurra todos os steps posteriores pra manter cadência
          await prisma.flowStepExecution.updateMany({
            where: {
              executionId: item.executionId,
              status: "pending",
              order: { gt: item.order },
            },
            data: { scheduledAt: { /* sentinel */ } as any },
          }).catch(() => {});
          // Empurrada acima não funciona em Prisma — fazer manual
          const downstream = await prisma.flowStepExecution.findMany({
            where: {
              executionId: item.executionId,
              status: "pending",
              order: { gt: item.order },
            },
            select: { id: true, scheduledAt: true },
          });
          for (const d of downstream) {
            await prisma.flowStepExecution.update({
              where: { id: d.id },
              data: { scheduledAt: new Date(d.scheduledAt.getTime() + 60 * 60 * 1000) },
            });
          }
          results.push({ id: item.id, ok: false, action: "field_check_wait" });
        }
      } else if (action === "set_loss_reason") {
        // Marca o lead como PERDIDO + grava motivo. Move pra estágio "Perdido"
        // do pipeline do leadService se existir.
        const reason = String(config.reason || "").trim() || "Motivo não especificado";
        const lostStageHint = "perdido";

        if (leadService) {
          const ls = await prisma.leadService.findUnique({
            where: { id: leadService.id },
            include: { stage: { include: { pipeline: true } } },
          });
          if (ls?.stage) {
            const lostStage = await prisma.pipelineStage.findFirst({
              where: {
                pipelineId: ls.stage.pipelineId,
                name: { contains: lostStageHint, mode: "insensitive" },
              },
            });
            if (lostStage && lostStage.id !== ls.stageId) {
              await prisma.leadService.update({
                where: { id: ls.id },
                data: { stageId: lostStage.id },
              });
              await resolveWaitStageChanges(ls.id, lostStage.id);
            }
          }
        }

        // Append motivo nos notes (mesmo pattern do button-handler mark_lost)
        const leadFull = await prisma.lead.findUnique({
          where: { id: lead.id },
          select: { notes: true },
        });
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "PERDIDO",
            notes: `${leadFull?.notes ? leadFull.notes + "\n" : ""}Motivo da perda: ${reason}`,
          },
        });
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now, result: { reason } },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "button_clicked") {
        // Detecta qual botão o lead clicou após o último template enviado
        // e executa as ações da branch correspondente. Configuração:
        //   { branches: [{ buttonId: "x", actions: [...] }, ...] }
        //   branches pode incluir { buttonId: "_none", actions: [...] } pra
        //   leads que não clicaram em nada (botão ID começa com "_").
        const branches = (config.branches || []) as Array<{
          buttonId: string;
          actions: any[];
          terminate?: boolean;
          label?: string;
        }>;

        // Busca o último botão clicado pelo lead (depois do início desta exec)
        const lastButton = await prisma.message.findFirst({
          where: {
            conversation: { leadId: lead.id },
            sender: "LEAD",
            createdAt: { gte: item.execution.startedAt },
            // No webhook a gente salva como conteúdo "[Botão clicado: xxx]"
            // ou similar. Mais robusto: filtrar por content contendo o
            // marker e parsear.
            content: { contains: "[Botão" },
          },
          orderBy: { createdAt: "desc" },
          select: { content: true },
        });

        // Extrai o buttonId do content. Formato esperado:
        //   "[Botão clicado: gmn_t2b_yes] Sim, quero receber"
        // ou simplesmente o ID puro se outro extrator usou.
        let clickedButtonId: string | null = null;
        if (lastButton) {
          const m = lastButton.content.match(/\[Botão[^:]*:\s*([a-zA-Z0-9_-]+)\]/);
          if (m) clickedButtonId = m[1];
        }

        const matchedBranch = clickedButtonId
          ? branches.find((b) => b.buttonId === clickedButtonId)
          : branches.find((b) => b.buttonId === "_none");

        if (!matchedBranch) {
          // Sem branch matching e sem _none configurado → continua o fluxo
          // (execução do passo é só "no-op": o lead não clicou em nada
          // configurado, segue pro próximo passo). Antes era "skipped" o
          // que parecia erro; agora "executed" deixa claro que rolou.
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: { status: "executed", executedAt: now, result: { branch: "no_match_continue", clickedButtonId } },
          });
          results.push({ id: item.id, ok: true, action: "button_continue" });
        } else {
          // Reusa o button-handler pra executar as ações (mesma estrutura
          // de actions: trigger_template, move_stage_by_name, mark_lost,
          // notify_team, create_task)
          const { runButtonActions } = await import("./button-handler-actions");
          await runButtonActions(lead.id, matchedBranch.actions || []);
          await prisma.flowStepExecution.update({
            where: { id: item.id },
            data: {
              status: "executed",
              executedAt: now,
              result: { branch: clickedButtonId || "_none", actionsCount: (matchedBranch.actions || []).length },
            },
          });

          // Se branch tem `terminate: true`, para o fluxo aqui — marca
          // todos os steps pendentes como skipped. Útil pra branches de
          // "Sim"/"Não" que finalizam a decisão (o resto do fluxo é só
          // pro caminho "Não clicou").
          if (matchedBranch.terminate) {
            await prisma.flowStepExecution.updateMany({
              where: { executionId: item.executionId, status: "pending" },
              data: { status: "skipped", executedAt: now, result: { reason: "branch_terminated", branch: clickedButtonId || "_none" } },
            });
            await prisma.flowExecution.update({
              where: { id: item.executionId },
              data: { status: "stopped", completedAt: now },
            });
          }

          results.push({ id: item.id, ok: true, action: `button:${clickedButtonId || "_none"}${matchedBranch.terminate ? "_terminated" : ""}` });
        }
      } else {
        // Tipo desconhecido — skip
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "skipped", executedAt: now, result: { reason: "unknown_action" } },
        });
        results.push({ id: item.id, ok: false, action: "unknown" });
      }
    } catch (err: any) {
      await prisma.flowStepExecution.update({
        where: { id: item.id },
        data: { status: "failed", executedAt: now, result: { error: String(err?.message || err) } },
      });
      results.push({ id: item.id, ok: false, action });
    }
  }

  // Marca executions concluídas quando todos os steps estão != pending
  const runningExecutions = due.map((d) => d.executionId);
  for (const execId of new Set(runningExecutions)) {
    const pending = await prisma.flowStepExecution.count({
      where: { executionId: execId, status: "pending" },
    });
    if (pending === 0) {
      await prisma.flowExecution.update({
        where: { id: execId },
        data: { status: "completed", completedAt: new Date() },
      });
    }
  }

  return results;
}

/**
 * Quando o leadService entra num estágio, resolve todos os steps de
 * wait_stage_change pendentes que tinham esse stage como alvo — força
 * eles a executar AGORA, sem esperar o polling de 15min.
 *
 * Também recolhe a cadência: se ainda existirem steps subsequentes
 * empurrados pela espera, traz eles de volta pro horário relativo
 * a "agora" (pra não esperar 24h adicional quando a admin moveu o
 * lead manualmente bem antes do prazo).
 *
 * Deve ser chamado em todo lugar que atualiza LeadService.stageId.
 */
export async function resolveWaitStageChanges(
  leadServiceId: string,
  newStageId: string,
) {
  // Acha steps wait_stage_change pendentes pro leadService que casam o stage
  const pendingWaits = await prisma.flowStepExecution.findMany({
    where: {
      status: "pending",
      execution: { leadServiceId },
      step: { actionType: "wait_stage_change" },
    },
    include: { step: true, execution: { select: { id: true } } },
  });

  const now = new Date();
  for (const wait of pendingWaits) {
    const cfg = (wait.step.actionConfig || {}) as any;
    if (cfg.stageId !== newStageId) continue;

    // Marca esse wait como executado
    await prisma.flowStepExecution.update({
      where: { id: wait.id },
      data: { status: "executed", executedAt: now, result: { branch: "stage_matched_responsive" } },
    });

    // Recolhe a cadência: traz os steps subsequentes pra perto do "agora"
    // mantendo o offset relativo entre eles. Sem isso, se a espera foi
    // longa (vários polls), os steps seguintes ficam horas/dias no futuro
    // por causa dos empurrões acumulados.
    const downstream = await prisma.flowStepExecution.findMany({
      where: {
        executionId: wait.executionId,
        status: "pending",
        order: { gt: wait.order },
      },
      orderBy: { order: "asc" },
    });
    if (downstream.length === 0) continue;
    // Primeiro step subsequente passa pra "now", e os demais mantém o
    // offset relativo ao primeiro. Sem isso, se a espera foi longa (vários
    // polls de 15min), os steps seguintes ficariam horas/dias no futuro.
    const firstScheduled = downstream[0].scheduledAt.getTime();
    for (const d of downstream) {
      const relativeMs = d.scheduledAt.getTime() - firstScheduled;
      await prisma.flowStepExecution.update({
        where: { id: d.id },
        data: { scheduledAt: new Date(now.getTime() + relativeMs) },
      });
    }
  }
}

function matchesCondition(condition: Record<string, any> | null, ctx: Record<string, any>): boolean {
  if (!condition) return true;
  for (const [key, expected] of Object.entries(condition)) {
    if (ctx[key] !== expected) return false;
  }
  return true;
}
