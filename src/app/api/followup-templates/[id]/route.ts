import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    name, messageTemplate, isAutomatic, isActive, channel, serviceId,
    condition,
    metaName, metaCategory, metaLanguage,
  } = body;

  const template = await prisma.followUpTemplate.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(messageTemplate !== undefined && { messageTemplate }),
      ...(isAutomatic !== undefined && { isAutomatic }),
      ...(isActive !== undefined && { isActive }),
      ...(channel !== undefined && { channel }),
      ...(serviceId !== undefined && { serviceId: serviceId || null }),
      ...(condition !== undefined && { condition: condition || undefined }),
      ...(metaName !== undefined && { metaName: metaName || null }),
      ...(metaCategory !== undefined && { metaCategory: metaCategory || null }),
      ...(metaLanguage !== undefined && { metaLanguage: metaLanguage || "pt_BR" }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.followUpTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
