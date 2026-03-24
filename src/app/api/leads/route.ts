import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};

  if (serviceSlug && serviceSlug !== "all") {
    where.service = { slug: serviceSlug };
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      service: true,
      deals: true,
      conversations: { orderBy: { lastMessageAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, company, source, serviceId, notes } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
  }

  const existing = await prisma.lead.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um lead com este telefone" }, { status: 409 });
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      phone,
      email,
      company,
      source: source || "MANUAL",
      serviceId,
      notes,
    },
    include: { service: true },
  });

  return NextResponse.json(lead, { status: 201 });
}
