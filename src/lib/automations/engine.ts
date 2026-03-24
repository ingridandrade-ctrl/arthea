import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { AutomationTrigger } from "@prisma/client";

interface EventContext {
  dealId?: string;
  leadId: string;
  fromStageId?: string;
  toStageId?: string;
  serviceId?: string;
}

export async function runEventAutomations(
  trigger: AutomationTrigger,
  context: EventContext
) {
  const automations = await prisma.automation.findMany({
    where: {
      trigger,
      isActive: true,
      ...(context.serviceId ? { serviceId: context.serviceId } : {}),
    },
  });

  for (const automation of automations) {
    try {
      const config = automation.triggerConfig as any;

      // Check if trigger conditions match
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

  // TIME_AFTER_STAGE automations
  const timeAutomations = await prisma.automation.findMany({
    where: { trigger: "TIME_AFTER_STAGE", isActive: true },
  });

  for (const automation of timeAutomations) {
    const config = automation.triggerConfig as any;
    const delayMinutes = config.delayMinutes || 60;
    const stageId = config.stageId;

    if (!stageId) continue;

    const threshold = new Date(now.getTime() - delayMinutes * 60 * 1000);

    // Find deals in this stage that have been there longer than the delay
    const deals = await prisma.deal.findMany({
      where: {
        stageId,
        updatedAt: { lt: threshold },
        ...(automation.serviceId ? { serviceId: automation.serviceId } : {}),
      },
      include: { lead: true },
    });

    for (const deal of deals) {
      // Check if we already ran this automation for this lead recently
      const recentLog = await prisma.automationLog.findFirst({
        where: {
          automationId: automation.id,
          leadId: deal.leadId,
          executedAt: { gt: threshold },
        },
      });

      if (recentLog) continue;

      await executeAction(automation, deal.leadId);
    }
  }

  // NO_RESPONSE automations
  const noResponseAutomations = await prisma.automation.findMany({
    where: { trigger: "NO_RESPONSE", isActive: true },
  });

  for (const automation of noResponseAutomations) {
    const config = automation.triggerConfig as any;
    const delayMinutes = config.delayMinutes || 1440; // default: 24h

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
      // Only if last message was from AI (lead hasn't responded)
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
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) return;

  switch (automation.action) {
    case "SEND_WHATSAPP": {
      const template = actionConfig.template || "";
      const message = template
        .replace("{{nome}}", lead.name)
        .replace("{{empresa}}", lead.company || "")
        .replace("{{telefone}}", lead.phone);

      await sendWhatsAppMessage(lead.phone, message);
      break;
    }
    case "MOVE_STAGE": {
      const targetStageId = actionConfig.targetStageId;
      if (targetStageId) {
        await prisma.deal.updateMany({
          where: { leadId, serviceId: automation.serviceId },
          data: { stageId: targetStageId },
        });
      }
      break;
    }
    case "ASSIGN_AGENT": {
      // Round-robin assignment
      const agents = await prisma.user.findMany({
        where: { role: { in: ["AGENT", "MANAGER"] } },
        orderBy: { createdAt: "asc" },
      });

      if (agents.length > 0) {
        const lastLog = await prisma.automationLog.findFirst({
          where: { automationId: automation.id, status: "success" },
          orderBy: { executedAt: "desc" },
        });

        let nextIndex = 0;
        if (lastLog?.result && (lastLog.result as any).agentIndex !== undefined) {
          nextIndex = ((lastLog.result as any).agentIndex + 1) % agents.length;
        }

        await prisma.deal.updateMany({
          where: { leadId, serviceId: automation.serviceId },
          data: { assignedToId: agents[nextIndex].id },
        });
      }
      break;
    }
    case "CREATE_REMINDER":
      // Reminders are just logs with a specific type for now
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
