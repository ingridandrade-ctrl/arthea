import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendTemplateMessage } from "@/lib/whatsapp-official";
import { renderTemplate } from "@/lib/followups/engine";
import { resolveMetaParams } from "@/lib/templates/meta-conversion";

// Estrutura das actions configuradas em FollowUpTemplate.buttons[].actions:
//   { type: "move_stage_by_name", stageNamePattern: "análise gerada" }
//   { type: "trigger_template", templateId: "..." }
//   { type: "mark_lost", reason: "Sem interesse" }
//   { type: "notify_team", title: "...", body: "..." }
export async function handleButtonClick(opts: {
  leadId: string;
  buttonId: string;
}) {
  // Acha qual template tem esse buttonId
  const templates = await prisma.followUpTemplate.findMany({
    where: { buttons: { not: null as any } },
    select: { id: true, name: true, buttons: true },
  });

  let matched: { templateId: string; button: any } | null = null;
  for (const t of templates) {
    const buttons = (t.buttons as any[]) || [];
    const b = buttons.find((x: any) => x.id === opts.buttonId);
    if (b) {
      matched = { templateId: t.id, button: b };
      break;
    }
  }

  if (!matched) return { handled: false, reason: "button_not_found" };

  const actions = (matched.button.actions || []) as any[];
  const lead = await prisma.lead.findUnique({
    where: { id: opts.leadId },
    include: { services: { include: { service: true, stage: { include: { pipeline: true } } } } },
  });
  if (!lead) return { handled: false, reason: "lead_not_found" };

  const executed: string[] = [];

  for (const action of actions) {
    try {
      if (action.type === "move_stage_by_name") {
        // Move serviço(s) do lead pra estágio cujo nome contém o pattern.
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
            const { triggerFlows } = await import("./engine");
            await triggerFlows({ type: "STAGE_ENTER", leadId: lead.id, leadServiceId: ls.id, stageId: target.id });
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

        // Se o template precisa de linkAnalise e não tem, notifica em vez de mandar mensagem quebrada
        if (tpl.messageTemplate.includes("{{linkAnalise}}") && !variables.linkAnalise) {
          await notifyTeam(`Lead ${lead.name} clicou em "${matched.button.label}"`, `Mas o campo "Link da análise" está vazio. Preencha antes de continuar.`, { leadId: lead.id });
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
        // Move pra estágio "Perdido" + status PERDIDO + grava motivo em notes
        for (const ls of lead.services) {
          if (!ls.stage) continue;
          const lost = await prisma.pipelineStage.findFirst({
            where: { pipelineId: ls.stage.pipelineId, name: { contains: "Perdido", mode: "insensitive" } },
          });
          if (lost) {
            await prisma.leadService.update({ where: { id: ls.id }, data: { stageId: lost.id } });
          }
        }
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "PERDIDO",
            notes: `${lead.notes ? lead.notes + "\n" : ""}Motivo da perda: ${action.reason}`,
          },
        });
        executed.push(`lost:${action.reason}`);
      } else if (action.type === "notify_team") {
        await notifyTeam(action.title || "Lead clicou em botão", action.body || "", { leadId: lead.id });
        executed.push("notified");
      }
    } catch (err) {
      console.error("Erro executando ação do botão:", action, err);
    }
  }

  return { handled: true, button: matched.button.label, executed };
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
