import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import { parseInternalData } from "@/lib/internal-data";

// Atualiza dados internos (contrato, anotações privadas) de um engagement.
// Cliente NUNCA acessa esses dados — só admin/manager via painel da agência.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Aceita updates parciais — o cliente envia só os campos que mudaram
  const incoming = body as Record<string, unknown>;
  const allowed = [
    "contractUrl",
    "contractStartDate",
    "contractEndDate",
    "contractValue",
    "paymentTerms",
    "notes",
  ] as const;

  // Lê o estado atual e mescla
  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: { internalData: true },
  });
  if (!engagement) {
    return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });
  }
  const current = parseInternalData(engagement.internalData);
  const next = { ...current };
  for (const key of allowed) {
    if (key in incoming) {
      const value = incoming[key];
      if (value === null || value === "") {
        (next as any)[key] = null;
      } else if (key === "contractValue") {
        const num = typeof value === "number" ? value : Number(value);
        (next as any)[key] = Number.isFinite(num) ? num : null;
      } else if (typeof value === "string") {
        (next as any)[key] = value;
      }
    }
  }

  const updated = await prisma.clientEngagement.update({
    where: { id: params.id },
    data: { internalData: next as any },
    select: { internalData: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, internalData: updated.internalData, updatedAt: updated.updatedAt });
}
