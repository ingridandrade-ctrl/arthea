import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runEventAutomations } from "@/lib/automations/engine";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const where: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    where.service = { slug: serviceSlug };
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      lead: true,
      service: true,
      stage: true,
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, value, leadId, serviceId, stageId, assignedToId } = body;

  if (!title || !leadId || !serviceId || !stageId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: { title, value, leadId, serviceId, stageId, assignedToId },
    include: { lead: true, service: true, stage: true, assignedTo: true },
  });

  return NextResponse.json(deal, { status: 201 });
}
