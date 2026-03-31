import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/anthropic";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { SYSTEM_PROMPT, shouldHandoff } from "./prompts";
import { performHandoff } from "./handoff";
import { scheduleFollowUpsForDeal } from "@/lib/followups/engine";
import { renderTemplate } from "@/lib/followups/engine";

export async function processIncomingMessage(
  phone: string,
  content: string,
  senderName: string,
  evolutionMsgId: string
) {
  // 1. Find or create lead
  let lead = await prisma.lead.findUnique({
    where: { phone },
    include: { services: { include: { service: true } } },
  });

  let isNewLead = false;

  if (!lead) {
    isNewLead = true;
    const created = await prisma.lead.create({
      data: {
        name: senderName,
        phone,
        source: "WHATSAPP",
        status: "NEW",
      },
    });
    lead = await prisma.lead.findUnique({
      where: { id: created.id },
      include: { services: { include: { service: true } } },
    })!;

    // Create deal in "Novo Lead" stage
    const firstStage = await prisma.pipelineStage.findFirst({
      where: { order: 0 },
    });
    const defaultService = await prisma.service.findFirst();

    if (firstStage && defaultService && lead) {
      const deal = await prisma.deal.create({
        data: {
          title: `Novo - ${senderName}`,
          leadId: lead.id,
          serviceId: defaultService.id,
          stageId: firstStage.id,
        },
      });
      // Schedule follow-ups for new lead stage
      await scheduleFollowUpsForDeal(deal.id, firstStage.id);
    }
  }

  if (!lead) {
    return { handled: false, reason: "lead_creation_failed" };
  }

  // 2. Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        isAiActive: true,
      },
    });
  }

  // 3. Save incoming message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      sender: "LEAD",
      evolutionMsgId,
    },
  });

  // Update last message timestamp
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // 4. If AI is not active (human took over), skip AI processing
  if (!conversation.isAiActive) {
    return { handled: false, reason: "human_active" };
  }

  // 5. Check if handoff is needed
  if (shouldHandoff(content)) {
    await performHandoff(conversation.id, lead.phone);
    return { handled: true, reason: "handoff" };
  }

  // 6. Check for pending follow-up template to use instead of AI
  const pendingFollowUp = await prisma.followUp.findFirst({
    where: {
      deal: { leadId: lead.id },
      status: "pending",
      isAutomatic: true,
      channel: "whatsapp",
    },
    orderBy: { scheduledAt: "asc" },
  });

  if (pendingFollowUp) {
    // Use the template instead of calling AI (saves credits)
    const serviceNames = lead.services.map((ls) => ls.service.name).join(", ");
    const message = renderTemplate(pendingFollowUp.messageTemplate, {
      nome: lead.name,
      servico: serviceNames || "nossos serviços",
      empresa: lead.company || "",
      telefone: lead.phone,
      email: lead.email || "",
    });

    // Save and send
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        sender: "AI",
      },
    });

    const msgId = await sendWhatsAppMessage(phone, message);
    if (msgId) {
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          sender: "AI",
          evolutionMsgId: null,
        },
        data: { evolutionMsgId: msgId },
      });
    }

    // Mark follow-up as sent
    await prisma.followUp.update({
      where: { id: pendingFollowUp.id },
      data: { status: "sent", sentAt: new Date() },
    });

    // Update lead status
    if (lead.status === "NEW") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "CONTACTED" },
      });
    }

    return { handled: true, reason: "template_response", response: message };
  }

  // 7. No template available — use AI
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages = history.map((msg) => ({
    role: (msg.sender === "LEAD" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: msg.content,
  }));

  const aiResponse = await generateChatResponse(SYSTEM_PROMPT, messages);

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: aiResponse,
      sender: "AI",
    },
  });

  const msgId = await sendWhatsAppMessage(phone, aiResponse);

  if (msgId) {
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        sender: "AI",
        evolutionMsgId: null,
      },
      data: { evolutionMsgId: msgId },
    });
  }

  if (lead.status === "NEW") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    });
  }

  return { handled: true, reason: "ai_response", response: aiResponse };
}
