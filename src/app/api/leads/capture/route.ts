import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { scheduleFollowUpsForLeadService } from "@/lib/followups/engine";
import { renderTemplate } from "@/lib/followups/engine";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      company,
      source,
      serviceSlug,
      customData,
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
        company,
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

    if (!service) {
      return NextResponse.json(
        { success: true, leadId: lead.id },
        { status: 201 }
      );
    }

    const pipelineId = await ensurePipelineForService(service.slug);
    const firstStage = pipelineId
      ? await prisma.pipelineStage.findFirst({
          where: { pipelineId },
          orderBy: { order: "asc" },
        })
      : null;

    if (!firstStage) {
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
        customData: customData || undefined,
      },
    });

    await scheduleFollowUpsForLeadService(leadService.id, firstStage.id);

    // Send any follow-ups scheduled for immediate delivery (delayHours = 0,
    // whatsapp, automatic) — these are the welcome templates like GMN T1/T2B.
    const dueNow = await prisma.followUp.findMany({
      where: {
        leadServiceId: leadService.id,
        status: "pending",
        isAutomatic: true,
        channel: "whatsapp",
        scheduledAt: { lte: new Date() },
      },
    });

    if (dueNow.length > 0) {
      const conversation = await prisma.conversation.create({
        data: { leadId: lead.id, isAiActive: true, lastMessageAt: new Date() },
      });

      const customDataMerged = (customData || {}) as Record<string, string>;

      for (const fu of dueNow) {
        const message = renderTemplate(fu.messageTemplate, {
          nome: name,
          servico: serviceName,
          empresa: company || "",
          telefone: phone,
          email: email || "",
          ...customDataMerged,
        });

        await sendWhatsAppMessage(phone, message);
        await prisma.message.create({
          data: { conversationId: conversation.id, content: message, sender: "AI" },
        });
        await prisma.followUp.update({
          where: { id: fu.id },
          data: { status: "sent", sentAt: new Date() },
        });
      }
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
