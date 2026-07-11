// Chart de barras pill hachuradas com uma em destaque + chip preto flutuante.
// Segue a linguagem visual da referência (Omni / MeetSync).

export type PillChartCol = {
  label: string;
  sub?: string;
  value: number;
  highlight?: boolean;
  callout?: string;
};

export function PillChart({ cols }: { cols: PillChartCol[] }) {
  const max = Math.max(...cols.map((c) => c.value), 1);

  return (
    <div
      className="grid gap-3 pt-10 pb-3 items-end min-h-[240px]"
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
    >
      {cols.map((c, i) => {
        const height = Math.max(28, (c.value / max) * 190);
        return (
          <div key={i} className="flex flex-col items-center gap-2 relative">
            <div className="w-full max-w-[62px] relative flex justify-center">
              <div
                className={
                  c.highlight
                    ? "w-full rounded-full bg-gradient-to-b from-[#43BBB4] via-brand to-brand-dark shadow-[0_8px_24px_-8px_rgb(29_112_112_/_0.4)]"
                    : "w-full rounded-full border border-border"
                }
                style={{
                  height,
                  backgroundImage: c.highlight
                    ? undefined
                    : `repeating-linear-gradient(135deg, var(--color-border) 0px, var(--color-border) 5px, transparent 5px, transparent 11px)`,
                }}
              >
                {c.highlight && c.callout && (
                  <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-foreground text-background text-[11.5px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {c.callout}
                    <span
                      className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                      style={{ borderTopColor: "var(--color-foreground)" }}
                    />
                  </span>
                )}
              </div>
            </div>
            <div className="text-center text-[11.5px] text-foreground/80 leading-tight">
              {c.label}
              {c.sub && (
                <span className="block text-[10.5px] text-muted-foreground mt-0.5 font-normal">
                  {c.sub}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
