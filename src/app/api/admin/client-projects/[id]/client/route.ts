import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

// Atualiza dados do User dono de um engagement: name, email e/ou senha.
// Não permite mudar role daqui — pra isso usar outra rota.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: { clientId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { name, email, password, scenesEnabled } = body as {
    name?: string;
    email?: string;
    password?: string;
    scenesEnabled?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof email === "string" && email.trim()) {
    const cleaned = email.trim().toLowerCase();
    // Garante que não estamos sobrescrevendo um e-mail já em uso por outro usuário
    const existing = await prisma.user.findUnique({ where: { email: cleaned } });
    if (existing && existing.id !== engagement.clientId) {
      return NextResponse.json({ error: "E-mail já em uso por outro usuário" }, { status: 409 });
    }
    data.email = cleaned;
  }
  if (typeof password === "string" && password.length > 0) {
    if (password.length < 4) {
      return NextResponse.json({ error: "Senha muito curta" }, { status: 400 });
    }
    data.password = await bcryptjs.hash(password, 10);
  }
  if (typeof scenesEnabled === "boolean") {
    data.scenesEnabled = scenesEnabled;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: engagement.clientId },
    data,
    select: { id: true, name: true, email: true, scenesEnabled: true },
  });
  return NextResponse.json(user);
}
