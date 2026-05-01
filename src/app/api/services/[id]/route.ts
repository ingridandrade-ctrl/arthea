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
  const { name, description, basePrice, setupFee, color, isActive } = body;

  const service = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(basePrice !== undefined && { basePrice }),
      ...(setupFee !== undefined && { setupFee }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(service);
}
