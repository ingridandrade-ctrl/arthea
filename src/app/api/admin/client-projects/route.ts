import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const projects = await prisma.clientProject.findMany({
    include: {
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { deliverables: true, accesses: true, references: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    name,
    description,
    startDate,
    endDate,
    currentPhase,
    accentColor,
    logoUrl,
    // Client user
    clientId,
    clientName,
    clientEmail,
    clientPassword,
  } = body;

  if (!name) return NextResponse.json({ error: "Nome do projeto obrigatório" }, { status: 400 });

  // Resolve / create client user
  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    if (!clientEmail || !clientName) {
      return NextResponse.json({ error: "Informe um cliente existente ou nome+email para criar." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (existing) {
      resolvedClientId = existing.id;
    } else {
      if (!clientPassword) {
        return NextResponse.json({ error: "Senha inicial obrigatória ao criar cliente novo." }, { status: 400 });
      }
      const hash = await bcryptjs.hash(clientPassword, 10);
      const user = await prisma.user.create({
        data: {
          name: clientName,
          email: clientEmail,
          password: hash,
          role: "CLIENT",
        },
      });
      resolvedClientId = user.id;
    }
  }

  // One project per client
  const existingProject = await prisma.clientProject.findUnique({ where: { clientId: resolvedClientId } });
  if (existingProject) {
    return NextResponse.json({ error: "Esse cliente já tem um projeto." }, { status: 409 });
  }

  const project = await prisma.clientProject.create({
    data: {
      name,
      clientId: resolvedClientId,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      currentPhase: currentPhase ?? 1,
      accentColor: accentColor || "#1D7070",
      logoUrl: logoUrl || null,
    },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(project, { status: 201 });
}
