import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteDoDono, usuarioDoRastreamento } from "@/lib/rastreamento/acesso";

// GET /api/rastreamento/clientes/[id]/etapas — mapeamento atual
// PUT /api/rastreamento/clientes/[id]/etapas — substitui o mapeamento inteiro
// Body: { etapas: [{ etapaCrm: string, tipo: "nenhum"|"lead_qualificado"|"compra" }] }

type Ctx = { params: { id: string } };
const TIPOS = ["nenhum", "lead_qualificado", "compra"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (!(await clienteDoDono(user.id, params.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  const etapas = await prisma.rastreamentoEtapa.findMany({
    where: { clienteId: params.id },
    select: { etapaCrm: true, tipo: true },
    orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ etapas });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (!(await clienteDoDono(user.id, params.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body?.etapas) || body.etapas.length > 100) {
    return NextResponse.json({ error: "Lista de etapas inválida." }, { status: 400 });
  }

  const vistas = new Set<string>();
  const etapas: { etapaCrm: string; tipo: string }[] = [];
  for (const e of body.etapas) {
    const nome = typeof e?.etapaCrm === "string" ? e.etapaCrm.trim().slice(0, 120) : "";
    if (!nome) continue;
    if (!TIPOS.includes(e?.tipo)) {
      return NextResponse.json({ error: `Tipo inválido na etapa "${nome}".` }, { status: 400 });
    }
    const chave = nome.toLocaleLowerCase("pt-BR");
    if (vistas.has(chave)) {
      return NextResponse.json({ error: `A etapa "${nome}" aparece duas vezes.` }, { status: 400 });
    }
    vistas.add(chave);
    etapas.push({ etapaCrm: nome, tipo: e.tipo });
  }

  await prisma.$transaction([
    prisma.rastreamentoEtapa.deleteMany({ where: { clienteId: params.id } }),
    prisma.rastreamentoEtapa.createMany({
      data: etapas.map((e, i) => ({ ...e, ordem: i, clienteId: params.id })),
    }),
  ]);
  return NextResponse.json({ etapas });
}
