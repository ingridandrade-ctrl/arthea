import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/clientes/[clientId]/account
// Atualiza o acesso do cliente à área de membros (e-mail, senha, módulos).
// Nível do CLIENTE — substitui o endpoint por projeto que fazia isso antes.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.clientId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, password, scenesEnabled } = body as {
    email?: string;
    password?: string;
    scenesEnabled?: boolean;
  };

  const data: any = {};
  if (typeof email === "string" && email.trim()) {
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existing && existing.id !== params.clientId) {
      return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
    }
    data.email = email.trim();
  }
  if (typeof password === "string" && password.length > 0) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha precisa de pelo menos 6 caracteres" }, { status: 400 });
    }
    data.password = await bcrypt.hash(password, 10);
  }
  if (typeof scenesEnabled === "boolean") {
    data.scenesEnabled = scenesEnabled;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.clientId }, data });
  return NextResponse.json({ ok: true });
}
