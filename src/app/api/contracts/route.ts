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
  const clientType = searchParams.get("clientType");
  const search = searchParams.get("search");

  const where: any = {};
  if (status) where.status = status;
  if (clientType) where.clientType = clientType;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { niche: { contains: search, mode: "insensitive" } },
      { lead: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, phone: true, email: true, company: true } },
      deal: { select: { id: true, title: true } },
      service: { select: { id: true, name: true, color: true } },
      _count: { select: { invoices: true } },
      invoices: {
        select: { id: true, status: true, dueDate: true, paidAt: true, amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allIds = Array.from(new Set(contracts.flatMap((c) => c.serviceIds || []).filter(Boolean)));
  const services = allIds.length
    ? await prisma.service.findMany({
        where: { id: { in: allIds } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const svcMap = new Map(services.map((s) => [s.id, s]));
  const enriched = contracts.map((c) => ({
    ...c,
    services: (c.serviceIds || []).map((id) => svcMap.get(id)).filter(Boolean),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const {
    dealId,
    leadId,
    clientName,
    clientPhone,
    clientEmail,
    clientCompany,
    serviceId,
    serviceIds,
    monthlyValue,
    setupValue,
    durationMonths,
    startDate,
    paymentDay,
    notes,
    clientType,
    niche,
    tags,
    paymentLink,
    generateInvoices,
  } = body;

  const resolvedServiceIds: string[] = Array.isArray(serviceIds)
    ? serviceIds.filter(Boolean)
    : serviceId
    ? [serviceId]
    : [];
  const primaryServiceId = resolvedServiceIds[0] || null;

  // Resolve / create lead if leadId not provided
  let resolvedLeadId = leadId;
  if (!resolvedLeadId) {
    if (!clientName) {
      return NextResponse.json({ error: "Informe um cliente existente ou um nome." }, { status: 400 });
    }
    if (clientPhone) {
      const existing = await prisma.lead.findUnique({ where: { phone: clientPhone } });
      if (existing) {
        resolvedLeadId = existing.id;
      }
    }
    if (!resolvedLeadId) {
      const created = await prisma.lead.create({
        data: {
          name: clientName,
          phone: clientPhone || `manual-${Date.now()}`,
          email: clientEmail || null,
          company: clientCompany || null,
          source: "MANUAL",
        },
      });
      resolvedLeadId = created.id;
    }
  }

  const count = await prisma.contract.count();
  const year = new Date().getFullYear();
  const number = `CTR-${year}-${String(count + 1).padStart(3, "0")}`;

  const contract = await prisma.contract.create({
    data: {
      number,
      dealId: dealId || null,
      leadId: resolvedLeadId,
      serviceId: primaryServiceId,
      serviceIds: resolvedServiceIds,
      monthlyValue: monthlyValue ?? 0,
      setupValue: setupValue ?? null,
      durationMonths: durationMonths || 12,
      startDate: startDate ? new Date(startDate) : new Date(),
      paymentDay: paymentDay || 10,
      notes: notes || null,
      clientType: clientType || "ACTIVE",
      niche: niche || null,
      tags: Array.isArray(tags) ? tags : [],
      paymentLink: paymentLink || null,
    },
    include: { lead: true, deal: true, service: true },
  });

  // Auto-generate installments when explicitly requested by the form
  const shouldGenerate = generateInvoices === true;
  if (shouldGenerate && contract.durationMonths > 0) {
    const invCount = await prisma.invoice.count();
    const invoiceData = Array.from({ length: contract.durationMonths }, (_, i) => {
      const due = new Date(contract.startDate);
      due.setMonth(due.getMonth() + i);
      due.setDate(contract.paymentDay);
      return {
        number: `INV-${year}-${String(invCount + i + 1).padStart(3, "0")}`,
        contractId: contract.id,
        leadId: contract.leadId,
        serviceId: primaryServiceId,
        serviceIds: resolvedServiceIds,
        amount: contract.monthlyValue,
        dueDate: due,
        description: `Parcela ${i + 1}/${contract.durationMonths}`,
        installmentNumber: i + 1,
        totalInstallments: contract.durationMonths,
        paymentLink: contract.paymentLink || null,
      };
    });
    await prisma.invoice.createMany({ data: invoiceData });
  }

  return NextResponse.json(contract, { status: 201 });
}
