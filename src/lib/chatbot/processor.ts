import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/anthropic";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { SYSTEM_PROMPT, shouldHandoff } from "./prompts";
import { performHandoff } from "./handoff";
import { scheduleFollowUpsForLeadService } from "@/lib/followups/engine";
import { renderTemplate } from "@/lib/followups/engine";
import { normalizeLeadPhone } from "@/lib/phone";

/**
 * In-process guard against concurrent webhook processing for the same lead.
 * If two messages from the same phone arrive almost simultaneously, the second
 * waits on the first's promise so we don't race on flow cancellation, stage
 * moves or AI replies. This is per-instance — it does not coordinate across
 * Node processes; cross-process safety relies on the DB-level idempotency
 * check on `evolutionMsgId` (see below).
 */
const inflightByPhone = new Map<string, Promise<unknown>>();

export async function processIncomingMessage(
  phoneRaw: string,
  content: string,
  senderName: string,
  evolutionMsgId: string
) {
  // Normaliza pra `5511...` antes de qualquer lookup/save — webhook do Meta
  // já manda só dígitos, mas é defensivo (e o sentinel de serialização
  // também precisa bater).
  const phone = normalizeLeadPhone(phoneRaw);
  // Per-phone serialization: wait for any in-flight processing to finish.
  const prior = inflightByPhone.get(phone);
  if (prior) {
    try {
      await prior;
    } catch {
      // ignore — the prior call's own error handling already ran
    }
  }
  const run = doProcessIncomingMessage(phone, content, senderName, evolutionMsgId);
  inflightByPhone.set(phone, run);
  try {
    return await run;
  } finally {
    if (inflightByPhone.get(phone) === run) {
      inflightByPhone.delete(phone);
    }
  }
}

