import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";

export async function GET(request: NextRequest) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId é obrigatório" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sentByUser: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// Send message as agent
export async function POST(request: NextRequest) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { conversationId, content } = body;

  if (!conversationId || !content) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { lead: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  // Save message
  const message = await prisma.message.create({
    data: {
      conversationId,
      content,
      sender: "AGENT",
      sentByUserId: (session.user as any).id,
    },
  });

  // Send via WhatsApp
  const msgId = await sendWhatsAppMessage(conversation.lead.phone, content);

  if (msgId) {
    await prisma.message.update({
      where: { id: message.id },
      data: { evolutionMsgId: msgId },
    });
  }

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
