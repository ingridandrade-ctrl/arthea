"use client";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  formatTotal?: (total: number) => string;
  centerLabel?: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  formatTotal,
  centerLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const filtered = data.filter((d) => d.value > 0);

  if (total === 0 || filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div
          className="rounded-full border-8 border-muted/40 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-muted-foreground">Sem dados</span>
        </div>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let accumulated = 0;
  const segments = filtered.map((d) => {
    const ratio = d.value / total;
    const length = ratio * circumference;
    const offset = circumference - accumulated;
    accumulated += length;
    return { ...d, ratio, length, offset };
  });

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.length} ${circumference - s.length}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold leading-none">
          {formatTotal ? formatTotal(total) : total.toLocaleString("pt-BR")}
        </span>
        {centerLabel && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

interface DonutLegendProps {
  data: DonutSegment[];
  formatValue?: (value: number) => string;
}

export function DonutLegend({ data, formatValue }: DonutLegendProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ul className="space-y-2 w-full">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="truncate">{d.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold">
                {formatValue ? formatValue(d.value) : d.value.toLocaleString("pt-BR")}
              </span>
              <span className="text-muted-foreground tabular-nums w-9 text-right">{pct}%</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
