"use client";

import { useState } from "react";
import { ListChecks, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

type Etapa = { etapaCrm: string; tipo: string };

const TIPOS = [
  { id: "nenhum", nome: "Nenhum" },
  { id: "lead_qualificado", nome: "Lead qualificado" },
  { id: "compra", nome: "Compra" },
];

const input = "px-3 py-2 border border-border rounded-lg text-sm bg-card";

export function EtapasCard({ id, crmNome, inicial }: { id: string; crmNome: string; inicial: Etapa[] }) {
  const [etapas, setEtapas] = useState<Etapa[]>(inicial);
  const [nova, setNova] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [alterado, setAlterado] = useState(false);

  const mudar = (lista: Etapa[]) => {
    setEtapas(lista);
    setAlterado(true);
    setMsg(null);
  };

  function adicionar() {
    const nome = nova.trim();
    if (!nome) return;
    if (etapas.some((e) => e.etapaCrm.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      setMsg({ ok: false, texto: "Essa etapa já está na lista." });
      return;
    }
    mudar([...etapas, { etapaCrm: nome, tipo: "nenhum" }]);
    setNova("");
  }

  function mover(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= etapas.length) return;
    const l = [...etapas];
    [l[i], l[j]] = [l[j], l[i]];
    mudar(l);
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const res = await fetch(`/api/rastreamento/clientes/${id}/etapas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapas }),
    });
    const data = await res.json().catch(() => ({}));
    setSalvando(false);
    if (!res.ok) {
      setMsg({ ok: false, texto: data.error || "Não foi possível salvar." });
      return;
    }
    setEtapas(data.etapas);
    setAlterado(false);
    setMsg({ ok: true, texto: "Mapeamento salvo." });
  }

  const qualificados = etapas.filter((e) => e.tipo === "lead_qualificado").length;
  const compras = etapas.filter((e) => e.tipo === "compra").length;

  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Etapas do funil
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Escreva as etapas com o nome exato que aparece no {crmNome} e diga o que cada uma vale. Quando uma
          oportunidade chega numa etapa de Lead qualificado ou Compra, o evento vai para o Meta.
        </p>
      </div>

      {etapas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {etapas.map((e, i) => (
            <li key={e.etapaCrm} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button type="button" aria-label="Subir" onClick={() => mover(i, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" aria-label="Descer" onClick={() => mover(i, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === etapas.length - 1}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="flex-1 min-w-0 text-sm truncate">{e.etapaCrm}</span>
              <select
                className={`${input} w-44`}
                value={e.tipo}
                onChange={(ev) => mudar(etapas.map((x, k) => (k === i ? { ...x, tipo: ev.target.value } : x)))}
              >
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Remover ${e.etapaCrm}`}
                onClick={() => mudar(etapas.filter((_, k) => k !== i))}
                className="text-muted-foreground hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          className={`${input} flex-1`}
          placeholder="Nome da etapa no CRM, ex.: Proposta enviada"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <button
          type="button"
          onClick={adicionar}
          className="inline-flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm hover:border-foreground/30"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {qualificados} etapa(s) de Lead qualificado · {compras} etapa(s) de Compra
        {etapas.length > 0 && compras === 0 ? " · nenhuma etapa gera Compra ainda" : ""}
      </p>

      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.texto}</p>}

      <button
        type="button"
        disabled={salvando || !alterado}
        onClick={salvar}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {salvando ? "Salvando…" : "Salvar etapas"}
      </button>
    </section>
  );
}
