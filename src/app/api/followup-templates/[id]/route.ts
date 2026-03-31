import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, messageTemplate, isAutomatic, isActive, channel, delayHours } = body;

  const template = await prisma.followUpTemplate.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(messageTemplate !== undefined && { messageTemplate }),
      ...(isAutomatic !== undefined && { isAutomatic }),
      ...(isActive !== undefined && { isActive }),
      ...(channel !== undefined && { channel }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.followUpTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
