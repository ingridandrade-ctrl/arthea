import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return { error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
  }
  return { session };
}
