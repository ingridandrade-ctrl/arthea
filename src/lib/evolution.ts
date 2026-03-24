import axios from "axios";

const api = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
  },
});

const instance = process.env.EVOLUTION_INSTANCE || "arthea";

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<string | null> {
  try {
    const response = await api.post(`/message/sendText/${instance}`, {
      number: phone,
      text: message,
    });
    return response.data?.key?.id || null;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return null;
  }
}

export async function getInstanceStatus(): Promise<string> {
  try {
    const response = await api.get(`/instance/connectionState/${instance}`);
    return response.data?.state || "unknown";
  } catch {
    return "disconnected";
  }
}

export async function getQRCode(): Promise<string | null> {
  try {
    const response = await api.get(`/instance/connect/${instance}`);
    return response.data?.base64 || null;
  } catch {
    return null;
  }
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    pushName?: string;
    messageTimestamp?: number;
  };
}

export function extractMessageContent(payload: EvolutionWebhookPayload): {
  phone: string;
  content: string;
  name: string;
  messageId: string;
  fromMe: boolean;
} | null {
  const { data } = payload;

  if (!data?.key?.remoteJid || data.key.fromMe) return null;

  const phone = data.key.remoteJid.replace("@s.whatsapp.net", "");
  const content =
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    "";

  if (!content) return null;

  return {
    phone,
    content,
    name: data.pushName || phone,
    messageId: data.key.id,
    fromMe: data.key.fromMe,
  };
}
