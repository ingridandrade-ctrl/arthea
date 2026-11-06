"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Opcao = { id: string; nome: string };

export type ValoresCliente = {
  nome: string;
  clientUserId: string;
  crm: string;
  metaDatasetId: string;
  crmCampoCodigo: string;
  crmCampoValor: string;
  ativo: boolean;
};

const input = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-card";

export function FormCliente({
  id,
  inicial,
  clientes,
  crms,
}: {
  id?: string;
  inicial: ValoresCliente;
  clientes: Opcao[];
  crms: Opcao[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ValoresCliente>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = <K extends keyof ValoresCliente>(k: K, val: ValoresCliente[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  // Ao escolher um cliente da área Clientes, sugere o nome dele
  const escolherCliente = (cid: string) => {
    const c = clientes.find((x) => x.id === cid);
    setV((prev) => ({ ...prev, clientUserId: cid, nome: prev.nome || c?.nome || "" }));
  };

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const res = await fetch(id ? `/api/rastreamento/clientes/${id}` : "/api/rastreamento/clientes", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, clientUserId: v.clientUserId || null }),
    });
    const data = await res.json().catch(() => ({}));
    setSalvando(false);
    if (!res.ok) {
      setErro(data.error || "Não foi possível salvar.");
      return;
    }
    router.push("/clientes/rastreamento");
    router.refresh();
  }

  async function apagar() {
    if (!id || !confirm("Apagar este cliente do rastreamento? Os eventos dele também serão apagados.")) return;
    setSalvando(true);
    await fetch(`/api/rastreamento/clientes/${id}`, { method: "DELETE" });
    router.push("/clientes/rastreamento");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Cliente da área Clientes</label>
        <select className={input} value={v.clientUserId} onChange={(e) => escolherCliente(e.target.value)}>
          <option value="">— Sem ligação —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Liga este rastreamento ao cliente que já existe na plataforma.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input className={input} value={v.nome} onChange={(e) => set("nome", e.target.value)} required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">CRM que o cliente usa</label>
        <select className={input} value={v.crm} onChange={(e) => set("crm", e.target.value)}>
          {crms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ID do conjunto de dados do Meta</label>
        <input
          className={input}
          inputMode="numeric"
          placeholder="Ex.: 123456789012345"
          value={v.metaDatasetId}
          onChange={(e) => set("metaDatasetId", e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Fica no Gerenciador de Eventos do Meta, em Fontes de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Campo do CRM com o código da campanha</label>
          <input
            className={input}
            placeholder="Ex.: Código da campanha"
            value={v.crmCampoCodigo}
            onChange={(e) => set("crmCampoCodigo", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Campo do CRM com o valor da venda</label>
          <input
            className={input}
            placeholder="Ex.: Valor da venda"
            value={v.crmCampoValor}
            onChange={(e) => set("crmCampoValor", e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Escreva o nome do campo, exatamente como aparece no CRM do cliente — não o código em si. O código de cada
        lead é lido do CRM automaticamente.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={v.ativo} onChange={(e) => set("ativo", e.target.checked)} />
        Rastreamento ativo
      </label>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={salvando}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <Link href="/clientes/rastreamento" className="text-sm text-muted-foreground hover:text-foreground">
          Cancelar
        </Link>
        {id && (
          <button type="button" onClick={apagar} disabled={salvando} className="ml-auto text-sm text-red-600 hover:underline">
            Apagar
          </button>
        )}
      </div>
    </form>
  );
}
