import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendTemplateMessage } from "@/lib/whatsapp-official";
import { normalizeLeadPhone } from "@/lib/phone";

/**
 * Dispara notificações de lead novo:
 *  - Sininho (in-app) pra todos os usuários ADMIN/MANAGER
 *  - WhatsApp pro ADMIN_NOTIFICATION_PHONE (env) APENAS quando source=FORMS
 *
 * A Ingrid pediu WhatsApp só pra Forms porque os outros canais
 * (Prospecção/Indicação) ela cria manualmente — não precisa de aviso.
 *
 * Fire-and-forget: nunca throwa (erro de notificação não pode quebrar
 * a criação do lead em si).
 */
export async function notifyNewLead(opts: {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCompany?: string | null;
  source: string;
  serviceName?: string | null;
  triggeredFromUI?: boolean; // criação manual via /api/leads
}) {
  try {
    const sourceLabel = sourceToLabel(opts.source);
    const title = `Novo lead ${sourceLabel}: ${opts.leadName}`;
    const body = [
      opts.leadCompany ? opts.leadCompany : null,
      opts.serviceName ? `Serviço: ${opts.serviceName}` : null,
      `Tel: ${opts.leadPhone}`,
    ]
      .filter(Boolean)
      .join(" · ");

    // 1. Sininho — sempre, pra todos os leads novos
    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    await Promise.all(
      recipients.map((u) =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: "lead_new",
            title,
            body,
            data: { leadId: opts.leadId, source: opts.source },
          },
        }),
      ),
    );

    // 2. WhatsApp — só pra FORMS (preferência da admin)
    if (opts.source !== "FORMS") return;

    const adminPhone = process.env.ADMIN_NOTIFICATION_PHONE;
    if (!adminPhone) {
      console.warn(
        "notifyNewLead: ADMIN_NOTIFICATION_PHONE não configurado — pulando WhatsApp",
      );
      return;
    }

    const adminPhoneNormalized = normalizeLeadPhone(adminPhone);

    // Procura o template ADMIN_NOVO_LEAD_FORMS aprovado. Se existe e está
    // APPROVED, usa via sendTemplateMessage (funciona fora da janela 24h,
    // mas Meta cobra). Senão, tenta texto livre (grátis, só funciona se
    // janela tá aberta — falha silenciosa se não tá).
    const tpl = await prisma.followUpTemplate.findUnique({
      where: { code: "ADMIN_NOVO_LEAD_FORMS" },
      select: { metaName: true, metaStatus: true },
    });

    if (tpl?.metaName && tpl.metaStatus === "APPROVED") {
      // Ordem dos params no template: {{1}}=nome, {{2}}=empresa,
      // {{3}}=servico, {{4}}=telefone — bate com convertToMeta() pra
      // ADMIN_NOVO_LEAD_FORMS.
      await sendTemplateMessage(adminPhoneNormalized, tpl.metaName, "pt_BR", [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.leadName },
            { type: "text", text: opts.leadCompany || "—" },
            { type: "text", text: opts.serviceName || "—" },
            { type: "text", text: opts.leadPhone },
          ],
        },
      ]);
    } else {
      // Sem template aprovado — manda texto livre. Vai chegar se a admin
      // mandou alguma msg pro número da Arthea nas últimas 24h.
      const message = `🆕 *Novo lead Forms*\n\n*${opts.leadName}*${
        opts.leadCompany ? ` (${opts.leadCompany})` : ""
      }\n${opts.serviceName ? `Serviço: ${opts.serviceName}\n` : ""}Tel: ${opts.leadPhone}\n\nAcompanhe em adm.arthea.com.br/crm/leads/${opts.leadId}`;
      await sendWhatsAppMessage(adminPhoneNormalized, message);
    }
  } catch (err) {
    console.error("notifyNewLead falhou (ignorando, não bloqueia lead):", err);
  }
}

function sourceToLabel(source: string): string {
  const m: Record<string, string> = {
    FORMS: "Forms",
    PROSPECCAO: "Prospecção",
    INDICACAO: "Indicação",
    WHATSAPP: "WhatsApp",
    WEBSITE: "Site",
  };
  return m[source] || source;
}
