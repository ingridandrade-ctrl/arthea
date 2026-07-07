import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";

// Endpoint manual pra forçar a criação/atualização do pipeline GMN.
// O bootstrap também roda sozinho quando a rota /api/pipeline ou
// /api/pipeline/stages é chamada com ?service=google-meu-negocio.
export async function POST() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const pipelineId = await ensurePipelineForService("google-meu-negocio");
  if (!pipelineId) {
    return NextResponse.json(
      { error: "Serviço 'google-meu-negocio' não existe." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, pipelineId });
}
