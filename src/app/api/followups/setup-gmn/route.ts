import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureGmnTemplates } from "@/lib/followups/bootstrap";
import { ensureAdminTemplates } from "@/lib/notifications/bootstrap-admin-templates";

export async function POST() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const result = await ensureGmnTemplates();
  const adminResult = await ensureAdminTemplates();
  return NextResponse.json({ ok: true, ...result, admin: adminResult });
}
