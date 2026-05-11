"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Link2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Plug,
  ChevronDown,
  BarChart3,
  EyeOff,
  Eye,
} from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" />
    </svg>
  );
}

interface AdAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string | null;
  businessName: string | null;
  hidden: boolean;
  clientProjectId: string | null;
  clientProject: { id: string; name: string } | null;
}

interface Connection {
  id: string;
  metaUserId: string;
  metaUserName: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  tokenExpiresAt: string | null;
  adAccounts: AdAccount[];
}

interface ProjectOption {
  id: string;
  name: string;
  clientName: string;
}

const STATUS_BANNER: Record<string, { tone: "ok" | "warn" | "err"; text: string }> = {
  connected: { tone: "ok", text: "Conta Meta conectada com sucesso." },
  denied: { tone: "warn", text: "Voce negou a permissao no Facebook. Tente novamente." },
  invalid_state: { tone: "err", text: "Sessao OAuth invalida. Tente reconectar." },
  error: { tone: "err", text: "Erro ao conectar com a Meta. Veja os logs do servidor." },
  unauthorized: { tone: "err", text: "Sessao expirada. Faca login de novo." },
};

export function MetaClient({
  initialConnections,
  projects,
  statusParam,
}: {
  initialConnections: Connection[];
  projects: ProjectOption[];
  statusParam: string | null;
}) {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [openAccount, setOpenAccount] = useState<string | null>(null);
  const [overviews, setOverviews] = useState<Record<string, any>>({});
  const [loadingOverview, setLoadingOverview] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState<Record<string, boolean>>({});

  async function setAccountHidden(adAccountId: string, hidden: boolean) {
    const res = await fetch(`/api/meta/ad-accounts/${adAccountId}/hidden`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error || "Falha ao atualizar visibilidade");
      return;
    }
    setConnections((prev) =>
      prev.map((c) => ({
        ...c,
        adAccounts: c.adAccounts.map((a) =>
          a.id === adAccountId ? { ...a, hidden } : a,
        ),
      })),
    );
  }

  const banner = statusParam ? STATUS_BANNER[statusParam] : null;

  const allAccounts = useMemo(
    () => connections.flatMap((c) => c.adAccounts),
    [connections],
  );

  async function syncAccounts(connectionId: string) {
    setSyncing(connectionId);
    try {
      const res = await fetch("/api/meta/ad-accounts/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Falha ao sincronizar");
        return;
      }
      router.refresh();
    } finally {
      setSyncing(null);
    }
  }

  async function linkAccount(adAccountId: string, clientProjectId: string | null) {
    const res = await fetch(`/api/meta/ad-accounts/${adAccountId}/link`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientProjectId }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e.error || "Falha ao vincular");
      return;
    }
    const updated = await res.json();
    setConnections((prev) =>
      prev.map((c) => ({
        ...c,
        adAccounts: c.adAccounts.map((a) =>
          a.id === adAccountId
            ? {
                ...a,
                clientProjectId: updated.clientProjectId,
                clientProject: updated.clientProject,
              }
            : a,
        ),
      })),
    );
  }

  async function disconnect(connectionId: string) {
    if (!confirm("Desconectar essa conexao Meta? Os ad accounts sincronizados serao removidos.")) {
      return;
    }
    const res = await fetch("/api/meta/oauth/disconnect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    if (!res.ok) {
      alert("Falha ao desconectar");
      return;
    }
    router.refresh();
  }

  async function toggleOverview(adAccountId: string) {
    if (openAccount === adAccountId) {
      setOpenAccount(null);
      return;
    }
    setOpenAccount(adAccountId);
    if (overviews[adAccountId]) return;
    setLoadingOverview(adAccountId);
    try {
      const res = await fetch(`/api/meta/ad-accounts/${adAccountId}/overview`);
      const data = await res.json();
      setOverviews((prev) => ({ ...prev, [adAccountId]: data }));
    } catch {
      // ignore
    } finally {
      setLoadingOverview(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Meta Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte sua conta Meta Business e gerencie as contas de anuncios dos seus clientes.
          </p>
        </div>
        <a
          href="/api/meta/oauth/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-[#0f5dc4] text-white text-sm font-medium transition-colors"
        >
          <FacebookIcon className="w-4 h-4" />
          {connections.length === 0 ? "Conectar com Facebook" : "Adicionar outra conexao"}
        </a>
      </div>

      {banner && (
        <div
          className={
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm " +
            (banner.tone === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : banner.tone === "warn"
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-red-50 text-red-700 border border-red-200")
          }
        >
          {banner.tone === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {banner.text}
        </div>
      )}

      {connections.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center mx-auto mb-4">
            <Plug className="w-7 h-7 text-[#1877F2]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold mb-2">Nenhuma conexao Meta</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Conecte-se com sua conta do Facebook que tem acesso ao Meta Business Manager para puxar
            suas contas de anuncios, ver campanhas e metricas direto aqui.
          </p>
          <a
            href="/api/meta/oauth/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] hover:bg-[#0f5dc4] text-white text-sm font-medium transition-colors"
          >
            <FacebookIcon className="w-4 h-4" />
            Conectar com Facebook
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {connections.map((c) => {
            const expired = c.status !== "ACTIVE";
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                      <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {c.metaUserName || `Meta User ${c.metaUserId}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {expired ? (
                          <span className="text-red-600">Token {c.status.toLowerCase()}, reconecte</span>
                        ) : c.tokenExpiresAt ? (
                          <>Expira em {new Date(c.tokenExpiresAt).toLocaleDateString("pt-BR")}</>
                        ) : (
                          "Sem expiracao registrada"
                        )}
                        {" · "}
                        {c.adAccounts.filter((a) => !a.hidden).length} contas
                        {c.adAccounts.some((a) => a.hidden) && (
                          <>
                            {" · "}
                            <span>{c.adAccounts.filter((a) => a.hidden).length} ocultas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncAccounts(c.id)}
                      disabled={syncing === c.id || expired}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={"w-3.5 h-3.5 " + (syncing === c.id ? "animate-spin" : "")} />
                      Sincronizar
                    </button>
                    <button
                      onClick={() => disconnect(c.id)}
                      className="text-xs text-muted-foreground hover:text-red-600"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>

                {(() => {
                  const visible = c.adAccounts.filter(
                    (a) => !a.hidden || showHidden[c.id],
                  );
                  const hiddenCount = c.adAccounts.filter((a) => a.hidden).length;
                  if (c.adAccounts.length === 0) {
                    return (
                      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma conta de anuncio sincronizada. Clique em "Sincronizar" pra
                        buscar.
                      </div>
                    );
                  }
                  return (
                    <>
                      <ul className="divide-y divide-border">
                        {visible.map((acc) => (
                          <li
                            key={acc.id}
                            className={"px-6 py-4 " + (acc.hidden ? "opacity-50" : "")}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{acc.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    act_{acc.accountId} · {acc.currency || "?"}
                                  </span>
                                  {acc.hidden && (
                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                      Oculta
                                    </span>
                                  )}
                                </div>
                                {acc.businessName && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {acc.businessName}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {!acc.hidden && (
                                  <>
                                    <LinkSelect
                                      value={acc.clientProjectId}
                                      currentLabel={acc.clientProject?.name ?? null}
                                      projects={projects}
                                      onChange={(pid) => linkAccount(acc.id, pid)}
                                    />
                                    <button
                                      onClick={() => toggleOverview(acc.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted"
                                    >
                                      <BarChart3 className="w-3.5 h-3.5" />
                                      {openAccount === acc.id ? "Fechar" : "Ver"}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setAccountHidden(acc.id, !acc.hidden)}
                                  title={acc.hidden ? "Mostrar conta" : "Ocultar conta"}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-sm hover:bg-muted text-muted-foreground"
                                >
                                  {acc.hidden ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {openAccount === acc.id && !acc.hidden && (
                              <OverviewPanel
                                data={overviews[acc.id]}
                                loading={loadingOverview === acc.id}
                                currency={acc.currency}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                      {hiddenCount > 0 && (
                        <button
                          onClick={() =>
                            setShowHidden((s) => ({ ...s, [c.id]: !s[c.id] }))
                          }
                          className="w-full px-6 py-2.5 text-xs text-muted-foreground hover:bg-muted/40 border-t border-border"
                        >
                          {showHidden[c.id]
                            ? "Esconder contas ocultas"
                            : `Mostrar ${hiddenCount} conta${hiddenCount > 1 ? "s" : ""} oculta${hiddenCount > 1 ? "s" : ""}`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            );
          })}

          {allAccounts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Vincule cada conta a um projeto de cliente para que apareca automaticamente no portal
              do cliente correspondente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LinkSelect({
  value,
  currentLabel,
  projects,
  onChange,
}: {
  value: string | null;
  currentLabel: string | null;
  projects: ProjectOption[];
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border " +
          (value
            ? "bg-primary/10 text-primary border-primary/30"
            : "border-dashed border-border text-muted-foreground hover:text-foreground")
        }
      >
        <Link2 className="w-3.5 h-3.5" />
        {currentLabel || "Vincular cliente"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {value && (
              <button
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600 border-b border-border"
              >
                Desvincular
              </button>
            )}
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum projeto de cliente cadastrado.
              </div>
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted " +
                    (value === p.id ? "bg-primary/5 font-medium" : "")
                  }
                >
                  <div>{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.clientName}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function OverviewPanel({
  data,
  loading,
  currency,
}: {
  data: any;
  loading: boolean;
  currency: string | null;
}) {
  if (loading) {
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        Carregando dados da Meta...
      </div>
    );
  }
  if (!data) return null;
  if (data.error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {data.error}
      </div>
    );
  }
  const ins = data.insights;
  const cur = currency || "BRL";
  const fmt = (n: any) =>
    n != null
      ? Number(n).toLocaleString("pt-BR", { style: "currency", currency: cur })
      : "—";
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Gasto (30d)" value={fmt(ins?.spend)} />
        <Metric label="Impressoes" value={ins?.impressions ? Number(ins.impressions).toLocaleString("pt-BR") : "—"} />
        <Metric label="Cliques" value={ins?.clicks ? Number(ins.clicks).toLocaleString("pt-BR") : "—"} />
        <Metric label="CPM" value={ins?.cpm ? fmt(ins.cpm) : "—"} />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Campanhas ({data.campaigns?.length || 0})
        </h3>
        {(!data.campaigns || data.campaigns.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha nessa conta.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Nome</th>
                  <th className="text-left px-3 py-2">Objetivo</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{c.objective || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "text-xs px-2 py-0.5 rounded-full " +
                          (c.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600")
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <a
        href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${data.account?.accountId}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Abrir no Ads Manager <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-muted/30 rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}
