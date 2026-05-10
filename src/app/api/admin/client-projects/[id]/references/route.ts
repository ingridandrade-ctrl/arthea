import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { title, type, url, description, order } = body;
  if (!title || !url) {
    return NextResponse.json({ error: "Título e URL obrigatórios" }, { status: 400 });
  }

  const ref = await prisma.clientReference.create({
    data: {
      projectId: params.id,
      title,
      type: type || "link",
      url,
      description: description || null,
      order: order ?? 0,
    },
  });
  return NextResponse.json(ref, { status: 201 });
}
