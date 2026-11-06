import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usuarioDoRastreamento } from "@/lib/rastreamento/acesso";

// POST   — cria 2 clientes sintéticos (com etapas de exemplo) para testar
// DELETE — apaga todos os dados de teste do usuário logado
// Dados sintéticos: sem ligação com a área Clientes, sem telefone, sem token.

const EXEMPLOS = [
  {
    nome: "[Teste] Clínica Sorriso",
    metaDatasetId: "100000000000001",
    crmCampoCodigo: "Código da campanha",
    crmCampoValor: "Valor da venda",
    etapas: [
      ["Novo lead", "nenhum"],
      ["Em atendimento", "nenhum"],
      ["Consulta agendada", "lead_qualificado"],
      ["Tratamento fechado", "compra"],
    ],
  },
  {
    nome: "[Teste] Loja Bella Moda",
    metaDatasetId: "100000000000002",
    crmCampoCodigo: "Código da campanha",
    crmCampoValor: "Valor do pedido",
    etapas: [
      ["Contato inicial", "nenhum"],
      ["Orçamento enviado", "lead_qualificado"],
      ["Pedido pago", "compra"],
    ],
  },
] as const;

export async function POST() {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const ja = await prisma.rastreamentoCliente.count({ where: { ownerId: user.id, teste: true } });
  if (ja > 0) return NextResponse.json({ ok: true, criados: 0 });

  for (const ex of EXEMPLOS) {
    await prisma.rastreamentoCliente.create({
      data: {
        ownerId: user.id,
        nome: ex.nome,
        crm: "rd_station",
        metaDatasetId: ex.metaDatasetId,
        crmCampoCodigo: ex.crmCampoCodigo,
        crmCampoValor: ex.crmCampoValor,
        teste: true,
        etapas: { create: ex.etapas.map(([etapaCrm, tipo], ordem) => ({ etapaCrm, tipo, ordem })) },
      },
    });
  }
  return NextResponse.json({ ok: true, criados: EXEMPLOS.length });
}

export async function DELETE() {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const r = await prisma.rastreamentoCliente.deleteMany({ where: { ownerId: user.id, teste: true } });
  return NextResponse.json({ ok: true, apagados: r.count });
}
