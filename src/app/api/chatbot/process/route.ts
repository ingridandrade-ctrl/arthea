import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processIncomingMessage } from "@/lib/chatbot/processor";

export async function POST(request: NextRequest) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { phone, content, senderName } = body;

  if (!phone || !content) {
    return NextResponse.json(
      { error: "Telefone e conteúdo são obrigatórios" },
      { status: 400 }
    );
  }

  const result = await processIncomingMessage(
    phone,
    content,
    senderName || "Usuário",
    `manual-${Date.now()}`
  );

  return NextResponse.json(result);
}
