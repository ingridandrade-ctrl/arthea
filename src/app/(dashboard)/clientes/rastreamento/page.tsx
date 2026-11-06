import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, CheckCircle2, CircleDashed } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { usuarioDoRastreamento } from "@/lib/rastreamento/acesso";
import { nomeDoCrm } from "@/lib/rastreamento/crm";
import { BotoesTeste } from "./_components/botoes-teste";

// Lista dos clientes com rastreamento de vendas (WhatsApp → CRM → Meta).
// Só aparecem os cadastros do usuário logado.

export default async function RastreamentoPage() {
  const user = await usuarioDoRastreamento();
  if (!user) redirect("/inicio");

  const clientes = await prisma.rastreamentoCliente.findMany({
    where: { ownerId: user.id },
    include: {
      clientUser: { select: { name: true } },
      _count: { select: { etapas: true, eventos: true } },
    },
    orderBy: { nome: "asc" },
  });
  const temTeste = clientes.some((c) => c.teste);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento de vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vendas e leads qualificados do CRM de cada cliente, enviados ao Meta.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BotoesTeste temTeste={temTeste} />
          <Link
            href="/clientes/rastreamento/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </Link>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">Nenhum cliente com rastreamento ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre um cliente ou crie 2 clientes de teste para conhecer as telas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => {
            const pendencias = [
              !c.metaDatasetId && "conjunto de dados do Meta",
              !c.crmCampoCodigo && "campo do código",
              !c.crmCampoValor && "campo do valor",
            ].filter(Boolean) as string[];
            return (
              <Link
                key={c.id}
                href={`/clientes/rastreamento/${c.id}`}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold truncate">{c.nome}</h3>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      c.ativo ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.ativo ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {nomeDoCrm(c.crm)}
                  {c.clientUser ? ` · ${c.clientUser.name}` : " · sem ligação com a área Clientes"}
                </p>
                <div className="mt-4 text-xs space-y-1">
                  {pendencias.length === 0 ? (
                    <p className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cadastro completo
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-amber-700">
                      <CircleDashed className="w-3.5 h-3.5" /> Falta: {pendencias.join(", ")}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {c._count.etapas} etapas mapeadas · {c._count.eventos} eventos
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
