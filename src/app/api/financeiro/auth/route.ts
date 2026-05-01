import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
  }

  const hash = process.env.FINANCE_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Senha financeira não configurada" }, { status: 500 });
  }

  const valid = await bcryptjs.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("finance_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  return response;
}
