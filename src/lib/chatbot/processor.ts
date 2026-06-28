import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/anthropic";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { SYSTEM_PROMPT, shouldHandoff } from "./prompts";
import { performHandoff } from "./handoff";
import { scheduleFollowUpsForLeadService } from "@/lib/followups/engine";
import { renderTemplate } from "@/lib/followups/engine";

export async function processIncomingMessage(
  phone: string,
  content: string,
  senderName: string,
  evolutionMsgId: string
) {
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
        status: "ATIVO",
      },
    });
    lead = await prisma.lead.findUnique({
      where: { id: created.id },
      include: { services: { include: { service: true } } },
    })!;

    const firstStage = await prisma.pipelineStage.findFirst({
      where: { order: 0 },
    });
    const defaultService = await prisma.service.findFirst();

    if (firstStage && defaultService && lead) {
      const ls = await prisma.leadService.create({
        data: {
          leadId: lead.id,
          serviceId: defaultService.id,
          stageId: firstStage.id,
        },
      });
      await scheduleFollowUpsForLeadService(ls.id, firstStage.id);
    }
  }

  if (!lead) {
    return { handled: false, reason: "lead_creation_failed" };
  }

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

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      sender: "LEAD",
      evolutionMsgId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // Lead respondeu → cancela fluxos em andamento, move estágio se aplicável,
  // notifica equipe. Não bloqueia o resto do processamento se falhar.
  if (!isNewLead) {
    const { onLeadReplied } = await import("@/lib/flows/lead-replied");
    onLeadReplied({ leadId: lead.id, lastMessage: content }).catch((err) =>
      console.error("onLeadReplied falhou:", err)
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { handled: false, reason: "ai_disabled" };
  }

  if (!conversation.isAiActive) {
    return { handled: false, reason: "human_active" };
  }

  if (shouldHandoff(content)) {
    await performHandoff(conversation.id, lead.phone);
    return { handled: true, reason: "handoff" };
  }

  const pendingFollowUp = await prisma.followUp.findFirst({
    where: {
      leadService: { leadId: lead.id },
      status: "pending",
      isAutomatic: true,
      channel: "whatsapp",
    },
    include: { leadService: { select: { customData: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  if (pendingFollowUp) {
    const serviceNames = lead.services.map((ls) => ls.service.name).join(", ");
    const customData = (pendingFollowUp.leadService.customData || {}) as Record<string, string>;
    const message = renderTemplate(pendingFollowUp.messageTemplate, {
      nome: lead.name,
      servico: serviceNames || "nossos serviços",
      empresa: lead.company || "",
      telefone: lead.phone,
      email: lead.email || "",
      ...customData,
    });

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

    await prisma.followUp.update({
      where: { id: pendingFollowUp.id },
      data: { status: "sent", sentAt: new Date() },
    });

    return { handled: true, reason: "template_response", response: message };
  }

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages = history.map((msg) => ({
    role: (msg.sender === "LEAD" ? "user" : "assistant") as "user" | "assistant",
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

  return { handled: true, reason: "ai_response", response: aiResponse };
}
