import { prisma } from "@/lib/prisma";

/**
 * Decide se a IA deve iniciar LIGADA pra uma conversa nova.
 *
 * Regra atual (preferência da admin): IA só atua pra leads do serviço
 * Google Meu Negócio. Pra qualquer outro serviço (Tráfego Pago, Landing
 * Page, CRM/Automação), Conversation.isAiActive nasce false — humano
 * atende desde o início.
 *
 * Se o lead tem MÚLTIPLOS serviços (ex: GMN + Tráfego Pago), ainda assim
 * liga (o lead tem interesse em GMN, então a IA pode conversar sobre).
 */
export async function shouldEnableAiByDefault(leadId: string): Promise<boolean> {
  const services = await prisma.leadService.findMany({
    where: { leadId },
    select: { service: { select: { slug: true } } },
  });
  return services.some((ls) => ls.service.slug === "google-meu-negocio");
}
