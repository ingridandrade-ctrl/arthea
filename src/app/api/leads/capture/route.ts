import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { scheduleFollowUpsForLeadService } from "@/lib/followups/engine";
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

    const existing = await prisma.lead.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { success: true, leadId: existing.id, existing: true },
        { status: 200 }
      );
    }

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

    let serviceName = "nossos serviços";
    const service = serviceSlug
      ? await prisma.service.findUnique({ where: { slug: serviceSlug } })
      : await prisma.service.findFirst();

    if (service) {
      serviceName = service.name;
    }

    const firstStage = await prisma.pipelineStage.findFirst({
      where: { order: 0 },
      orderBy: { order: "asc" },
    });

    if (!firstStage || !service) {
      return NextResponse.json(
        { success: true, leadId: lead.id },
        { status: 201 }
      );
    }

    const leadService = await prisma.leadService.create({
      data: {
        leadId: lead.id,
        serviceId: service.id,
        stageId: firstStage.id,
      },
    });

    await scheduleFollowUpsForLeadService(leadService.id, firstStage.id);

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

    await prisma.activity.create({
      data: {
        type: "lead_captured",
        description: `Novo lead capturado: ${name} (${source || "WEBSITE"})`,
        leadId: lead.id,
        leadServiceId: leadService.id,
      },
    });

    return NextResponse.json(
      { success: true, leadId: lead.id, leadServiceId: leadService.id },
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
