import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/mindfulness/admin-auth";

export async function POST(req: NextRequest) {
  let body: { senha?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const senha = typeof body.senha === "string" ? body.senha : "";
  if (!senha) {
    return NextResponse.json({ error: "Senha obrigatória." }, { status: 400 });
  }

  if (!checkPassword(senha)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  setAdminCookie();
  return NextResponse.json({ ok: true });
}
