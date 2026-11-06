import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { camposPublicos, usuarioDoRastreamento, validarDadosCliente } from "@/lib/rastreamento/acesso";

// GET  /api/rastreamento/clientes — cadastros do usuário logado
// POST /api/rastreamento/clientes — novo cadastro (dono = usuário logado)

export async function GET() {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const clientes = await prisma.rastreamentoCliente.findMany({
    where: { ownerId: user.id },
    select: camposPublicos,
    orderBy: { nome: "asc" },
  });
  return NextResponse.json({ clientes });
}

export async function POST(req: NextRequest) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const v = await validarDadosCliente(body, false);
  if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });

  const cliente = await prisma.rastreamentoCliente.create({
    data: { ...v.dados, nome: v.dados.nome!, ownerId: user.id },
    select: camposPublicos,
  });
  return NextResponse.json({ cliente }, { status: 201 });
}
