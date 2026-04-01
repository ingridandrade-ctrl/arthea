/**
 * WhatsApp Abstraction Layer
 *
 * Supports two providers:
 *   - "official"  → WhatsApp Business Cloud API (Meta)
 *   - "evolution"  → Evolution API (self-hosted)
 *
 * Set WHATSAPP_PROVIDER in .env to choose. Defaults to "evolution" for
 * backwards compatibility.
 */

import { sendWhatsAppMessage as evolutionSend } from "./evolution";
import { sendTextMessage as officialSend } from "./whatsapp-official";

type Provider = "official" | "evolution";

function getProvider(): Provider {
  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase();
  if (provider === "official") return "official";
  return "evolution";
}

/**
 * Send a WhatsApp text message via the configured provider.
 * Returns the message ID or null on failure.
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<string | null> {
  const provider = getProvider();

  if (provider === "official") {
    return officialSend(phone, message);
  }

  return evolutionSend(phone, message);
}
