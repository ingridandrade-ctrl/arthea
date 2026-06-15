import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EngagementType, DeliverableCategory, DeliverableSection } from "@prisma/client";

// POST /api/clientes/wizard
//
// Cria um cliente novo do zero, atomicamente:
//   - User(CLIENT)  com senha aleatória
//   - 1 ClientEngagement por Service selecionado
//   - ClientDeliverable[] copiados dos templates de cada Service
//   - 1 Contract no Financeiro com duração X meses
//   - N Invoice (uma por mês de duração)
//   - Se veio de Lead: liga Lead.clientUserId ↔ User.leadId ↔ Contract.clientUserId

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    email,
    phone,
    leadId, // opcional
    serviceIds, // array de Service.id
    monthlyValue,
    durationMonths,
    paymentDay,
    paymentMethod, // "Pix" | "Boleto" | "Cartão"
    startDate, // ISO string
    generateInvoices = true,
  } = body as any;

  // ─── Validações básicas ──────────────────────────────
  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return NextResponse.json({ error: "Selecione pelo menos 1 serviço" }, { status: 400 });
  }
  if (!monthlyValue || monthlyValue <= 0) {
    return NextResponse.json({ error: "Valor mensal inválido" }, { status: 400 });
  }
  if (!durationMonths || durationMonths < 1) {
    return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
  }
  if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
    return NextResponse.json({ error: "Dia de vencimento inválido" }, { status: 400 });
  }

  // Verifica e-mail único
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }

  // Carrega serviços + seus templates
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: {
      deliverableTemplates: {
        orderBy: [{ section: "asc" }, { phase: "asc" }, { order: "asc" }],
      },
    },
  });
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "Algum serviço não encontrado" }, { status: 400 });
  }

  // Carrega lead se especificado
  let lead: any = null;
  if (leadId) {
    lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    if (lead.clientUser) {
      return NextResponse.json(
        { error: "Esse lead já foi promovido a cliente" },
        { status: 409 },
      );
    }
  }

  // Gera senha aleatória pro cliente
  const tempPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);

  // Default DeliverableCategory por tipo de engagement
  const defaultCategory = (type: EngagementType): DeliverableCategory => {
    if (type === "PAID_TRAFFIC") return "CREATIVE";
    if (type === "LANDING_PAGE") return "DESIGN";
    if (type === "GMB") return "POST";
    return "CONTENT"; // STRATEGY default
  };

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Criar User (cliente do portal)
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "CLIENT",
            leadId: leadId || null,
          },
        });

        // 2. Pra cada Service: criar Engagement + copiar templates como Deliverables
        const engagements: any[] = [];
        for (const service of services) {
          const engagementType: EngagementType = (service.engagementType || "STRATEGY") as EngagementType;
          const slug = `${slugify(service.name)}-${Math.random().toString(36).slice(2, 6)}`;

          const engagement = await tx.clientEngagement.create({
            data: {
              clientId: user.id,
              type: engagementType,
              slug,
              name: service.name,
              description: service.description || null,
              startDate: start,
              currentPhase: 1,
              isActive: true,
              accentColor: service.color || "#1D7070",
              deliverables: {
                create: service.deliverableTemplates.map((tpl: any, idx: number) => ({
                  title: tpl.title,
                  description: tpl.description || null,
                  category: defaultCategory(engagementType),
                  kind: tpl.kind,
                  section: (tpl.section || "ONBOARDING") as DeliverableSection,
                  phase: tpl.phase,
                  order: tpl.order ?? idx,
                  status: "PENDING" as const,
                })),
              },
            },
            include: { deliverables: true },
          });
          engagements.push(engagement);
        }

        // 3. Criar Contract no Financeiro
        // Contract.leadId é obrigatório — se não veio de Lead, criamos um "lead-cliente"
        // automático pra satisfazer o schema (legado).
        let effectiveLeadId = leadId;
        if (!effectiveLeadId) {
          const autoLead = await tx.lead.create({
            data: {
              name,
              phone: phone || `cliente-${user.id.slice(0, 8)}`,
              email,
              source: "MANUAL",
              status: "QUALIFIED",
            },
          });
          effectiveLeadId = autoLead.id;
          // Atualiza User pra apontar pro lead auto criado
          await tx.user.update({ where: { id: user.id }, data: { leadId: effectiveLeadId } });
        } else {
          // Marca Lead existente como QUALIFIED (foi convertido em cliente)
          await tx.lead.update({
            where: { id: leadId },
            data: { status: "QUALIFIED" },
          });
        }

        const contractNumber = `CT-${Date.now().toString().slice(-8)}`;
        const contract = await tx.contract.create({
          data: {
            number: contractNumber,
            leadId: effectiveLeadId,
            clientUserId: user.id,
            monthlyValue,
            durationMonths,
            paymentDay,
            recurrence: "MONTHLY",
            status: "ACTIVE",
            startDate: start,
            endDate: end,
            serviceIds,
          },
        });

        // 4. Gerar faturas (Invoice) — uma por mês de duração
        const invoices = [];
        if (generateInvoices) {
          for (let i = 0; i < durationMonths; i++) {
            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(paymentDay);

            const invoiceNumber = `INV-${contractNumber}-${(i + 1).toString().padStart(3, "0")}`;
            const inv = await tx.invoice.create({
              data: {
                number: invoiceNumber,
                contractId: contract.id,
                leadId: effectiveLeadId,
                amount: monthlyValue,
                status: "PENDING",
                dueDate,
                paymentMethod: paymentMethod || null,
                installmentNumber: i + 1,
                totalInstallments: durationMonths,
              },
            });
            invoices.push(inv);
          }
        }

        return {
          userId: user.id,
          engagementIds: engagements.map((e) => e.id),
          contractId: contract.id,
          invoiceCount: invoices.length,
          tempPassword, // retorna pra UI mostrar uma vez (ou enviar por email)
        };
      },
      { timeout: 20000 },
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[wizard]", err);
    return NextResponse.json(
      { error: `Falha ao criar cliente: ${err.message || "erro desconhecido"}` },
      { status: 500 },
    );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}
