import axios from "axios";

/**
 * WhatsApp Business Cloud API (Meta Official)
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Required env vars:
 *   WHATSAPP_API_TOKEN    — Permanent or temporary access token
 *   WHATSAPP_PHONE_ID     — Phone number ID (from Meta Business dashboard)
 *   WHATSAPP_VERIFY_TOKEN — Token you define for webhook verification
 */

const GRAPH_API_VERSION = "v21.0";

const api = axios.create({
  baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN || ""}`,
    "Content-Type": "application/json",
  },
});

const phoneNumberId = process.env.WHATSAPP_PHONE_ID || "";

// ─── Send Messages ───────────────────────────────────────────────

export async function sendTextMessage(
  to: string,
  text: string
): Promise<string | null> {
  try {
    const phone = normalizePhone(to);
    const response = await api.post(`/${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: false, body: text },
    });
    return response.data?.messages?.[0]?.id || null;
  } catch (error: any) {
    console.error(
      "WhatsApp Official API — send error:",
      error.response?.data || error.message
    );
    return null;
  }
}

export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; label: string }[],
): Promise<string | null> {
  try {
    const phone = normalizePhone(to);
    const response = await api.post(`/${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.label.slice(0, 20) },
          })),
        },
      },
    });
    return response.data?.messages?.[0]?.id || null;
  } catch (error: any) {
    console.error("WhatsApp interactive error:", error.response?.data || error.message);
    return null;
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "pt_BR",
  components?: any[]
): Promise<string | null> {
  try {
    const phone = normalizePhone(to);
    const body: any = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };
    if (components) {
      body.template.components = components;
    }
    const response = await api.post(`/${phoneNumberId}/messages`, body);
    return response.data?.messages?.[0]?.id || null;
  } catch (error: any) {
    console.error(
      "WhatsApp Official API — template error:",
      error.response?.data || error.message
    );
    return null;
  }
}

// ─── Templates (Meta WhatsApp Business API) ──────────────────────

const wabaId = process.env.WHATSAPP_WABA_ID || "";

export interface MetaTemplateBody {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  body: string; // texto com {{1}}, {{2}}...
  header?: string;
  footer?: string;
  exampleParams?: string[];
  buttons?: { label: string }[]; // até 3 botões de quick reply
}

export async function submitMetaTemplate(t: MetaTemplateBody): Promise<{ id: string; status: string } | { error: string }> {
  if (!wabaId) return { error: "WHATSAPP_WABA_ID não configurado no servidor" };
  try {
    const components: any[] = [];
    if (t.header) components.push({ type: "HEADER", format: "TEXT", text: t.header });
    components.push({
      type: "BODY",
      text: t.body,
      ...(t.exampleParams && t.exampleParams.length > 0 ? { example: { body_text: [t.exampleParams] } } : {}),
    });
    if (t.footer) components.push({ type: "FOOTER", text: t.footer });
    if (t.buttons && t.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: t.buttons.slice(0, 3).map((b) => ({ type: "QUICK_REPLY", text: b.label.slice(0, 20) })),
      });
    }

    const res = await api.post(`/${wabaId}/message_templates`, {
      name: t.name,
      category: t.category,
      language: t.language,
      components,
    });
    return { id: res.data?.id, status: res.data?.status || "PENDING" };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || "Erro ao submeter template";
    return { error: msg };
  }
}

export async function fetchMetaTemplateStatus(name: string): Promise<{ status: string; rejectionReason?: string } | { error: string }> {
  if (!wabaId) return { error: "WHATSAPP_WABA_ID não configurado" };
  try {
    const res = await api.get(`/${wabaId}/message_templates`, {
      params: { name, fields: "name,status,rejected_reason,quality_score", limit: 1 },
    });
    const tpl = res.data?.data?.[0];
    if (!tpl) return { error: "Template não encontrado na Meta" };
    return { status: tpl.status, rejectionReason: tpl.rejected_reason };
  } catch (err: any) {
    return { error: err.response?.data?.error?.message || err.message };
  }
}

export async function deleteMetaTemplate(name: string): Promise<{ ok: true } | { error: string }> {
  if (!wabaId) return { error: "WHATSAPP_WABA_ID não configurado" };
  try {
    await api.delete(`/${wabaId}/message_templates`, { params: { name } });
    return { ok: true };
  } catch (err: any) {
    return { error: err.response?.data?.error?.message || err.message };
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  try {
    await api.post(`/${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch (error: any) {
    console.error("WhatsApp Official API — mark read error:", error.message);
  }
}

// ─── Webhook Payload Types ───────────────────────────────────────

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppChange {
  // `value` é tipado largo porque a Meta usa o mesmo envelope pra eventos
  // bem diferentes (messages, statuses, message_template_status_update,
  // phone_number_quality_update, etc). Cada extractor castea o que precisa.
  value: Record<string, unknown> & {
    messaging_product?: string;
    metadata?: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: {
      profile: { name: string };
      wa_id: string;
    }[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type?: string; sha256?: string; caption?: string };
  document?: { id: string; mime_type?: string; filename?: string; caption?: string };
  audio?: { id: string; mime_type?: string; voice?: boolean };
  video?: { id: string; mime_type?: string; caption?: string };
  sticker?: { id: string; mime_type?: string; animated?: boolean };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: { name?: { formatted_name?: string } }[];
  reaction?: { message_id: string; emoji?: string };
  order?: { catalog_id?: string; text?: string };
  system?: { body?: string; type?: string };
  unsupported?: unknown;
  errors?: { code: number; title: string; message?: string }[];
  button?: { text: string; payload: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsAppStatus {
  id: string;
  status: string; // "sent" | "delivered" | "read" | "failed"
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string; message?: string }[];
}

/**
 * Update enviado pela Meta quando um template muda de status (APPROVED,
 * REJECTED, DISABLED, etc). Vem no payload do webhook quando o campo
 * `message_template_status_update` está inscrito.
 */
export interface MetaTemplateStatusUpdate {
  event: string; // "APPROVED" | "REJECTED" | "DISABLED" | "PENDING_DELETION" | etc.
  templateId?: string | number;
  templateName: string;
  templateLanguage?: string;
  reason?: string | null; // motivo da rejeição (quando event === "REJECTED")
}

// ─── Extract Message Content ─────────────────────────────────────

export interface ExtractedMessage {
  phone: string;
  content: string;
  name: string;
  messageId: string;
  buttonId?: string;
  messageType: string;
  /** Reference to Meta media id when the message carried media. */
  mediaId?: string;
  mediaMimeType?: string;
  mediaFilename?: string;
}

export function extractOfficialMessageContent(
  payload: WhatsAppWebhookPayload,
): ExtractedMessage | null {
  if (!payload || payload.object !== "whatsapp_business_account") return null;
  if (!Array.isArray(payload.entry)) return null;

  for (const entry of payload.entry) {
    if (!entry || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!change || change.field !== "messages") continue;

      const messages = change.value?.messages;
      const contacts = change.value?.contacts;

      if (!messages || messages.length === 0) continue;

      const msg = messages[0];
      if (!msg || !msg.id || !msg.from) continue;
      const contact = contacts?.[0];

      // Defaults
      let content = "";
      let buttonId: string | undefined = undefined;
      let mediaId: string | undefined = undefined;
      let mediaMimeType: string | undefined = undefined;
      let mediaFilename: string | undefined = undefined;

      try {
        switch (msg.type) {
          case "text":
            content = msg.text?.body?.trim() || "";
            break;
          case "button":
            content = msg.button?.text || "";
            buttonId = msg.button?.payload || undefined;
            break;
          case "interactive":
            content =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              "";
            buttonId =
              msg.interactive?.button_reply?.id ||
              msg.interactive?.list_reply?.id ||
              undefined;
            break;
          case "image":
            mediaId = msg.image?.id;
            mediaMimeType = msg.image?.mime_type;
            content = msg.image?.caption?.trim() || "[Imagem]";
            if (mediaId) content = `${content}\n[media:image:${mediaId}]`;
            break;
          case "document":
            mediaId = msg.document?.id;
            mediaMimeType = msg.document?.mime_type;
            mediaFilename = msg.document?.filename;
            content =
              msg.document?.caption?.trim() ||
              (mediaFilename ? `[Documento: ${mediaFilename}]` : "[Documento]");
            if (mediaId) content = `${content}\n[media:document:${mediaId}]`;
            break;
          case "audio":
            mediaId = msg.audio?.id;
            mediaMimeType = msg.audio?.mime_type;
            content = msg.audio?.voice ? "[Mensagem de voz]" : "[Audio]";
            if (mediaId) content = `${content}\n[media:audio:${mediaId}]`;
            break;
          case "video":
            mediaId = msg.video?.id;
            mediaMimeType = msg.video?.mime_type;
            content = msg.video?.caption?.trim() || "[Video]";
            if (mediaId) content = `${content}\n[media:video:${mediaId}]`;
            break;
          case "sticker":
            mediaId = msg.sticker?.id;
            mediaMimeType = msg.sticker?.mime_type;
            content = "[Sticker]";
            if (mediaId) content = `${content}\n[media:sticker:${mediaId}]`;
            break;
          case "location": {
            const lat = msg.location?.latitude;
            const lng = msg.location?.longitude;
            const label = msg.location?.name || msg.location?.address;
            if (label && lat != null && lng != null) {
              content = `[Localizacao: ${label} (${lat},${lng})]`;
            } else if (lat != null && lng != null) {
              content = `[Localizacao: ${lat},${lng}]`;
            } else {
              content = "[Localizacao]";
            }
            break;
          }
          case "contacts": {
            const names = (msg.contacts || [])
              .map((c) => c?.name?.formatted_name)
              .filter(Boolean)
              .join(", ");
            content = names ? `[Contato: ${names}]` : "[Contato]";
            break;
          }
          case "reaction": {
            const emoji = msg.reaction?.emoji || "?";
            const ref = msg.reaction?.message_id || "";
            content = `[Reacao: ${emoji}${ref ? ` -> ${ref}` : ""}]`;
            break;
          }
          case "order": {
            const txt = msg.order?.text?.trim();
            content = txt ? `[Pedido] ${txt}` : "[Pedido]";
            break;
          }
          case "system":
            content = msg.system?.body?.trim() || `[Sistema:${msg.system?.type || "evento"}]`;
            break;
          case "unsupported": {
            const errMsg = msg.errors?.[0]?.title || "tipo nao suportado";
            content = `[Mensagem nao suportada: ${errMsg}]`;
            break;
          }
          default:
            // Unknown future type — keep something rather than crash.
            content = `[${msg.type || "desconhecido"}]`;
        }
      } catch (err) {
        console.error(
          `extractOfficialMessageContent: failed to parse message type=${msg.type} id=${msg.id}:`,
          err,
        );
        content = `[${msg.type || "desconhecido"}]`;
      }

      // Final safety net: never propagate empty content.
      if (!content || !content.trim()) {
        content = `[${msg.type || "mensagem"}]`;
      }

      return {
        phone: msg.from,
        content,
        name: contact?.profile?.name || msg.from,
        messageId: msg.id,
        buttonId,
        messageType: msg.type || "unknown",
        mediaId,
        mediaMimeType,
        mediaFilename,
      };
    }
  }

  return null;
}

/**
 * Extract delivery status updates (sent/delivered/read/failed) from a webhook
 * payload. Returns an empty array when none are present. Never throws.
 */
export function extractStatusUpdates(payload: WhatsAppWebhookPayload): WhatsAppStatus[] {
  const out: WhatsAppStatus[] = [];
  if (!payload || payload.object !== "whatsapp_business_account") return out;
  if (!Array.isArray(payload.entry)) return out;
  for (const entry of payload.entry) {
    if (!entry || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!change || change.field !== "messages") continue;
      const statuses = change.value?.statuses;
      if (!statuses || statuses.length === 0) continue;
      for (const s of statuses) {
        if (s && s.id && s.status) out.push(s);
      }
    }
  }
  return out;
}

/**
 * Extract template status updates (APPROVED/REJECTED/etc.) from a webhook
 * payload. Returns an empty array when none are present. Never throws.
 *
 * Requer que o webhook esteja inscrito no campo `message_template_status_update`
 * no painel Meta Developers (aba WhatsApp → Configuração → Webhook).
 */
export function extractTemplateStatusUpdates(
  payload: WhatsAppWebhookPayload,
): MetaTemplateStatusUpdate[] {
  const out: MetaTemplateStatusUpdate[] = [];
  if (!payload || payload.object !== "whatsapp_business_account") return out;
  if (!Array.isArray(payload.entry)) return out;
  for (const entry of payload.entry) {
    if (!entry || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!change || change.field !== "message_template_status_update") continue;
      const v = change.value as any;
      if (!v?.message_template_name) continue;
      out.push({
        event: String(v.event || "").toUpperCase(),
        templateId: v.message_template_id,
        templateName: String(v.message_template_name),
        templateLanguage: v.message_template_language,
        reason: v.reason ?? null,
      });
    }
  }
  return out;
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Normalize phone to digits only (WhatsApp Cloud API format).
 * Input: "+55 11 99999-1234" or "5511999991234" → "5511999991234"
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
