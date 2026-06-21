import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

  const { notes, dataConsulta } = body as {
    notes?: unknown;
    dataConsulta?: unknown;
  };

  const patch: Record<string, unknown> = {};
  if (notes !== undefined) {
    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "Campo notes inválido." },
        { status: 400 },
      );
    }
    patch.adminNotes = notes.trim();
  }
  if (dataConsulta !== undefined) {
    if (dataConsulta !== null && typeof dataConsulta !== "string") {
      return NextResponse.json(
        { error: "Campo dataConsulta inválido." },
        { status: 400 },
      );
    }
    if (typeof dataConsulta === "string" && dataConsulta.trim() === "") {
      patch.dataConsulta = null;
    } else {
      patch.dataConsulta = dataConsulta;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Nada para atualizar." },
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
      ...patch,
    };
    await prisma.brescancinResponse.update({
      where: { id: params.id },
      data: { answers: updated as Prisma.InputJsonValue },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar." },
      { status: 500 },
    );
  }
}
