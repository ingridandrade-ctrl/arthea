import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/services/[id]/templates — lista templates de entregáveis do serviço
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const templates = await prisma.serviceDeliverableTemplate.findMany({
    where: { serviceId: params.id },
    orderBy: [{ phase: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(templates);
}

// POST /api/services/[id]/templates — cria template novo
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, kind, phase } = body as any;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  // Calcula o próximo `order` dentro da fase
  const lastInPhase = await prisma.serviceDeliverableTemplate.findFirst({
    where: { serviceId: params.id, phase: phase || 1 },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const created = await prisma.serviceDeliverableTemplate.create({
    data: {
      serviceId: params.id,
      title,
      description: description || null,
      kind: kind || "DOCUMENT",
      phase: phase || 1,
      order: (lastInPhase?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(created);
}
