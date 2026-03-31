import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { scheduleFollowUpsForDeal } from "@/lib/followups/engine";
import { renderTemplate } from "@/lib/followups/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      source,
      serviceSlug,
      quizAnswers,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if lead already exists
    const existing = await prisma.lead.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { success: true, leadId: existing.id, existing: true },
        { status: 200 }
      );
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        source: source || "WEBSITE",
        quizAnswers,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    // Associate service tag if provided
    let serviceName = "nossos serviços";
    if (serviceSlug) {
      const service = await prisma.service.findUnique({
        where: { slug: serviceSlug },
      });
      if (service) {
        await prisma.leadService.create({
          data: { leadId: lead.id, serviceId: service.id },
        });
        serviceName = service.name;
      }
    }

    // Find first pipeline stage (Novo Lead)
    const firstStage = await prisma.pipelineStage.findFirst({
      where: { order: 0 },
      orderBy: { order: "asc" },
    });

    if (!firstStage) {
      return NextResponse.json(
        { success: true, leadId: lead.id },
        { status: 201 }
      );
    }

    // Get service ID for the deal
    const serviceForDeal = serviceSlug
      ? await prisma.service.findUnique({ where: { slug: serviceSlug } })
      : await prisma.service.findFirst();

    if (!serviceForDeal) {
      return NextResponse.json(
        { success: true, leadId: lead.id },
        { status: 201 }
      );
    }

    // Create deal in "Novo Lead" stage
    const deal = await prisma.deal.create({
      data: {
        title: `${serviceName} - ${name}`,
        leadId: lead.id,
        serviceId: serviceForDeal.id,
        stageId: firstStage.id,
      },
    });

    // Schedule follow-ups
    await scheduleFollowUpsForDeal(deal.id, firstStage.id);

    // Send welcome message via WhatsApp (template 1)
    const welcomeTemplate = await prisma.followUpTemplate.findFirst({
      where: { stageOrder: 0, followUpOrder: 1, isActive: true, isAutomatic: true },
    });

    if (welcomeTemplate) {
      const message = renderTemplate(welcomeTemplate.messageTemplate, {
        nome: name,
        servico: serviceName,
        empresa: "",
        telefone: phone,
        email: email || "",
      });
      await sendWhatsAppMessage(phone, message);

      // Create conversation + save message
      const conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          isAiActive: true,
          lastMessageAt: new Date(),
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message,
          sender: "AI",
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "deal_created",
        description: `Novo lead capturado: ${name} (${source || "WEBSITE"})`,
        leadId: lead.id,
        dealId: deal.id,
      },
    });

    return NextResponse.json(
      { success: true, leadId: lead.id, dealId: deal.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
