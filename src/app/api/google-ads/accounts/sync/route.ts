import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAccessibleCustomers } from "@/lib/google-ads/api";

// POST /api/google-ads/accounts/sync
//
// Lista as contas acessíveis pelo MCC configurado e dá upsert na tabela
// GoogleAdsAccount. Não toca em engagementId (preserva linkagens já feitas).
export async function POST(_req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const userId = session.user?.id as string;

  const conn = await prisma.googleAdsConnection.findUnique({ where: { userId } });
  if (!conn) {
    return NextResponse.json(
      { error: "Conecte a Google Ads primeiro (botão Conectar acima)." },
      { status: 400 },
    );
  }
  if (conn.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Conexão está ${conn.status.toLowerCase()}. Reconecte primeiro.` },
      { status: 400 },
    );
  }

  let customers;
  try {
    customers = await listAccessibleCustomers(conn.id);
  } catch (e: any) {
    return NextResponse.json({ error: `Falha ao listar contas: ${e.message}` }, { status: 502 });
  }

  const existingIds = new Set(
    (await prisma.googleAdsAccount.findMany({
      where: { connectionId: conn.id },
      select: { customerId: true },
    })).map((a) => a.customerId),
  );
  let created = 0;
  for (const c of customers) {
    if (!existingIds.has(c.customerId)) created++;
    await prisma.googleAdsAccount.upsert({
      where: { connectionId_customerId: { connectionId: conn.id, customerId: c.customerId } },
      create: {
        connectionId: conn.id,
        customerId: c.customerId,
        name: c.name,
        currencyCode: c.currencyCode,
      },
      update: { name: c.name, currencyCode: c.currencyCode },
    });
  }

  return NextResponse.json({
    ok: true,
    total: customers.length,
    created,
    updated: customers.length - created,
  });
}
