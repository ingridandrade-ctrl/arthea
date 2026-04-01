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
  value: {
    messaging_product: string;
    metadata: {
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
  image?: { id: string; caption?: string };
  document?: { id: string; filename?: string; caption?: string };
  audio?: { id: string };
  video?: { id: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string };
  button?: { text: string; payload: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

interface WhatsAppStatus {
  id: string;
  status: string; // "sent" | "delivered" | "read" | "failed"
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string }[];
}

// ─── Extract Message Content ─────────────────────────────────────

export function extractOfficialMessageContent(payload: WhatsAppWebhookPayload): {
  phone: string;
  content: string;
  name: string;
  messageId: string;
} | null {
  if (payload.object !== "whatsapp_business_account") return null;

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const messages = change.value.messages;
      const contacts = change.value.contacts;

      if (!messages || messages.length === 0) continue;

      const msg = messages[0];
      const contact = contacts?.[0];

      // Extract text content from various message types
      let content = "";
      switch (msg.type) {
        case "text":
          content = msg.text?.body || "";
          break;
        case "button":
          content = msg.button?.text || "";
          break;
        case "interactive":
          content =
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            "";
          break;
        case "image":
          content = msg.image?.caption || "[Imagem]";
          break;
        case "document":
          content = msg.document?.caption || "[Documento]";
          break;
        case "audio":
          content = "[Audio]";
          break;
        case "video":
          content = msg.video?.caption || "[Video]";
          break;
        case "location":
          content = msg.location?.name || "[Localizacao]";
          break;
        default:
          content = `[${msg.type}]`;
      }

      if (!content) continue;

      return {
        phone: msg.from,
        content,
        name: contact?.profile?.name || msg.from,
        messageId: msg.id,
      };
    }
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Normalize phone to digits only (WhatsApp Cloud API format).
 * Input: "+55 11 99999-1234" or "5511999991234" → "5511999991234"
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
