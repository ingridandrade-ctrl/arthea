import { NextRequest, NextResponse } from "next/server";
import {
  EvolutionWebhookPayload,
  extractMessageContent,
} from "@/lib/evolution";
import { processIncomingMessage } from "@/lib/chatbot/processor";

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json();

    // Only process incoming messages
    if (payload.event !== "messages.upsert") {
      return NextResponse.json({ status: "ignored" });
    }

    const extracted = extractMessageContent(payload);
    if (!extracted) {
      return NextResponse.json({ status: "ignored" });
    }

    const { phone, content, name, messageId } = extracted;

    // Process message asynchronously
    const result = await processIncomingMessage(
      phone,
      content,
      name,
      messageId
    );

    return NextResponse.json({ status: "processed", ...result });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
