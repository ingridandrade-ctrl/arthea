import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { platform, icon, username, password, url, notes, order } = body;
  if (!platform) return NextResponse.json({ error: "Plataforma obrigatória" }, { status: 400 });

  const access = await prisma.clientAccess.create({
    data: {
      engagementId: params.id,
      platform,
      icon: icon || null,
      username: username || null,
      password: password || null,
      url: url || null,
      notes: notes || null,
      order: order ?? 0,
    },
  });
  return NextResponse.json(access, { status: 201 });
}
