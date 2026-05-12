import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagements = await prisma.clientEngagement.findMany({
    include: {
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { deliverables: true, accesses: true, references: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(engagements);
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
    totalPhases,
    accentColor,
    logoUrl,
    type,
    slug,
    // Client user
    clientId,
    clientName,
    clientEmail,
    clientPassword,
  } = body;

  if (!name) return NextResponse.json({ error: "Nome do engagement obrigatório" }, { status: 400 });

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

  const resolvedSlug =
    (slug as string | undefined)?.trim() ||
    name
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) ||
    "principal";

  // Engagement único por (clientId, slug)
  const existingEngagement = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: resolvedClientId, slug: resolvedSlug } },
  });
  if (existingEngagement) {
    return NextResponse.json(
      { error: `Esse cliente já tem um engagement com slug "${resolvedSlug}".` },
      { status: 409 },
    );
  }

  const engagement = await prisma.clientEngagement.create({
    data: {
      name,
      slug: resolvedSlug,
      type: type ?? "STRATEGY",
      clientId: resolvedClientId,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      currentPhase: currentPhase ?? 1,
      totalPhases: totalPhases ?? 4,
      accentColor: accentColor || "#1D7070",
      logoUrl: logoUrl || null,
    },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(engagement, { status: 201 });
}
