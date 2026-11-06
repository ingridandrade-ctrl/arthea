import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteDoDono, usuarioDoRastreamento } from "@/lib/rastreamento/acesso";
import { cifrar } from "@/lib/rastreamento/cifra";

// PUT /api/rastreamento/clientes/[id]/credenciais
// Body: { crmToken?: string, metaToken?: string, removerCrm?: true, removerMeta?: true }
// Campo ausente ou vazio = mantém a chave atual. A resposta nunca devolve
// as chaves — só as datas em que foram cadastradas. Nada aqui vai para log.

type Ctx = { params: { id: string } };

const limpar = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await usuarioDoRastreamento();
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (!(await clienteDoDono(user.id, params.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const crmToken = limpar(body?.crmToken);
  const metaToken = limpar(body?.metaToken);
  for (const t of [crmToken, metaToken]) {
    if (t && (t.length < 10 || t.length > 1000 || /\s/.test(t))) {
      return NextResponse.json(
        { error: "Chave inválida: confira se copiou a chave inteira, sem espaços." },
        { status: 400 },
      );
    }
  }

  const agora = new Date();
  const data: Record<string, unknown> = {};
  if (crmToken) Object.assign(data, { crmTokenCifrado: cifrar(crmToken), crmTokenAtualizadoEm: agora });
  else if (body?.removerCrm === true) Object.assign(data, { crmTokenCifrado: null, crmTokenAtualizadoEm: null });
  if (metaToken) Object.assign(data, { metaTokenCifrado: cifrar(metaToken), metaTokenAtualizadoEm: agora });
  else if (body?.removerMeta === true) Object.assign(data, { metaTokenCifrado: null, metaTokenAtualizadoEm: null });

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhuma chave informada." }, { status: 400 });
  }

  const c = await prisma.rastreamentoCliente.update({
    where: { id: params.id },
    data,
    select: { crmTokenAtualizadoEm: true, metaTokenAtualizadoEm: true },
  });
  return NextResponse.json(c);
}
