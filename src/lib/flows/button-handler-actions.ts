import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendTemplateMessage } from "@/lib/whatsapp-official";
import { renderTemplate } from "@/lib/followups/engine";
import { resolveMetaParams } from "@/lib/templates/meta-conversion";

/**
 * Executa uma lista de ações configuradas (move_stage_by_name,
 * trigger_template, mark_lost, notify_team) pra um lead.
 *
 * Reutilizado em 2 lugares:
 *   - button-handler.ts (botão clicado no WhatsApp dispara ações inline)
 *   - engine.ts handler do nó button_clicked (mesma coisa, dentro de um fluxo)
 */
export async function runButtonActions(
  leadId: string,
  actions: any[],
): Promise<string[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      services: { include: { service: true, stage: { include: { pipeline: true } } } },
    },
  });
  if (!lead) return [];

  const executed: string[] = [];

  for (const action of actions || []) {
    try {
      if (action.type === "move_stage_by_name") {
        const pattern = typeof action.stageNamePattern === "string" ? action.stageNamePattern : "";
        if (!pattern) continue;
        for (const ls of lead.services) {
          if (!ls.stage) continue;
          const target = await prisma.pipelineStage.findFirst({
            where: {
              pipelineId: ls.stage.pipelineId,
              name: { contains: pattern, mode: "insensitive" },
            },
          });
          if (target && target.id !== ls.stageId) {
            await prisma.leadService.update({ where: { id: ls.id }, data: { stageId: target.id } });
            const { triggerFlows, resolveWaitStageChanges } = await import("./engine");
            await triggerFlows({
              type: "STAGE_ENTER",
              leadId: lead.id,
              leadServiceId: ls.id,
              stageId: target.id,
            });
            await resolveWaitStageChanges(ls.id, target.id);
            executed.push(`move:${target.name}`);
          }
        }
      } else if (action.type === "trigger_template") {
        if (!action.templateId || typeof action.templateId !== "string") continue;
        const tpl = await prisma.followUpTemplate.findUnique({ where: { id: action.templateId } });
        if (!tpl || !tpl.isActive) continue;

        const ls = lead.services[0];
        const customData = (ls?.customData as Record<string, any>) || {};
        const variables: Record<string, string> = {
          nome: lead.name,
          servico: ls?.service?.name || "",
          empresa: lead.company || "",
          telefone: lead.phone,
          email: lead.email || "",
          ...customData,
        };

        if (tpl.messageTemplate.includes("{{linkAnalise}}") && !variables.linkAnalise) {
          await notifyTeam(
            `Lead ${lead.name}: ação do botão pediu template com {{linkAnalise}}`,
            `Mas o campo "Link da análise" está vazio. Preencha antes de continuar.`,
            { leadId: lead.id },
          );
          executed.push("notified:missing_link");
          continue;
        }

        const message = renderTemplate(tpl.messageTemplate, variables);

        if (tpl.metaStatus === "APPROVED" && tpl.metaName) {
          const params = resolveMetaParams((tpl.metaParamOrder as string[]) || [], variables);
          await sendTemplateMessage(lead.phone, tpl.metaName, "pt_BR", [
            { type: "body", parameters: params.map((p) => ({ type: "text", text: p })) },
          ]);
        } else {
          await sendWhatsAppMessage(lead.phone, message);
        }
        executed.push(`sent:${tpl.name}`);
      } else if (action.type === "mark_lost") {
        for (const ls of lead.services) {
          if (!ls.stage) continue;
          const lost = await prisma.pipelineStage.findFirst({
            where: { pipelineId: ls.stage.pipelineId, name: { contains: "Perdido", mode: "insensitive" } },
          });
          if (lost) {
            await prisma.leadService.update({ where: { id: ls.id }, data: { stageId: lost.id } });
          }
        }
        const leadFresh = await prisma.lead.findUnique({ where: { id: lead.id }, select: { notes: true } });
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "PERDIDO",
            notes: `${leadFresh?.notes ? leadFresh.notes + "\n" : ""}Motivo da perda: ${action.reason || "não informado"}`,
          },
        });
        executed.push(`lost:${action.reason || ""}`);
      } else if (action.type === "notify_team") {
        await notifyTeam(action.title || "Ação do fluxo", action.body || "", { leadId: lead.id });
        executed.push("notified");
      } else if (action.type === "create_task") {
        // Cria task pendente pra equipe — renderiza {{nome}}/{{empresa}}/etc
        // no título/descrição.
        const variables: Record<string, string> = {
          nome: lead.name,
          empresa: lead.company || "",
          telefone: lead.phone,
          email: lead.email || "",
        };
        const interpolate = (s: string) =>
          s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => variables[k] || "");
        await prisma.task.create({
          data: {
            title: interpolate(String(action.title || "Tarefa do botão")),
            description: action.description ? interpolate(String(action.description)) : null,
            priority: (action.priority as string) || "medium",
            leadId: lead.id,
            leadServiceId: lead.services[0]?.id,
            dueDate: new Date(),
          },
        });
        executed.push("task_created");
      }
    } catch (err) {
      console.error("runButtonActions: erro executando ação:", action, err);
    }
  }

  return executed;
}

async function notifyTeam(title: string, body: string, data: any) {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    select: { id: true },
  });
  for (const u of users) {
    await prisma.notification.create({
      data: { userId: u.id, type: "button_click", title, body, data },
    });
  }
}
