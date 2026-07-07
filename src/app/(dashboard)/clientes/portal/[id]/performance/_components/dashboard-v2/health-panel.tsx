import type { MetaFullSummary } from "./use-dashboard-data";

type Status = "ok" | "warn" | "bad";

type HealthMetric = {
  name: string;
  value: string;
  status: Status;
  bench: string;
};

// Regras de faixa — baseadas no relatório da pesquisa (Motion / benchmarks de agência).
function evalHealth(s: MetaFullSummary): HealthMetric[] {
  const freq = s.frequency;
  const ctrPct = s.ctr * 100;
  const cpm = s.cpm;
  const cpc = s.cpc;

  return [
    {
      name: "Frequência",
      value: `${freq.toFixed(1)}×`,
      status: freq >= 5 ? "bad" : freq >= 3.5 ? "warn" : "ok",
      bench: freq >= 5
        ? "crítica · fadiga alta"
        : freq >= 3.5
          ? `atenção · abaixo de 3,5× é o saudável`
          : "saudável abaixo de 3,5×",
    },
    {
      name: "CTR",
      value: `${ctrPct.toFixed(2)}%`,
      status: ctrPct >= 1.5 ? "ok" : ctrPct >= 0.8 ? "warn" : "bad",
      bench: ctrPct >= 1.5
        ? "bom acima de 1,5%"
        : ctrPct >= 0.8
          ? "atenção · abaixo do saudável (1,5%)"
          : "abaixo do mínimo aceitável",
    },
    {
      name: "CPM",
      value: cpm ? `R$ ${cpm.toFixed(2)}` : "—",
      status: cpm > 0 && cpm <= 40 ? "ok" : cpm <= 70 ? "warn" : "bad",
      bench: cpm > 0 && cpm <= 40
        ? "dentro da média"
        : cpm <= 70
          ? "atenção · segmentação pode estar ampla"
          : "muito alto · revisar segmentação",
    },
    {
      name: "CPC",
      value: cpc ? `R$ ${cpc.toFixed(2)}` : "—",
      status: cpc > 0 && cpc <= 1.5 ? "ok" : cpc <= 3 ? "warn" : "bad",
      bench: cpc > 0 && cpc <= 1.5
        ? "bom · média R$ 1,10"
        : cpc <= 3
          ? "atenção · acima da média (R$ 1,10)"
          : "muito alto",
    },
  ];
}

const STATUS_STYLE: Record<Status, { chip: string; label: string; edge: string }> = {
  ok: { chip: "bg-success/12 text-success", label: "OK", edge: "bg-success" },
  warn: { chip: "bg-warning/12 text-warning", label: "ATENÇÃO", edge: "bg-warning" },
  bad: { chip: "bg-destructive/12 text-destructive", label: "CORRIGIR", edge: "bg-destructive" },
};

export function HealthPanel({ summary }: { summary: MetaFullSummary }) {
  const metrics = evalHealth(summary);
  return (
    <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Saúde da campanha
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Sinais diagnósticos — verde ok, amarelo atenção, vermelho corrigir
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {metrics.map((m) => {
          const s = STATUS_STYLE[m.status];
          return (
            <div key={m.name} className="relative bg-cream rounded-2xl p-4 pl-5">
              <span
                className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${s.edge}`}
              />
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                  {m.name}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-[0.06em] font-bold px-1.5 py-0.5 rounded-full ${s.chip}`}
                >
                  {s.label}
                </span>
              </div>
              <div className="text-[28px] font-semibold text-foreground leading-none tracking-[-0.025em] tabular-nums">
                {m.value}
              </div>
              <p className="text-[10.5px] text-muted-foreground mt-2 leading-tight">{m.bench}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
