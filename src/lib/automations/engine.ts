import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { AutomationTrigger } from "@prisma/client";

interface EventContext {
  leadServiceId?: string;
  leadId: string;
  fromStageId?: string;
  toStageId?: string;
}

export async function runEventAutomations(
  trigger: AutomationTrigger,
  context: EventContext
) {
  const automations = await prisma.automation.findMany({
    where: {
      trigger,
      isActive: true,
    },
  });

  for (const automation of automations) {
    try {
      const config = automation.triggerConfig as any;

      if (trigger === "STAGE_CHANGE") {
        if (config.toStageId && config.toStageId !== context.toStageId) continue;
        if (config.fromStageId && config.fromStageId !== context.fromStageId) continue;
      }

      await executeAction(automation, context.leadId);
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error);
      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          leadId: context.leadId,
          status: "failed",
          result: { error: String(error) },
        },
      });
    }
  }
}

export async function runCronAutomations() {
  const now = new Date();

  const timeAutomations = await prisma.automation.findMany({
    where: { trigger: "TIME_AFTER_STAGE", isActive: true },
  });

  for (const automation of timeAutomations) {
    const config = automation.triggerConfig as any;
    const delayMinutes = config.delayMinutes || 60;
    const stageId = config.stageId;

    if (!stageId) continue;

    const threshold = new Date(now.getTime() - delayMinutes * 60 * 1000);

    const leadServices = await prisma.leadService.findMany({
      where: {
        stageId,
        updatedAt: { lt: threshold },
      },
      include: { lead: true },
    });

    for (const ls of leadServices) {
      const recentLog = await prisma.automationLog.findFirst({
        where: {
          automationId: automation.id,
          leadId: ls.leadId,
          executedAt: { gt: threshold },
        },
      });

      if (recentLog) continue;
      await executeAction(automation, ls.leadId);
    }
  }

  const noResponseAutomations = await prisma.automation.findMany({
    where: { trigger: "NO_RESPONSE", isActive: true },
  });

  for (const automation of noResponseAutomations) {
    const config = automation.triggerConfig as any;
    const delayMinutes = config.delayMinutes || 1440;

    const threshold = new Date(now.getTime() - delayMinutes * 60 * 1000);

    const conversations = await prisma.conversation.findMany({
      where: {
        lastMessageAt: { lt: threshold },
        isAiActive: true,
        messages: {
          some: { sender: "AI" },
        },
      },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    for (const conv of conversations) {
      if (conv.messages[0]?.sender !== "AI") continue;

      const recentLog = await prisma.automationLog.findFirst({
        where: {
          automationId: automation.id,
          leadId: conv.leadId,
          executedAt: { gt: threshold },
        },
      });

      if (recentLog) continue;
      await executeAction(automation, conv.leadId);
    }
  }
}

async function executeAction(automation: any, leadId: string) {
  const actionConfig = automation.actionConfig as any;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { services: { include: { service: true } } },
  });

  if (!lead) return;

  const serviceNames = lead.services.map((ls) => ls.service.name).join(", ");

  switch (automation.action) {
    case "SEND_WHATSAPP": {
      const template = actionConfig.template || "";
      const message = template
        .replace(/\{\{nome\}\}/g, lead.name)
        .replace(/\{\{empresa\}\}/g, lead.company || "")
        .replace(/\{\{telefone\}\}/g, lead.phone)
        .replace(/\{\{servico\}\}/g, serviceNames);

      await sendWhatsAppMessage(lead.phone, message);
      break;
    }
    case "MOVE_STAGE": {
      const targetStageId = actionConfig.targetStageId;
      if (targetStageId) {
        await prisma.leadService.updateMany({
          where: { leadId },
          data: { stageId: targetStageId },
        });
      }
      break;
    }
    case "ASSIGN_AGENT":
      break;
    case "CREATE_REMINDER":
      break;
  }

  await prisma.automationLog.create({
    data: {
      automationId: automation.id,
      leadId,
      status: "success",
      result: { action: automation.action, executedAt: new Date().toISOString() },
    },
  });
}
