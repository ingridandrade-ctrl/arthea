import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  WhatsAppWebhookPayload,
  extractOfficialMessageContent,
  extractStatusUpdates,
  extractTemplateStatusUpdates,
  markAsRead,
} from "@/lib/whatsapp-official";
import { processIncomingMessage } from "@/lib/chatbot/processor";
import { prisma } from "@/lib/prisma";
import { normalizeLeadPhone } from "@/lib/phone";

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
 * Verify Meta's X-Hub-Signature-256 header against the raw request body
 * using WHATSAPP_APP_SECRET. Returns true if either:
 *  - signature is valid, or
 *  - no app secret is configured (verification disabled — log a warning).
 *
 * This guards against forged webhook calls.
 */
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Not configured — accept but log so ops knows verification is off.
    console.warn("WHATSAPP_APP_SECRET not set — skipping webhook signature verification");
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    console.warn("Webhook signature header missing or malformed");
    return false;
  }
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * POST — Receive incoming messages and status updates.
 *
 * Hardening:
 *  - Verifies X-Hub-Signature-256 against WHATSAPP_APP_SECRET (when set)
 *  - Idempotency: skips messages whose `messageId` already exists as
 *    `Message.evolutionMsgId` (Meta retries the same delivery)
 *  - Processes status updates (delivered/read/failed) by logging them and,
 *    when possible, updating any outbound Message that corresponds to the id
 *  - Always returns HTTP 200 — even on error — so Meta does not retry
 */
export async function POST(request: NextRequest) {
  // Read the raw body once so we can both verify the signature and parse JSON.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("WhatsApp webhook: failed to read body:", err);
    return NextResponse.json({ status: "error", reason: "bad_body" }, { status: 200 });
  }

  // Signature verification — guards against forged requests.
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    console.warn("WhatsApp webhook: invalid signature — rejecting");
    // Return 200 anyway: Meta retries on non-2xx, and a forged request
    // re-driving us is worse than silently dropping.
    return NextResponse.json({ status: "invalid_signature" }, { status: 200 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch (err) {
    console.error("WhatsApp webhook: invalid JSON:", err);
    return NextResponse.json({ status: "error", reason: "bad_json" }, { status: 200 });
  }

  try {
    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    // ── Status updates (delivered/read/failed) ────────────────────
    // Currently we just log + persist the latest status on the matching
    // outbound Message, if we can find it. We never throw on this path.
    try {
      const statuses = extractStatusUpdates(payload);
      if (statuses.length > 0) {
        for (const s of statuses) {
          const detail = s.errors && s.errors.length
            ? ` errors=${JSON.stringify(s.errors)}`
            : "";
          console.log(
            `WhatsApp status: id=${s.id} status=${s.status} to=${s.recipient_id}${detail}`,
          );
          // Best-effort: tag the outbound Message content so the UI/audit
          // trail reflects delivery state. We don't add columns here; we
          // append a single-line marker when the status is terminal.
          if (s.status === "failed") {
            const msg = await prisma.message.findFirst({
              where: { evolutionMsgId: s.id },
              select: { id: true, content: true },
            });
            if (msg && !msg.content.includes("[delivery: failed")) {
              const reason = s.errors?.[0]?.title || "unknown";
              await prisma.message.update({
                where: { id: msg.id },
                data: { content: `${msg.content}\n[delivery: failed — ${reason}]` },
              });
            }
          }
        }
      }
    } catch (statusErr) {
      console.error("WhatsApp webhook: status handling failed:", statusErr);
      // Don't abort — keep processing inbound messages below.
    }

    // ── Template status updates (APPROVED/REJECTED/etc) ──────────
    // Requer inscrição no campo `message_template_status_update` no painel
    // Meta Developers. Atualiza FollowUpTemplate.metaStatus na hora — sem
    // isso, o usuário precisava clicar no 🔄 manualmente.
    try {
      const tplUpdates = extractTemplateStatusUpdates(payload);
      for (const u of tplUpdates) {
        console.log(
          `WhatsApp template status: name=${u.templateName} event=${u.event} reason=${u.reason ?? "-"}`,
        );
        const tpl = await prisma.followUpTemplate.findUnique({
          where: { metaName: u.templateName },
          select: { id: true },
        });
        if (!tpl) {
          console.warn(`WhatsApp template status: template ${u.templateName} não existe no CRM — ignorado`);
          continue;
        }
        await prisma.followUpTemplate.update({
          where: { id: tpl.id },
          data: {
            metaStatus: u.event,
            metaRejectionReason: u.event === "REJECTED" ? (u.reason || "Sem motivo informado") : null,
            ...(u.event === "APPROVED" ? { metaApprovedAt: new Date() } : {}),
          },
        });
      }
      if (tplUpdates.length > 0 && !payload.entry.some((e) => e.changes.some((c) => c.field === "messages"))) {
        // Webhook só de template update — não tem mensagem pra processar
        return NextResponse.json({ status: "template_status_processed", count: tplUpdates.length });
      }
    } catch (tplErr) {
      console.error("WhatsApp webhook: template status handling failed:", tplErr);
    }

    const extracted = extractOfficialMessageContent(payload);
    if (!extracted) {
      return NextResponse.json({ status: "no_message" });
    }

    const { phone, content, name, messageId, buttonId, messageType } = extracted;

    // ── Idempotency ──────────────────────────────────────────────
    // Meta retries deliveries on any non-2xx (and occasionally even on 2xx).
    // If we've already stored this messageId, ack and skip.
    if (messageId) {
      try {
        const existing = await prisma.message.findFirst({
          where: { evolutionMsgId: messageId },
          select: { id: true },
        });
        if (existing) {
          console.log(`WhatsApp webhook: duplicate delivery for ${messageId} — skipping`);
          return NextResponse.json({ status: "duplicate", messageId });
        }
      } catch (dupErr) {
        // If the idempotency check itself fails, fall through and let
        // processing try; worst case we get a duplicate Message row.
        console.error("WhatsApp webhook: idempotency check failed:", dupErr);
      }
    }

    // Mark as read (non-blocking, swallow errors)
    markAsRead(messageId).catch((err) =>
      console.error("WhatsApp markAsRead failed:", err?.message || err),
    );

    // Process through the chatbot pipeline (saves history, cancels flows, etc).
    // Wrapped: a processor failure must not 5xx the webhook.
    let result: unknown = null;
    try {
      result = await processIncomingMessage(phone, content, name, messageId);
    } catch (procErr) {
      console.error(
        `WhatsApp processIncomingMessage failed (phone=${phone}, type=${messageType}):`,
        procErr,
      );
      result = { handled: false, reason: "processor_error" };
    }

    // If it was a button click, fire the configured actions (fire-and-forget).
    if (buttonId) {
      try {
        const lead = await prisma.lead.findUnique({
          where: { phone: normalizeLeadPhone(phone) },
          select: { id: true },
        });
        if (lead) {
          const { handleButtonClick } = await import("@/lib/flows/button-handler");
          handleButtonClick({ leadId: lead.id, buttonId }).catch((err) =>
            console.error("handleButtonClick falhou:", err),
          );
        } else {
          console.warn(
            `WhatsApp webhook: buttonId=${buttonId} but no lead found for phone=${phone}`,
          );
        }
      } catch (btnErr) {
        console.error("WhatsApp webhook: button dispatch failed:", btnErr);
      }
    }

    return NextResponse.json({ status: "processed", messageType, result });
  } catch (error) {
    console.error("WhatsApp Official webhook error:", error);
    // Always return 200 to avoid Meta retries
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
