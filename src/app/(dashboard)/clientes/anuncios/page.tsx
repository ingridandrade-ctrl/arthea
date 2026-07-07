import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RadioTower } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getAdsOverview, type AdsHealthStatus } from "@/lib/ads-overview";

export const dynamic = "force-dynamic";

// Torre de controle — saúde dos anúncios de todos os clientes num relance.
// Últimos 30 dias, cache de 1h por projeto.

const STATUS_META: Record<
  AdsHealthStatus,
  { label: string; dot: string; chip: string }
> = {
  bad: { label: "Corrigir", dot: "bg-red-500", chip: "bg-red-500/10 text-red-600" },
  warn: { label: "Atenção", dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-600" },
  ok: { label: "Em dia", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-600" },
  none: { label: "Sem anúncio", dot: "bg-slate-300", chip: "bg-muted text-muted-foreground" },
};

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export default async function AdsOverviewPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const rows = await getAdsOverview();
  const counts = {
    bad: rows.filter((r) => r.status === "bad").length,
    warn: rows.filter((r) => r.status === "warn").length,
    ok: rows.filter((r) => r.status === "ok").length,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Clientes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <RadioTower className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.8} />
            Saúde dos anúncios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os projetos com mídia · últimos 30 dias · atualiza a cada 1h
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {counts.bad > 0 && (
            <span className={`px-2.5 py-1 rounded-full font-semibold ${STATUS_META.bad.chip}`}>
              {counts.bad} corrigir
            </span>
          )}
          {counts.warn > 0 && (
            <span className={`px-2.5 py-1 rounded-full font-semibold ${STATUS_META.warn.chip}`}>
              {counts.warn} atenção
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full font-semibold ${STATUS_META.ok.chip}`}>
            {counts.ok} em dia
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center">
          <p className="text-muted-foreground text-sm">Nenhum projeto ativo ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const s = STATUS_META[r.status];
            return (
              <Link
                key={r.engagementId}
                href={`/clientes/portal/${r.engagementId}/performance`}
                className="group grid grid-cols-[10px_1fr_auto] md:grid-cols-[10px_1.4fr_repeat(3,minmax(90px,auto))_auto] items-center gap-4 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-[var(--accent)]/40 hover:shadow-sm transition"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {r.clientName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      · {r.engagementName}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                      {r.hasMeta && "Meta"}
                      {r.hasMeta && r.hasGoogle && " + "}
                      {r.hasGoogle && "Google"}
                      {!r.hasMeta && !r.hasGoogle && "sem conta"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {r.flags.join(" · ")}
                  </p>
                </div>

                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold tabular-nums">{money(r.spend)}</div>
                  <div className="text-[10px] text-muted-foreground">investido 30d</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold tabular-nums">
                    {r.results > 0 ? num(r.results) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">resultados</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold tabular-nums">
                    {r.costPerResult > 0 ? money(r.costPerResult) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">custo/resultado</div>
                </div>

                <div className="flex items-center gap-2 justify-self-end">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${s.chip}`}>
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
