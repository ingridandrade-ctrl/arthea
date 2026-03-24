import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/anthropic";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { SYSTEM_PROMPT, shouldHandoff } from "./prompts";
import { performHandoff } from "./handoff";

export async function processIncomingMessage(
  phone: string,
  content: string,
  senderName: string,
  evolutionMsgId: string
) {
  // 1. Find or create lead
  let lead = await prisma.lead.findUnique({ where: { phone } });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        name: senderName,
        phone,
        source: "WHATSAPP",
        status: "NEW",
      },
    });
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

  // 6. Load conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Build messages array for Claude
  const messages = history.map((msg) => ({
    role: (msg.sender === "LEAD" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: msg.content,
  }));

  // 7. Generate AI response
  const aiResponse = await generateChatResponse(SYSTEM_PROMPT, messages);

  // 8. Save AI response
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: aiResponse,
      sender: "AI",
    },
  });

  // 9. Send via WhatsApp
  const msgId = await sendWhatsAppMessage(phone, aiResponse);

  if (msgId) {
    // Update message with evolution ID
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        sender: "AI",
        evolutionMsgId: null,
      },
      data: { evolutionMsgId: msgId },
    });
  }

  // 10. Update lead status if still NEW
  if (lead.status === "NEW") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    });
  }

  return { handled: true, reason: "ai_response", response: aiResponse };
}
