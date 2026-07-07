import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET  /api/portal/dashboard-config?engagementId=X
// PUT  /api/portal/dashboard-config  { engagementId, customMetrics, defaultDateRange, comparePeriod }
//
// customMetrics: array de strings (ids de MetricDef) — máximo 12 pra não
// bagunçar a UI.

const MAX_CUSTOM = 12;

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const engagementId = req.nextUrl.searchParams.get("engagementId");
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId obrigatório" }, { status: 400 });
  }

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: engagementId },
    select: { id: true, clientId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });

  const role = session.user?.role;
  const isAdmin = role === "ADMIN" || role === "MANAGER";
  const isOwner = engagement.clientId === session.user?.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const config = await prisma.clientDashboardConfig.findUnique({
    where: { engagementId },
  });

  return NextResponse.json(
    config || {
      engagementId,
      customMetrics: [],
      defaultDateRange: "last_30d",
      comparePeriod: "previous",
    },
  );
}

export async function PUT(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { engagementId, customMetrics, defaultDateRange, comparePeriod } = body as any;
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId obrigatório" }, { status: 400 });
  }

  // Sanitização — só aceita array de strings, com limite
  const metrics: string[] = Array.isArray(customMetrics)
    ? customMetrics.filter((m) => typeof m === "string").slice(0, MAX_CUSTOM)
    : [];

  const config = await prisma.clientDashboardConfig.upsert({
    where: { engagementId },
    create: {
      engagementId,
      customMetrics: metrics,
      defaultDateRange: defaultDateRange || "last_30d",
      comparePeriod: comparePeriod || "previous",
    },
    update: {
      customMetrics: metrics,
      ...(defaultDateRange && { defaultDateRange }),
      ...(comparePeriod && { comparePeriod }),
    },
  });

  return NextResponse.json(config);
}
