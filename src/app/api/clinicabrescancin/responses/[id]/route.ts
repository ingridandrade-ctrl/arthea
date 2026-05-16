import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBrescancinAdminAuthenticated } from "@/lib/clinicabrescancin/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isBrescancinAdminAuthenticated()) return unauthorized();

  try {
    await prisma.brescancinResponse.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isBrescancinAdminAuthenticated()) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { notes } = body as { notes?: unknown };
  if (typeof notes !== "string") {
    return NextResponse.json(
      { error: "Campo notes ausente ou inválido." },
      { status: 400 },
    );
  }

  try {
    const current = await prisma.brescancinResponse.findUnique({
      where: { id: params.id },
      select: { answers: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Resposta não encontrada." },
        { status: 404 },
      );
    }
    const existingAnswers =
      current.answers && typeof current.answers === "object"
        ? (current.answers as Record<string, unknown>)
        : {};
    const updated = {
      ...existingAnswers,
      adminNotes: notes.trim(),
    };
    await prisma.brescancinResponse.update({
      where: { id: params.id },
      data: { answers: updated },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar." },
      { status: 500 },
    );
  }
}
