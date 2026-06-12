"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  ExternalLink,
} from "lucide-react";

type Status = "ACTIVE" | "EXPIRED" | "REVOKED";

interface ConnectionState {
  id: string;
  status: Status;
  mccCustomerId: string;
  updatedAt: string;
}

interface AccountState {
  id: string;
  customerId: string;
  name: string;
  currencyCode: string;
  engagementId: string | null;
  engagement: { id: string; name: string; clientName: string } | null;
}

interface EngagementOption {
  id: string;
  name: string;
  clientName: string;
}

export function GoogleAdsAdmin({
  initialConnection,
  initialAccounts,
  engagements,
}: {
  initialConnection: ConnectionState | null;
  initialAccounts: AccountState[];
  engagements: EngagementOption[];
}) {
  const router = useRouter();
  const [connection, setConnection] = useState<ConnectionState | null>(initialConnection);
  const [accounts, setAccounts] = useState<AccountState[]>(initialAccounts);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingLink, setSavingLink] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/google-ads/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: "err", text: data.error || "Falha ao conectar" });
      } else {
        setFeedback({ tone: "ok", text: "Conexão Google Ads válida — env vars OK." });
        router.refresh();
      }
    } catch (e: any) {
      setFeedback({ tone: "err", text: e.message || "Erro de rede" });
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/google-ads/accounts/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: "err", text: data.error || "Falha ao sincronizar" });
      } else {
        setFeedback({
          tone: "ok",
          text: `${data.total} contas sincronizadas (${data.created} novas, ${data.updated} atualizadas).`,
        });
        router.refresh();
      }
    } catch (e: any) {
      setFeedback({ tone: "err", text: e.message || "Erro de rede" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleLink(accountId: string, engagementId: string | null) {
    setSavingLink(accountId);
    try {
      const res = await fetch(`/api/google-ads/accounts/${accountId}/link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ engagementId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: "err", text: data.error || "Falha ao linkar" });
        return;
      }
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? {
                ...a,
                engagementId,
                engagement: engagementId
                  ? (() => {
                      const e = engagements.find((x) => x.id === engagementId);
                      return e ? { id: e.id, name: e.name, clientName: e.clientName } : null;
                    })()
                  : null,
              }
            : a,
        ),
      );
    } finally {
      setSavingLink(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Ads</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conecte o MCC da Arthea, sincronize as contas vinculadas e linke cada uma à frente
          correspondente. Os dados aparecem em <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/portal/[frente]/dashboard</code> do cliente.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
            feedback.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.tone === "ok" ? (
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Connection card */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Conexão</p>
            {connection ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <StatusDot status={connection.status} />
                  <span className="text-sm font-medium text-gray-900">
                    {connection.status === "ACTIVE"
                      ? "Ativa"
                      : connection.status === "EXPIRED"
                        ? "Expirada"
                        : "Revogada"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  MCC <code className="bg-gray-100 px-1.5 py-0.5 rounded">{connection.mccCustomerId}</code>
                  <span className="mx-2">·</span>
                  Atualizada em {new Date(connection.updatedAt).toLocaleString("pt-BR")}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Ainda não conectado.</p>
            )}
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D4A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3838] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plug size={14} />
            )}
            {connection ? "Reconectar" : "Conectar"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          As credenciais (refresh token, client secret, developer token) ficam só em env vars na Vercel.
          Clicar aqui faz uma chamada de teste à Google Ads API pra validar.
        </p>
      </section>

      {/* Accounts card */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contas</p>
            <h2 className="text-base font-semibold text-gray-900 mt-1">
              {accounts.length} {accounts.length === 1 ? "conta vinculada" : "contas vinculadas"} ao MCC
            </h2>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || !connection || connection.status !== "ACTIVE"}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            Sincronizar contas
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Nenhuma conta sincronizada ainda. Clique em <strong>Sincronizar contas</strong> acima
            depois de conectar.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {accounts.map((a) => (
              <li key={a.id} className="py-3 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {a.customerId} · {a.currencyCode}
                  </p>
                </div>
                <div className="flex items-center gap-2 min-w-[300px]">
                  <Link2 size={14} className="text-gray-400 flex-shrink-0" />
                  <select
                    value={a.engagementId || ""}
                    onChange={(e) => handleLink(a.id, e.target.value || null)}
                    disabled={savingLink === a.id}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-[#0D4A4A] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">— Sem frente vinculada —</option>
                    {engagements.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.clientName} · {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                {a.engagement && (
                  <a
                    href={`/clientes/portal/${a.engagement.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#0D4A4A] hover:underline"
                  >
                    Ver frente <ExternalLink size={11} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "ACTIVE" ? "bg-green-500" : status === "EXPIRED" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}
