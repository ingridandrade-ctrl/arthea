import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/google-ads/debug
//
// Endpoint de diagnóstico — só admin/manager. Mostra qual versão da API
// está sendo usada e se cada env var está presente (sem expor o valor
// inteiro). Útil quando o Google muda algo do lado deles e precisamos
// confirmar o que está rodando no deploy.
export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const apiVersion = process.env.GOOGLE_ADS_API_VERSION || "v22";
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
  const mccCustomerId = process.env.GOOGLE_ADS_MCC_CUSTOMER_ID || "";

  return NextResponse.json({
    apiVersion,
    apiBaseUrl: `https://googleads.googleapis.com/${apiVersion}`,
    envVars: {
      GOOGLE_ADS_CLIENT_ID: {
        present: !!clientId,
        preview: clientId ? `${clientId.slice(0, 20)}…${clientId.slice(-30)}` : null,
        endsCorrectly: clientId.endsWith(".apps.googleusercontent.com"),
      },
      GOOGLE_ADS_CLIENT_SECRET: {
        present: !!clientSecret,
        startsWithGOCSPX: clientSecret.startsWith("GOCSPX-"),
        length: clientSecret.length,
      },
      GOOGLE_ADS_DEVELOPER_TOKEN: {
        present: !!developerToken,
        length: developerToken.length,
      },
      GOOGLE_ADS_REFRESH_TOKEN: {
        present: !!refreshToken,
        startsWith: refreshToken.slice(0, 4),
        length: refreshToken.length,
      },
      GOOGLE_ADS_MCC_CUSTOMER_ID: {
        present: !!mccCustomerId,
        value: mccCustomerId.replace(/-/g, ""),
      },
    },
  });
}
