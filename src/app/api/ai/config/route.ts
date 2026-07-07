import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT, HANDOFF_KEYWORDS } from "@/lib/chatbot/prompts";

const DEFAULT_ID = "default";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let config = await prisma.aiConfig.findUnique({ where: { id: DEFAULT_ID } });

  if (!config) {
    config = {
      id: DEFAULT_ID,
      model: "claude-sonnet-4-20250514",
      maxTokens: 1024,
      systemPrompt: SYSTEM_PROMPT,
      handoffKeywords: HANDOFF_KEYWORDS,
      botName: "Arthea IA",
      active: true,
      updatedAt: new Date(),
    };
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { model, maxTokens, systemPrompt, handoffKeywords, botName, active } = body;

  const data: any = {};
  if (model !== undefined) data.model = model;
  if (maxTokens !== undefined) data.maxTokens = maxTokens;
  if (systemPrompt !== undefined) data.systemPrompt = systemPrompt;
  if (handoffKeywords !== undefined) data.handoffKeywords = handoffKeywords;
  if (botName !== undefined) data.botName = botName;
  if (active !== undefined) data.active = active;

  const config = await prisma.aiConfig.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      model: model || "claude-sonnet-4-20250514",
      maxTokens: maxTokens || 1024,
      systemPrompt: systemPrompt || SYSTEM_PROMPT,
      handoffKeywords: handoffKeywords || HANDOFF_KEYWORDS,
      botName: botName || "Arthea IA",
      active: active ?? true,
    },
    update: data,
  });

  return NextResponse.json(config);
}
