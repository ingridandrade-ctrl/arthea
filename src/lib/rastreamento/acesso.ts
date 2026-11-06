import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCrmValido } from "./crm";

// Quem pode usar o módulo: usuários da agência ADMIN/MANAGER (mesma regra
// da área Clientes). Cada um só enxerga os cadastros dos quais é dono.

export type UsuarioRastreamento = { id: string; role: string };

export async function usuarioDoRastreamento(): Promise<UsuarioRastreamento | null> {
  const session = (await getServerSession(authOptions)) as any;
  const id = session?.user?.id as string | undefined;
  const role = session?.user?.role as string | undefined;
  if (!id || (role !== "ADMIN" && role !== "MANAGER")) return null;
  return { id, role };
}

// Busca um cadastro garantindo que pertence ao usuário. Devolve null tanto
// para "não existe" quanto para "é de outro usuário" — de propósito, para
// não revelar a existência de cadastros alheios.
export function clienteDoDono(ownerId: string, id: string) {
  return prisma.rastreamentoCliente.findFirst({ where: { id, ownerId } });
}

const texto = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export type DadosCliente = {
  nome?: string;
  clientUserId?: string | null;
  crm?: string;
  metaDatasetId?: string | null;
  crmCampoCodigo?: string | null;
  crmCampoValor?: string | null;
  ativo?: boolean;
};

// Valida o corpo vindo da tela. `parcial` = edição (só o que veio muda).
export async function validarDadosCliente(
  body: any,
  parcial: boolean,
): Promise<{ ok: true; dados: DadosCliente } | { ok: false; erro: string }> {
  const dados: DadosCliente = {};

  if (!parcial || "nome" in body) {
    const nome = texto(body?.nome, 120);
    if (!nome) return { ok: false, erro: "Informe o nome do cliente." };
    dados.nome = nome;
  }
  if (!parcial || "crm" in body) {
    const crm = body?.crm ?? "rd_station";
    if (!isCrmValido(crm)) return { ok: false, erro: "CRM não suportado." };
    dados.crm = crm;
  }
  if (!parcial || "metaDatasetId" in body) {
    const ds = texto(body?.metaDatasetId, 40);
    if (ds && !/^\d{5,30}$/.test(ds)) {
      return { ok: false, erro: "O ID do conjunto de dados do Meta tem só números." };
    }
    dados.metaDatasetId = ds;
  }
  if (!parcial || "crmCampoCodigo" in body) dados.crmCampoCodigo = texto(body?.crmCampoCodigo);
  if (!parcial || "crmCampoValor" in body) dados.crmCampoValor = texto(body?.crmCampoValor);
  if ("ativo" in (body ?? {})) dados.ativo = body.ativo !== false;

  if (!parcial || "clientUserId" in body) {
    const cid = texto(body?.clientUserId, 60);
    if (cid) {
      const u = await prisma.user.findUnique({ where: { id: cid }, select: { role: true } });
      if (!u || u.role !== "CLIENT") {
        return { ok: false, erro: "Cliente da área Clientes não encontrado." };
      }
    }
    dados.clientUserId = cid;
  }

  return { ok: true, dados };
}

// Campos que podem ir para a tela. Tokens (etapa 3) nunca entram aqui.
export const camposPublicos = {
  id: true,
  nome: true,
  crm: true,
  metaDatasetId: true,
  crmCampoCodigo: true,
  crmCampoValor: true,
  ativo: true,
  teste: true,
  clientUserId: true,
  clientUser: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;