async function doProcessIncomingMessage(
  phone: string,  // já normalizado pelo wrapper
  content: string,
  senderName: string,
  evolutionMsgId: string,
) {
  // Idempotency guard: if we've already stored a Message for this delivery,
  // skip. The webhook already checks this, but a duplicate delivery could
  // race past that check between two concurrent requests.
  if (evolutionMsgId) {
    const existing = await prisma.message.findFirst({
      where: { evolutionMsgId, sender: "LEAD" },
      select: { id: true },
    });
    if (existing) {
      return { handled: false, reason: "duplicate" };
    }
  }

  let lead = await prisma.lead.findUnique({
    where: { phone },
    include: { services: { include: { service: true } } },
  });

  let isNewLead = false;

  if (!lead) {
    isNewLead = true;
    const created = await prisma.lead.create({
      data: {
        name: senderName,
        phone,
        source: "WHATSAPP",
        status: "ATIVO",
      },
    });
    lead = await prisma.lead.findUnique({
      where: { id: created.id },
      include: { services: { include: { service: true } } },
    })!;

    // Pega o primeiro estágio do PIPELINE do serviço default. O findFirst
    // genérico por order:0 pode pegar o stage de qualquer pipeline (GMN,
    // tráfego, etc) — não necessariamente o do serviço que vamos atribuir.
    const defaultService = await prisma.service.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (defaultService && lead) {
      const pipeline = await prisma.pipeline.findUnique({
        where: { serviceId: defaultService.id },
        include: { stages: { orderBy: { order: "asc" }, take: 1 } },
      });
      const firstStage = pipeline?.stages[0]
        ?? await prisma.pipelineStage.findFirst({
          where: { pipeline: { serviceId: null } },
          orderBy: { order: "asc" },
        });

      if (firstStage) {
        const ls = await prisma.leadService.create({
          data: {
            leadId: lead.id,
            serviceId: defaultService.id,
            stageId: firstStage.id,
          },
        });
        await scheduleFollowUpsForLeadService(ls.id, firstStage.id);
      }
    }
  }

  if (!lead) {
    return { handled: false, reason: "lead_creation_failed" };
  }

  // Notifica admin/manager quando lead novo entra via WhatsApp (source=WHATSAPP).
  // Sininho só — não dispara WhatsApp porque o admin já tá vendo a mensagem
  // no próprio fluxo do CRM via Conversas.
  if (isNewLead) {
    const { notifyNewLead } = await import("@/lib/notifications/new-lead");
    notifyNewLead({
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadCompany: lead.company,
      source: "WHATSAPP",
      serviceName: lead.services[0]?.service.name,
    }).catch(() => {});
  }

  let conversation = await prisma.conversation.findFirst({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    // IA só liga por padrão se o lead tem serviço GMN — pra outros serviços
    // o atendimento começa humano (preferência da admin).
    const { shouldEnableAiByDefault } = await import("@/lib/chatbot/should-enable-ai");
    const aiOn = await shouldEnableAiByDefault(lead.id);
    conversation = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        isAiActive: aiOn,
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      sender: "LEAD",
      evolutionMsgId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // Lead respondeu → cancela fluxos em andamento, move estágio se aplicável,
  // notifica equipe. Não bloqueia o resto do processamento se falhar.
  if (!isNewLead) {
    const { onLeadReplied } = await import("@/lib/flows/lead-replied");
    onLeadReplied({ leadId: lead.id, lastMessage: content }).catch((err) =>
      console.error("onLeadReplied falhou:", err)
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { handled: false, reason: "ai_disabled" };
  }

  if (!conversation.isAiActive) {
    return { handled: false, reason: "human_active" };
  }

  // Defesa: IA só atende leads que têm GMN como serviço. Cobre o caso
  // de admin trocar serviços do lead sem desligar a IA, ou conversation
  // criada antes da regra existir.
  const hasGmn = lead.services.some((ls) => ls.service.slug === "google-meu-negocio");
  if (!hasGmn) {
    return { handled: false, reason: "ai_disabled_for_non_gmn" };
  }

  if (shouldHandoff(content)) {
    await performHandoff(conversation.id, lead.phone);
    return { handled: true, reason: "handoff" };
  }

  // Áudio/vídeo: IA não escuta. Responde amigável e desliga IA pra humano
  // assumir (lead precisa de resposta agora, não dá pra ignorar).
  if (/\[Mensagem de voz\]|\[Audio\]|\[Video\]/.test(content)) {
    const polite = `Oii, ${lead.name.split(" ")[0]}! Não consigo escutar áudios por aqui, me responde por escrito que eu te respondo na hora 😊`;
    await sendWhatsAppMessage(phone, polite);
    await prisma.message.create({
      data: { conversationId: conversation.id, content: polite, sender: "AI" },
    });
    // Desliga IA pra humano cuidar do áudio se o lead insistir
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isAiActive: false },
    });
    return { handled: true, reason: "audio_polite_redirect" };
  }

  const pendingFollowUp = await prisma.followUp.findFirst({
    where: {
      leadService: { leadId: lead.id },
      status: "pending",
      isAutomatic: true,
      channel: "whatsapp",
    },
    include: { leadService: { select: { customData: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  if (pendingFollowUp) {
    const serviceNames = lead.services.map((ls) => ls.service.name).join(", ");
    const customData = (pendingFollowUp.leadService.customData || {}) as Record<string, string>;
    const message = renderTemplate(pendingFollowUp.messageTemplate, {
      nome: lead.name,
      servico: serviceNames || "nossos serviços",
      empresa: lead.company || "",
      telefone: lead.phone,
      email: lead.email || "",
      ...customData,
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        sender: "AI",
      },
    });

    const msgId = await sendWhatsAppMessage(phone, message);
    if (msgId) {
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          sender: "AI",
          evolutionMsgId: null,
        },
        data: { evolutionMsgId: msgId },
      });
    }

    await prisma.followUp.update({
      where: { id: pendingFollowUp.id },
      data: { status: "sent", sentAt: new Date() },
    });

    return { handled: true, reason: "template_response", response: message };
  }

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages = history.map((msg) => ({
    role: (msg.sender === "LEAD" ? "user" : "assistant") as "user" | "assistant",
    content: msg.content,
  }));

  // Monta system prompt enriquecido com contexto desse lead específico
  // (nome, empresa, estágio, templates já enviados). Sem isso, a IA age
  // como se fosse a 1ª conversa todo dia.
  const { buildLeadContext } = await import("./lead-context");
  const leadContext = await buildLeadContext(lead.id);
  const enrichedPrompt = leadContext
    ? `${SYSTEM_PROMPT}\n\n${leadContext}`
    : SYSTEM_PROMPT;

  let aiResponse: string;
  try {
    aiResponse = await generateChatResponse(enrichedPrompt, messages);
  } catch (aiErr: any) {
    console.error(
      `IA falhou pro lead ${lead.id} (${lead.phone}):`,
      aiErr?.message || aiErr,
      aiErr?.status ? `status=${aiErr.status}` : "",
    );
    // Notifica admin/manager — fluxo do lead trava se IA não responde.
    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    for (const u of recipients) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: "ai_failure",
          title: `IA falhou ao responder ${lead.name}`,
          body: `Erro: ${aiErr?.message || "desconhecido"}. Lead precisa de atendimento humano.`,
          data: { leadId: lead.id, error: aiErr?.message },
        },
      });
    }
    // Manda fallback pro lead pra ele não ficar no vácuo + abre atendimento humano
    const fallback = "Oii! Tive um probleminha técnico aqui. Vou pedir pra alguém da equipe te atender em instantes, ok? 😊";
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isAiActive: false },
    });
    await sendWhatsAppMessage(phone, fallback).catch(() => {});
    await prisma.message.create({
      data: { conversationId: conversation.id, content: fallback, sender: "AI" },
    });
    return { handled: false, reason: "ai_error", error: aiErr?.message };
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: aiResponse,
      sender: "AI",
    },
  });

  const msgId = await sendWhatsAppMessage(phone, aiResponse);

  if (msgId) {
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        sender: "AI",
        evolutionMsgId: null,
      },
      data: { evolutionMsgId: msgId },
    });
  }

  return { handled: true, reason: "ai_response", response: aiResponse };
}
