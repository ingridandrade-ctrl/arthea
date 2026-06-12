import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/google-ads/accounts/[id]/link
//   body: { engagementId: string | null }
//
// Liga (ou desliga) uma conta Google Ads a um ClientEngagement.
// Apenas admin/manager.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const engagementId = (body as any).engagementId as string | null | undefined;

  if (engagementId) {
    const eng = await prisma.clientEngagement.findUnique({
      where: { id: engagementId },
      select: { id: true },
    });
    if (!eng) {
      return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });
    }
  }

  const updated = await prisma.googleAdsAccount.update({
    where: { id: params.id },
    data: { engagementId: engagementId || null },
  });
  return NextResponse.json({ ok: true, accountId: updated.id, engagementId: updated.engagementId });
}
