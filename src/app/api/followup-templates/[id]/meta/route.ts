import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitMetaTemplate, fetchMetaTemplateStatus, deleteMetaTemplate } from "@/lib/whatsapp-official";
import { convertToMeta } from "@/lib/templates/meta-conversion";

// POST: submeter pra aprovação Meta
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tpl = await prisma.followUpTemplate.findUnique({ where: { id: params.id } });
  if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  if (!tpl.metaName) return NextResponse.json({ error: "Configure o Nome Meta antes (formato snake_case)" }, { status: 400 });
  if (!tpl.metaCategory) return NextResponse.json({ error: "Escolha a categoria Meta (Utility / Marketing / Authentication)" }, { status: 400 });

  const { body, paramOrder, exampleParams } = convertToMeta(tpl.messageTemplate);

  if (body.length > 1024) {
    return NextResponse.json({ error: `Mensagem tem ${body.length} chars — Meta limita a 1024. Encurte antes de submeter.` }, { status: 400 });
  }

  const result = await submitMetaTemplate({
    name: tpl.metaName,
    category: tpl.metaCategory as any,
    language: tpl.metaLanguage,
    body,
    exampleParams,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const updated = await prisma.followUpTemplate.update({
    where: { id: params.id },
    data: {
      metaStatus: result.status || "PENDING",
      metaSubmittedAt: new Date(),
      metaRejectionReason: null,
      metaParamOrder: paramOrder,
    },
  });

  return NextResponse.json(updated);
}

// PUT: atualiza status manualmente (re-poll na Meta)
export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const tpl = await prisma.followUpTemplate.findUnique({ where: { id: params.id } });
  if (!tpl || !tpl.metaName) return NextResponse.json({ error: "Template sem nome Meta" }, { status: 400 });

  const result = await fetchMetaTemplateStatus(tpl.metaName);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const updated = await prisma.followUpTemplate.update({
    where: { id: params.id },
    data: {
      metaStatus: result.status,
      metaRejectionReason: result.rejectionReason || null,
      ...(result.status === "APPROVED" ? { metaApprovedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE: remove o template da Meta (mantém no CRM)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tpl = await prisma.followUpTemplate.findUnique({ where: { id: params.id } });
  if (!tpl || !tpl.metaName) return NextResponse.json({ error: "Sem nome Meta" }, { status: 400 });

  const result = await deleteMetaTemplate(tpl.metaName);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const updated = await prisma.followUpTemplate.update({
    where: { id: params.id },
    data: { metaStatus: null, metaApprovedAt: null, metaSubmittedAt: null, metaRejectionReason: null },
  });

  return NextResponse.json(updated);
}
