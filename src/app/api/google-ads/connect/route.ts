import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleAdsConfig, stripHyphens } from "@/lib/google-ads/config";
import { getValidAccessToken } from "@/lib/google-ads/auth";
import { getAccountSummary } from "@/lib/google-ads/api";

// POST /api/google-ads/connect
//   body opcional: { mccCustomerId?: string }
//
// Inicializa (ou refresca) a GoogleAdsConnection associada ao admin logado.
// O refresh_token mora em env var — esse endpoint só:
//   1. Valida que as env vars estão presentes
//   2. Cria/atualiza GoogleAdsConnection com o mcc id que vier (ou o default da env)
//   3. Faz um access token refresh + uma chamada de teste pra confirmar
//   4. Retorna status + smoke test
export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const userId = session.user?.id as string;

  let cfg;
  try {
    cfg = getGoogleAdsConfig();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const mccCustomerId = stripHyphens(
    (body as any).mccCustomerId || cfg.mccCustomerId,
  );

  const conn = await prisma.googleAdsConnection.upsert({
    where: { userId },
    create: {
      userId,
      mccCustomerId,
      status: "ACTIVE",
    },
    update: {
      mccCustomerId,
      status: "ACTIVE",
    },
  });

  // Smoke test: pega um access token e tenta um summary do próprio MCC.
  // Se o MCC não tem dados, a chamada retorna zero — não é erro.
  try {
    await getValidAccessToken(conn.id);
    await getAccountSummary(
      { connectionId: conn.id, customerId: mccCustomerId },
      "LAST_7_DAYS",
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        connectionId: conn.id,
        error: `Conexão salva, mas teste falhou: ${e.message}`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    connectionId: conn.id,
    mccCustomerId,
    status: conn.status,
  });
}
