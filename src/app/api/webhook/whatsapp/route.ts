import { NextRequest, NextResponse } from "next/server";
import {
  WhatsAppWebhookPayload,
  extractOfficialMessageContent,
  markAsRead,
} from "@/lib/whatsapp-official";
import { processIncomingMessage } from "@/lib/chatbot/processor";

/**
 * GET — Webhook verification (required by Meta).
 *
 * Meta sends a GET request with:
 *   hub.mode=subscribe
 *   hub.verify_token=<your WHATSAPP_VERIFY_TOKEN>
 *   hub.challenge=<random string>
 *
 * You must return the challenge value to confirm.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Receive incoming messages and status updates.
 */
export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await request.json();

    // Always return 200 quickly to Meta (they retry on non-200)
    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    const extracted = extractOfficialMessageContent(payload);
    if (!extracted) {
      return NextResponse.json({ status: "no_message" });
    }

    const { phone, content, name, messageId } = extracted;

    // Mark as read (non-blocking)
    markAsRead(messageId).catch(() => {});

    // Process through the chatbot pipeline
    const result = await processIncomingMessage(
      phone,
      content,
      name,
      messageId
    );

    return NextResponse.json({ status: "processed", ...result });
  } catch (error) {
    console.error("WhatsApp Official webhook error:", error);
    // Always return 200 to avoid Meta retries
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
