import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";

const HANDOFF_MESSAGE =
  "Vou te conectar com um dos nossos especialistas que pode te ajudar melhor com isso! 😊 Aguarde um momento, por favor.";

export async function performHandoff(
  conversationId: string,
  phone: string
): Promise<void> {
  // 1. Mark conversation as human-handled
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isAiActive: false },
  });

  // 2. Save handoff message
  await prisma.message.create({
    data: {
      conversationId,
      content: HANDOFF_MESSAGE,
      sender: "AI",
    },
  });

  // 3. Send handoff message to lead
  await sendWhatsAppMessage(phone, HANDOFF_MESSAGE);
}

export async function reactivateAi(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isAiActive: true },
  });
}
