"use client";

// Gráfico de evolução com 2 séries (Cliques na YAxis esquerda + Investimento
// em R$ na YAxis direita) ao longo do período. Usa ComposedChart pra suportar
// múltiplas escalas. Paleta Arthea: cliques em verde escuro, investimento
// em verde mint claro.

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type DailyRow = {
  date: string; // YYYY-MM-DD
  clicks: number;
  cost: number;
};

export function EvolutionChart({ data, currency = "BRL" }: { data: DailyRow[]; currency?: string }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#8B867B",
          fontSize: 13.5,
          background: "white",
          border: "0.5px dashed rgba(13,74,74,0.15)",
          borderRadius: 12,
        }}
      >
        Sem dados de evolução no período.
      </div>
    );
  }

  const fmtDate = (raw: string) => {
    if (!raw) return "";
    const [, m, d] = raw.split("-");
    return `${d}/${m}`;
  };
  const fmtMoney = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
  const fmtNum = (v: number) => v.toLocaleString("pt-BR");

  return (
    <div style={{ background: "white", border: "0.5px solid rgba(13,74,74,0.10)", borderRadius: 16, padding: 20 }}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,74,74,0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: "#8B867B" }}
            stroke="rgba(13,74,74,0.15)"
          />
          <YAxis
            yAxisId="clicks"
            orientation="left"
            tick={{ fontSize: 11, fill: "#8B867B" }}
            stroke="rgba(13,74,74,0.15)"
            tickFormatter={fmtNum}
            label={{
              value: "Cliques",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#1D7070", textAnchor: "middle" },
            }}
          />
          <YAxis
            yAxisId="cost"
            orientation="right"
            tick={{ fontSize: 11, fill: "#8B867B" }}
            stroke="rgba(13,74,74,0.15)"
            tickFormatter={(v) => fmtMoney(v as number)}
            label={{
              value: "Investimento",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11, fill: "#7ED4D4", textAnchor: "middle" },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "0.5px solid rgba(13,74,74,0.18)",
              borderRadius: 10,
              fontSize: 12.5,
            }}
            labelFormatter={(raw: string) => fmtDate(raw)}
            formatter={(value: any, name: string) => {
              if (name === "Cliques") return [fmtNum(Number(value)), name];
              if (name === "Investimento") return [fmtMoney(Number(value)), name];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="line"
          />
          <Line
            yAxisId="clicks"
            type="monotone"
            dataKey="clicks"
            name="Cliques"
            stroke="#1D7070"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="cost"
            type="monotone"
            dataKey="cost"
            name="Investimento"
            stroke="#7ED4D4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
