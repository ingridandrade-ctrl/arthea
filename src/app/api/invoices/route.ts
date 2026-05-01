import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const contractId = searchParams.get("contractId");
  const leadId = searchParams.get("leadId");
  const serviceId = searchParams.get("serviceId");
  const clientType = searchParams.get("clientType");
  const month = searchParams.get("month"); // format YYYY-MM
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const where: any = {};
  if (status) where.status = status;
  if (contractId) where.contractId = contractId;
  if (leadId) where.leadId = leadId;
  if (serviceId) where.serviceId = serviceId;
  if (clientType) where.contract = { clientType };

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  } else if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to) where.dueDate.lte = new Date(to);
  }

  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { lead: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      contract: { select: { id: true, number: true, clientType: true, durationMonths: true } },
      lead: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, color: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const {
    contractId,
    leadId,
    clientName,
    clientPhone,
    serviceId,
    amount,
    dueDate,
    description,
    paymentLink,
    paymentMethod,
    installmentNumber,
    totalInstallments,
    invoiceIssued,
    invoiceNumber,
    status,
  } = body;

  if (amount == null || !dueDate) {
    return NextResponse.json({ error: "Campos obrigatórios: amount e dueDate" }, { status: 400 });
  }

  let resolvedLeadId = leadId;
  if (!resolvedLeadId && contractId) {
    const c = await prisma.contract.findUnique({ where: { id: contractId }, select: { leadId: true } });
    if (c) resolvedLeadId = c.leadId;
  }
  if (!resolvedLeadId) {
    if (!clientName) {
      return NextResponse.json({ error: "Informe um cliente." }, { status: 400 });
    }
    if (clientPhone) {
      const existing = await prisma.lead.findUnique({ where: { phone: clientPhone } });
      if (existing) resolvedLeadId = existing.id;
    }
    if (!resolvedLeadId) {
      const created = await prisma.lead.create({
        data: {
          name: clientName,
          phone: clientPhone || `manual-${Date.now()}`,
          source: "MANUAL",
        },
      });
      resolvedLeadId = created.id;
    }
  }

  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const number = `INV-${year}-${String(count + 1).padStart(3, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      contractId: contractId || null,
      leadId: resolvedLeadId,
      serviceId: serviceId || null,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      description: description || null,
      paymentLink: paymentLink || null,
      paymentMethod: paymentMethod || null,
      installmentNumber: installmentNumber ?? null,
      totalInstallments: totalInstallments ?? null,
      invoiceIssued: !!invoiceIssued,
      invoiceNumber: invoiceNumber || null,
      status: status || "PENDING",
    },
    include: {
      contract: { select: { id: true, number: true } },
      lead: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
