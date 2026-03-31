import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const dealId = searchParams.get("dealId");
  const type = searchParams.get("type");

  const where: any = {};

  if (leadId) {
    where.leadId = leadId;
  }
  if (dealId) {
    where.dealId = dealId;
  }
  if (type) {
    where.type = type;
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { type, description, leadId, dealId, metadata } = body;

  if (!type || !description) {
    return NextResponse.json({ error: "Tipo e descrição são obrigatórios" }, { status: 400 });
  }

  const validTypes = ["note", "call", "email", "meeting", "task_completed", "stage_change"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo de atividade inválido" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      type,
      description,
      leadId: leadId || undefined,
      dealId: dealId || undefined,
      metadata: metadata || undefined,
      userId: (session.user as any).id,
    },
    include: {
      user: true,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
