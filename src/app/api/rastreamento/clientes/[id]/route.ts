import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  camposPublicos,
  clienteDoDono,
  usuarioDoRastreamento,
  validarDadosCliente,
} from "@/lib/rastreamento/acesso";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const cliente = await prisma.rastreamentoCliente.findFirst({
    where: { id: params.id, ownerId: user.id },
    select: camposPublicos,
  });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ cliente });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (!(await clienteDoDono(user.id, params.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const v = await validarDadosCliente(body, true);
  if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });

  const cliente = await prisma.rastreamentoCliente.update({
    where: { id: params.id },
    data: v.dados,
    select: camposPublicos,
  });
  return NextResponse.json({ cliente });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (!(await clienteDoDono(user.id, params.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  await prisma.rastreamentoCliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
