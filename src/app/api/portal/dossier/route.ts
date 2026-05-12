import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SECTIONS, sanitizeSectionUpdate } from "@/lib/dossier";

const SECTION_KEYS = SECTIONS.map((s) => s.key);

export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  // Cliente edita o próprio. Admin/manager pode editar de outro cliente via
  // ?clientId= (mas o painel admin tem rota própria).
  let clientId = userId;
  if (role === "ADMIN" || role === "MANAGER") {
    const queryClientId = request.nextUrl.searchParams.get("clientId");
    if (queryClientId) clientId = queryClientId;
  } else if (role !== "CLIENT") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const key of SECTION_KEYS) {
    if (key in body) {
      const cleaned = sanitizeSectionUpdate(key, (body as any)[key]);
      if (cleaned !== undefined) data[key] = cleaned;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const dossier = await prisma.clientDossier.upsert({
    where: { clientId },
    create: { clientId, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, updatedAt: dossier.updatedAt });
}
