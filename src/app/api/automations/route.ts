import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const where: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    where.service = { slug: serviceSlug };
  }

  const automations = await prisma.automation.findMany({
    where,
    include: {
      service: true,
      logs: { orderBy: { executedAt: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(automations);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    description,
    serviceId,
    trigger,
    triggerConfig,
    action,
    actionConfig,
  } = body;

  if (!name || !trigger || !action) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const automation = await prisma.automation.create({
    data: {
      name,
      description,
      serviceId,
      trigger,
      triggerConfig: triggerConfig || {},
      action,
      actionConfig: actionConfig || {},
    },
    include: { service: true },
  });

  return NextResponse.json(automation, { status: 201 });
}
