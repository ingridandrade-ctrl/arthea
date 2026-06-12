"use client";

// Seção Meta Ads (Facebook + Instagram) do dashboard de performance do cliente.
// KPIs incluem Alcance, Frequência (com tom de alerta se alta) e Resultados.

import {
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  Users,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { KpiCard, type KpiTone } from "./kpi-card";
import { EvolutionChart } from "./evolution-chart";
import { SectionHeader } from "./section-header";

type Summary = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  frequency: number;
  results: number;
  costPerResult: number;
};

type CampaignRow = {
  campaignId: string;
  campaignName: string;
  accountName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
};

type DailyRow = { date: string; clicks: number; cost: number };

export type MetaData = {
  datePreset: string;
  account: { name: string; currency: string; accountCount: number } | null;
  summary: Summary | null;
  campaigns: CampaignRow[];
  daily: DailyRow[];
  note?: string;
  error?: string;
};

const PRESET_LABEL: Record<string, string> = {
  today: "hoje",
  yesterday: "ontem",
  last_7d: "últimos 7 dias",
  last_14d: "últimos 14 dias",
  last_28d: "últimos 28 dias",
  last_30d: "últimos 30 dias",
  this_month: "este mês",
  last_month: "mês passado",
};

export function MetaSection({ data, loading }: { data: MetaData | null; loading: boolean }) {
  if (loading && !data) return <SectionLoading />;
  if (!data) return null;
  if (data.note) return <EmptyState message={data.note} />;
  if (data.error) return <EmptyState message={data.error} tone="warn" />;
  if (!data.summary || !data.account) return <EmptyState message="Sem dados Meta Ads no período." />;

  const currency = data.account.currency || "BRL";
  const money = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 2 });
  const moneyShort = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const decimal = (v: number, d = 2) => v.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });

  const s = data.summary;

  // Frequência alta = pessoas vendo o mesmo anúncio demais. >5 é vermelho.
  const freqTone: KpiTone = s.frequency >= 5 ? "danger" : s.frequency >= 3 ? "warn" : "default";
  const freqLabel = s.frequency >= 5 ? "Crítica" : s.frequency >= 3 ? "Atenção" : undefined;

  const dailyData: DailyRow[] = data.daily.map((d) => ({
    date: d.date,
    clicks: d.clicks,
    cost: d.cost,
  }));

  // Identifica campanha com melhor CTR (badge)
  const bestCtrId =
    data.campaigns.length > 0
      ? data.campaigns.reduce((a, b) => (b.ctr > a.ctr ? b : a)).campaignId
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <SectionHeader
          eyebrow={`Meta Ads · ${PRESET_LABEL[data.datePreset] || data.datePreset}`}
          title="Resumo da conta"
          description={
            data.account.accountCount > 1
              ? `${data.account.accountCount} contas Meta linkadas a essa frente.`
              : `Conta ${data.account.name} — ${currency}.`
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <KpiCard label="Investimento" value={moneyShort(s.spend)} icon={<DollarSign size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="Alcance" value={num(s.reach)} sub="pessoas únicas" icon={<Users size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="Impressões" value={num(s.impressions)} icon={<Eye size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard
            label="Frequência"
            value={decimal(s.frequency, 1)}
            sub={freqLabel || "vezes por pessoa"}
            tone={freqTone}
            icon={<Repeat size={14} color="#8B867B" strokeWidth={1.7} />}
          />
          <KpiCard label="Cliques" value={num(s.clicks)} sub={`CTR ${pct(s.ctr)}`} icon={<MousePointerClick size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard
            label="Resultados"
            value={num(s.results)}
            sub={s.results > 0 ? `${money(s.costPerResult)} / resultado` : "sem leads no período"}
            tone={s.results > 0 ? "good" : "default"}
            icon={<Target size={14} color="#8B867B" strokeWidth={1.7} />}
          />
        </div>
        {freqTone !== "default" && (
          <p style={{ fontSize: 12.5, color: "#92400E", marginTop: 12, lineHeight: 1.55, maxWidth: 620 }}>
            Frequência {decimal(s.frequency, 1)} significa que cada pessoa viu seus anúncios em média{" "}
            {decimal(s.frequency, 1)} vezes no período. Acima de 3 já tende a cansar a audiência —
            considere ampliar o público ou rotacionar criativos.
          </p>
        )}
      </section>

      <section>
        <SectionHeader
          eyebrow="Evolução"
          title="Cliques e investimento por dia"
          description="Linha verde: cliques. Linha azul-claro: investimento."
        />
        <EvolutionChart data={dailyData} currency={currency} />
      </section>

      <section>
        <SectionHeader
          eyebrow="Campanhas"
          title="Onde está indo o investimento"
        />
        <Table>
          <THead>
            <Th>Campanha</Th>
            <Th align="right">Alcance ~</Th>
            <Th align="right">Impressões</Th>
            <Th align="right">Cliques</Th>
            <Th align="right">CTR</Th>
            <Th align="right">CPM</Th>
            <Th align="right">Custo</Th>
          </THead>
          <tbody>
            {data.campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  Nenhuma campanha ativa no período.
                </td>
              </tr>
            ) : (
              data.campaigns.map((c) => (
                <tr key={c.campaignId} style={trStyle}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{c.campaignName}</span>
                      {c.campaignId === bestCtrId && c.clicks > 0 && (
                        <Badge tone="good">Melhor CTR</Badge>
                      )}
                    </div>
                  </Td>
                  <Td align="right" muted>
                    —
                  </Td>
                  <Td align="right">{num(c.impressions)}</Td>
                  <Td align="right">{num(c.clicks)}</Td>
                  <Td align="right">{pct(c.ctr)}</Td>
                  <Td align="right">{money(c.cpm)}</Td>
                  <Td align="right" strong>
                    {money(c.spend)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <p style={{ fontSize: 12, color: "#8B867B", marginTop: 10, lineHeight: 1.5 }}>
          Alcance por campanha não é fornecido diretamente pela Meta — só no nível da conta.
        </p>
      </section>
    </div>
  );
}

// ─── helpers visuais (mesma estética da google-section) ──────────

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table>
      </div>
    </div>
  );
}

function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ background: "rgba(250,249,246,0.6)" }}>
      <tr>{children}</tr>
    </thead>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "12px 16px",
        fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
        fontSize: 10.5,
        color: "#8B867B",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 600,
        borderBottom: "0.5px solid rgba(13,74,74,0.10)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  strong = false,
  muted = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: align,
        color: muted ? "#8B867B" : "#1A1A1A",
        fontWeight: strong ? 600 : 400,
        fontFamily: align === "right" ? "ui-monospace, 'JetBrains Mono', Menlo, monospace" : undefined,
        fontSize: align === "right" ? 12.5 : 13,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

const trStyle: React.CSSProperties = { borderBottom: "0.5px solid rgba(13,74,74,0.05)" };

const emptyCellStyle: React.CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#8B867B",
  fontStyle: "italic",
};

function Badge({ children, tone }: { children: React.ReactNode; tone: "good" }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        background: "var(--accent-soft)",
        color: "var(--accent-deep)",
        padding: "2px 8px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
      }}
    >
      {children}
    </span>
  );
}

function EmptyState({ message, tone = "default" }: { message: string; tone?: "default" | "warn" }) {
  const bg = tone === "warn" ? "#FEF7E5" : "white";
  const border = tone === "warn" ? "#F5D88A" : "rgba(13,74,74,0.15)";
  const color = tone === "warn" ? "#78350F" : "#6B7280";
  return (
    <div
      style={{
        background: bg,
        border: `0.5px ${tone === "warn" ? "solid" : "dashed"} ${border}`,
        borderRadius: 14,
        padding: "40px 28px",
        textAlign: "center",
        color,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

function SectionLoading() {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 14,
        padding: 40,
        textAlign: "center",
        color: "#8B867B",
        fontSize: 13.5,
      }}
    >
      Carregando dados Meta Ads…
    </div>
  );
}
