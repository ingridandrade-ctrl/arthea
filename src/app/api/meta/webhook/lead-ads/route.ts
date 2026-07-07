import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getLeadById } from "@/lib/meta/api";
import { normalizeLeadPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const mode = search.get("hub.mode");
  const token = search.get("hub.verify_token");
  const challenge = search.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

function pickField(fields: { name: string; values: string[] }[], keys: string[]): string | null {
  for (const key of keys) {
    const f = fields.find((x) => x.name.toLowerCase() === key);
    if (f && f.values?.[0]) return f.values[0];
  }
  return null;
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "page") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen") continue;
      const value = change.value || {};
      const leadgenId: string | undefined = value.leadgen_id;
      const pageId: string | undefined = value.page_id;
      const formId: string | undefined = value.form_id;
      if (!leadgenId) continue;

      try {
        const form = formId
          ? await prisma.metaLeadAdsForm.findFirst({
              where: { formId },
              include: { adAccount: { include: { connection: true, lead: true } } },
            })
          : null;

        const accessToken = form?.adAccount.connection.accessToken
          ?? (await firstActiveAccessToken());

        if (!accessToken) {
          console.error("Lead Ads webhook: no access token available for leadgen", leadgenId);
          continue;
        }

        const detail = await getLeadById(accessToken, leadgenId);
        const name = pickField(detail.field_data, ["full_name", "name", "first_name"]) || "Sem nome";
        const rawPhone = pickField(detail.field_data, ["phone_number", "phone"]);
        // Mantém o fallback `meta:${leadgenId}` se não veio telefone — é
        // sentinel pra não-real phone, não normaliza.
        const phone = rawPhone ? normalizeLeadPhone(rawPhone) : `meta:${leadgenId}`;
        const email = pickField(detail.field_data, ["email"]);
        const company = pickField(detail.field_data, ["company_name", "company"]);

        const upserted = await prisma.lead.upsert({
          where: { phone },
          create: {
            name,
            phone,
            email,
            company,
            source: "WEBSITE",
            tags: ["meta-lead-ads"],
            notes: `Lead Ads (form ${formId ?? "?"}, page ${pageId ?? "?"}, leadgen ${leadgenId})`,
            utmSource: "facebook",
            utmMedium: "lead_ads",
            utmCampaign: detail.campaign_id ?? null,
          },
          update: {
            tags: { push: "meta-lead-ads" },
          },
          select: { id: true, name: true, phone: true, company: true, createdAt: true, updatedAt: true },
        });
        // Notifica admin se foi criação (não update). updatedAt === createdAt
        // num row recém-criado pelo upsert.
        const isNew = upserted.createdAt.getTime() === upserted.updatedAt.getTime();
        if (isNew) {
          const { notifyNewLead } = await import("@/lib/notifications/new-lead");
          notifyNewLead({
            leadId: upserted.id,
            leadName: upserted.name,
            leadPhone: upserted.phone,
            leadCompany: upserted.company,
            source: "WEBSITE",
          }).catch(() => {});
        }
      } catch (err: any) {
        console.error("Lead Ads webhook error:", err?.response?.data || err.message);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function firstActiveAccessToken(): Promise<string | null> {
  const conn = await prisma.metaConnection.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return conn?.accessToken ?? null;
}
