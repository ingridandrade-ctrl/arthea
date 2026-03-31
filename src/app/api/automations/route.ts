import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const automations = await prisma.automation.findMany({
    include: {
      logs: { orderBy: { executedAt: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(automations);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    description,
    trigger,
    triggerConfig,
    action,
    actionConfig,
  } = body;

  if (!name || !trigger || !action) {
    return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 });
  }

  const automation = await prisma.automation.create({
    data: {
      name,
      description,
      trigger,
      triggerConfig: triggerConfig || {},
      action,
      actionConfig: actionConfig || {},
    },
  });

  return NextResponse.json(automation, { status: 201 });
}
