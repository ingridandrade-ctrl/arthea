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
    orderBy: [{ section: "asc" }, { phase: "asc" }, { order: "asc" }],
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
  const { title, description, kind, section, phase } = body as any;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  const effectiveSection = section === "ONGOING" ? "ONGOING" : "ONBOARDING";
  const effectivePhase = effectiveSection === "ONGOING" ? 1 : phase || 1;

  // Calcula o próximo `order` dentro do bucket (seção + fase no Onboarding; só seção no Ongoing)
  const lastInBucket = await prisma.serviceDeliverableTemplate.findFirst({
    where:
      effectiveSection === "ONGOING"
        ? { serviceId: params.id, section: "ONGOING" }
        : { serviceId: params.id, section: "ONBOARDING", phase: effectivePhase },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const created = await prisma.serviceDeliverableTemplate.create({
    data: {
      serviceId: params.id,
      title,
      description: description || null,
      kind: kind || "DOCUMENT",
      section: effectiveSection,
      phase: effectivePhase,
      order: (lastInBucket?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(created);
}
