import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcryptjs from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user?.id;
  const role = session.user?.role;
  if (!userId) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const body = await request.json();
  const { name, currentPassword, newPassword } = body;

  const data: any = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();

  if (newPassword) {
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter ao menos 6 caracteres." },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // CLIENT precisa confirmar com a senha atual; ADMIN pode pular
    if (role === "CLIENT") {
      const valid = currentPassword
        ? await bcryptjs.compare(currentPassword, user.password)
        : false;
      if (!valid) {
        return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
      }
    }
    data.password = await bcryptjs.hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}
