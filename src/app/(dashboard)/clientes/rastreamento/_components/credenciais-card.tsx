"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2, CircleDashed } from "lucide-react";

type Datas = { crmTokenAtualizadoEm: string | null; metaTokenAtualizadoEm: string | null };

const input = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-card font-mono";

function Situacao({ data }: { data: string | null }) {
  return data ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
      <CheckCircle2 className="w-3.5 h-3.5" /> Cadastrada em {new Date(data).toLocaleDateString("pt-BR")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
      <CircleDashed className="w-3.5 h-3.5" /> Não cadastrada
    </span>
  );
}

export function CredenciaisCard({ id, crmNome, inicial }: { id: string; crmNome: string; inicial: Datas }) {
  const [datas, setDatas] = useState<Datas>(inicial);
  const [crmToken, setCrmToken] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function enviar(body: Record<string, unknown>) {
    setSalvando(true);
    setMsg(null);
    const res = await fetch(`/api/rastreamento/clientes/${id}/credenciais`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSalvando(false);
    if (!res.ok) {
      setMsg({ ok: false, texto: data.error || "Não foi possível salvar." });
      return;
    }
    setDatas(data);
    setCrmToken("");
    setMetaToken("");
    setMsg({ ok: true, texto: "Chaves atualizadas." });
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Chaves de acesso
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ficam guardadas cifradas e nunca aparecem de novo na tela. Para trocar, cole a nova chave.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Token da API do {crmNome}</label>
          <Situacao data={datas.crmTokenAtualizadoEm} />
        </div>
        <input
          className={input}
          type="password"
          autoComplete="off"
          placeholder={datas.crmTokenAtualizadoEm ? "•••••••• (cole para trocar)" : "Cole o token aqui"}
          value={crmToken}
          onChange={(e) => setCrmToken(e.target.value)}
        />
        {datas.crmTokenAtualizadoEm && (
          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => enviar({ removerCrm: true })}>
            Remover chave do CRM
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Token da API de Conversões do Meta</label>
          <Situacao data={datas.metaTokenAtualizadoEm} />
        </div>
        <input
          className={input}
          type="password"
          autoComplete="off"
          placeholder={datas.metaTokenAtualizadoEm ? "•••••••• (cole para trocar)" : "Cole o token aqui"}
          value={metaToken}
          onChange={(e) => setMetaToken(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Gerado no Gerenciador de Eventos do Meta, no conjunto de dados do cliente, em Configurações.
        </p>
        {datas.metaTokenAtualizadoEm && (
          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => enviar({ removerMeta: true })}>
            Remover chave do Meta
          </button>
        )}
      </div>

      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.texto}</p>}

      <button
        type="button"
        disabled={salvando || (!crmToken.trim() && !metaToken.trim())}
        onClick={() => enviar({ crmToken, metaToken })}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {salvando ? "Salvando…" : "Salvar chaves"}
      </button>
    </section>
  );
}
