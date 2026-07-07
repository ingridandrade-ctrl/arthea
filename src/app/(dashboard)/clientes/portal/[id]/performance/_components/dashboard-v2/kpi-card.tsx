import type { ReactNode } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

// Card KPI — número display grande + delta chip + comparação com período anterior.
// Base de toda a Camada 1 do dashboard v2.
export function KpiCard({
  icon,
  label,
  value,
  unit,
  delta,
  deltaKind = "up",
  compareText,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaKind?: "up" | "down" | "flat";
  compareText?: string;
}) {
  const deltaClass =
    deltaKind === "up"
      ? "bg-success/10 text-success"
      : deltaKind === "down"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  const DeltaIcon =
    deltaKind === "up" ? ArrowUp : deltaKind === "down" ? ArrowDown : Minus;

  return (
    <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] px-5 py-5 flex flex-col gap-1.5 min-h-[150px]">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-brand/8 text-brand flex items-center justify-center border border-brand/12">
          {icon}
        </div>
        {delta && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${deltaClass}`}>
            <DeltaIcon className="w-3 h-3" strokeWidth={2.4} />
            {delta}
          </span>
        )}
      </div>
      <div className="text-[44px] font-semibold tracking-[-0.03em] text-foreground leading-none mt-2 tabular-nums">
        {value}
        {unit && (
          <span className="text-[15px] font-medium text-foreground/70 ml-0.5 tracking-normal">
            {unit}
          </span>
        )}
      </div>
      <div className="text-[12.5px] text-muted-foreground font-medium mt-1">{label}</div>
      {compareText && (
        <div className="text-[10.5px] text-muted-foreground/80 mt-0.5">{compareText}</div>
      )}
    </div>
  );
}
