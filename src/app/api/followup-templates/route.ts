import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const templates = await prisma.followUpTemplate.findMany({
    orderBy: [{ stageOrder: "asc" }, { followUpOrder: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    stageOrder,
    followUpOrder,
    channel,
    messageTemplate,
    isAutomatic,
  } = body;

  if (!name || stageOrder === undefined || !followUpOrder || !messageTemplate) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const template = await prisma.followUpTemplate.create({
    data: {
      name,
      stageOrder,
      followUpOrder,
      channel: channel || "whatsapp",
      messageTemplate,
      isAutomatic: isAutomatic || false,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
