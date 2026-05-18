import { NextRequest, NextResponse } from "next/server";
import {
  checkCredentials,
  setAdminCookie,
} from "@/lib/clinicabrescancin/admin-auth";

export async function POST(req: NextRequest) {
  let body: { email?: unknown; senha?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const senha = typeof body.senha === "string" ? body.senha : "";
  if (!email || !senha) {
    return NextResponse.json(
      { error: "Informe email e senha." },
      { status: 400 },
    );
  }

  if (!checkCredentials(email, senha)) {
    return NextResponse.json(
      { error: "Email ou senha incorretos." },
      { status: 401 },
    );
  }

  setAdminCookie();
  return NextResponse.json({ ok: true });
}
