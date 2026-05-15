import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  setAdminCookie,
} from "@/lib/clinicabrescancin/admin-auth";

export async function POST(req: NextRequest) {
  let body: { senha?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const senha = typeof body.senha === "string" ? body.senha : "";
  if (!senha) {
    return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
  }

  if (!checkPassword(senha)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  setAdminCookie();
  return NextResponse.json({ ok: true });
}
