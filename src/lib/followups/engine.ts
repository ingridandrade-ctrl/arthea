import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";

/**
 * Schedule follow-ups for a deal based on its current stage.
 * Uses FollowUpTemplate records to create FollowUp instances.
 */
export async function scheduleFollowUpsForDeal(
  dealId: string,
  stageId: string
) {
  const stage = await prisma.pipelineStage.findUnique({
    where: { id: stageId },
  });
  if (!stage) return;

  // Get active templates for this stage
  const templates = await prisma.followUpTemplate.findMany({
    where: { stageOrder: stage.order, isActive: true },
    orderBy: { followUpOrder: "asc" },
  });

  const now = new Date();

  for (const template of templates) {
    // Check if a follow-up already exists for this deal/stage/order
    const existing = await prisma.followUp.findFirst({
      where: {
        dealId,
        stageId,
        order: template.followUpOrder,
        status: "pending",
      },
    });
    if (existing) continue;

    const delayHours = getDelayHours(template.stageOrder, template.followUpOrder);
    const scheduledAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

    await prisma.followUp.create({
      data: {
        dealId,
        stageId,
        order: template.followUpOrder,
        delayHours,
        messageTemplate: template.messageTemplate,
        channel: template.channel,
        isAutomatic: template.isAutomatic,
        status: "pending",
        scheduledAt,
      },
    });
  }
}

/**
 * Cancel all pending follow-ups for a deal in a specific stage.
 */
export async function cancelPendingFollowUps(
  dealId: string,
  stageId: string
) {
  await prisma.followUp.updateMany({
    where: { dealId, stageId, status: "pending" },
    data: { status: "skipped" },
  });
}

/**
 * Process due follow-ups — called by cron every 5 minutes.
 */
export async function processDueFollowUps() {
  const now = new Date();

  const dueFollowUps = await prisma.followUp.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: {
      deal: {
        include: {
          lead: { include: { services: { include: { service: true } } } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  });

  const results: { id: string; action: string }[] = [];

  for (const followUp of dueFollowUps) {
    const lead = followUp.deal.lead;
    const serviceNames = lead.services.map((ls) => ls.service.name).join(", ");

    const message = renderTemplate(followUp.messageTemplate, {
      nome: lead.name,
      servico: serviceNames || "nossos serviços",
      empresa: lead.company || "",
      telefone: lead.phone,
      email: lead.email || "",
    });

    if (followUp.isAutomatic && followUp.channel === "whatsapp") {
      // Send automatically via WhatsApp
      await sendWhatsAppMessage(lead.phone, message);

      // Save message in conversation
      let conversation = await prisma.conversation.findFirst({
        where: { leadId: lead.id },
        orderBy: { createdAt: "desc" },
      });

      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            content: message,
            sender: "AI",
          },
        });
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: now },
        });
      }

      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { status: "sent", sentAt: now },
      });

      results.push({ id: followUp.id, action: "sent_whatsapp" });
    } else {
      // Internal reminder — create a notification for the assigned agent
      const assignedToId = followUp.deal.assignedToId;
      if (assignedToId) {
        await prisma.notification.create({
          data: {
            type: "followup_due",
            title: `Follow-up: ${lead.name}`,
            body: message,
            userId: assignedToId,
            data: {
              dealId: followUp.dealId,
              leadId: lead.id,
              followUpId: followUp.id,
            },
          },
        });
      }

      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { status: "sent", sentAt: now },
      });

      results.push({ id: followUp.id, action: "created_reminder" });
    }
  }

  return results;
}

/**
 * Render a template string replacing {{variable}} placeholders.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/**
 * Get delay hours for a follow-up based on stage + order.
 */
function getDelayHours(stageOrder: number, followUpOrder: number): number {
  const delays: Record<string, number> = {
    "0-1": 0,
    "0-2": 0,
    "0-3": 24,
    "1-1": 48,
    "1-2": 120,
    "2-1": 24,
    "3-1": 24,
    "3-2": 72,
    "3-3": 168,
    "3-4": 336,
    "4-1": 48,
    "4-2": 120,
    "6-1": 720,
    "6-2": 1440,
    "6-3": 2160,
  };
  return delays[`${stageOrder}-${followUpOrder}`] || 24;
}
