"use client";

import { useState } from "react";
import { Eye, KeyRound, Loader2, Save } from "lucide-react";

// Conta do cliente — acesso à área de membros (portal) no NÍVEL DO CLIENTE.
// Subiu do projeto (ClientAccountSection) por decisão da Ingrid: login do
// portal é da empresa, não de um projeto específico.
export function ContaAccessCard({
  clientId,
  email,
  scenesEnabled,
  previewEngagementId,
}: {
  clientId: string;
  email: string;
  scenesEnabled: boolean;
  previewEngagementId: string | null;
}) {
  const [form, setForm] = useState({ email, password: "", scenesEnabled });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/clientes/${clientId}/account`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password || undefined,
        scenesEnabled: form.scenesEnabled,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error || "Falha ao salvar." });
      return;
    }
    setMsg({ ok: true, text: "Salvo. O cliente já pode entrar com os novos dados." });
    setForm((f) => ({ ...f, password: "" }));
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Acesso à área de membros
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            E-mail e senha que o cliente usa pra entrar no portal.
          </p>
        </div>
        {previewEngagementId && (
          <a
            href={`/api/portal-preview?engagementId=${previewEngagementId}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground/80 hover:text-foreground hover:border-foreground/30 transition"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
            Ver como o cliente vê
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">E-mail de acesso</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">
            Nova senha <span className="font-normal">(deixe vazio pra manter)</span>
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={form.scenesEnabled}
          onChange={(e) => setForm((f) => ({ ...f, scenesEnabled: e.target.checked }))}
          className="w-4 h-4 accent-[var(--accent)]"
        />
        <span className="text-sm">Acervo de cenas habilitado pra este cliente</span>
      </label>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Salvando…" : "Salvar acesso"}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>
        )}
      </div>

      <p className="text-[10.5px] font-mono text-muted-foreground mt-5 pt-4 border-t border-border">
        ID do cliente: {clientId}
      </p>
    </div>
  );
}
