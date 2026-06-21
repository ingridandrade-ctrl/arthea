"use client";

// Seção Google Ads do dashboard de performance do cliente.
// Renderiza KPIs, evolução diária, campanhas + (colapsáveis) keywords e
// termos de busca.

import { useState } from "react";
import {
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { EvolutionChart } from "./evolution-chart";
import { SectionHeader } from "./section-header";

type AccountSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  costPerConversion: number;
};

type CampaignRow = {
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
};

type KeywordRow = {
  keywordText: string;
  matchType: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  qualityTier?: "good" | "warn" | "bad" | "unknown";
};

type SearchTermRow = {
  searchTerm: string;
  campaignName: string;
  clicks: number;
  ctr: number;
  cost: number;
};

type DailyRow = { date: string; clicks: number; cost: number };

export type GoogleData = {
  dateRange: string;
  dateRangeLabel: string;
  account: { customerId: string; name: string; currencyCode: string } | null;
  summary: AccountSummary | null;
  campaigns: CampaignRow[];
  keywords: KeywordRow[];
  searchTerms: SearchTermRow[];
  daily: DailyRow[];
  note?: string;
  error?: string;
};

export function GoogleSection({ data, loading }: { data: GoogleData | null; loading: boolean }) {
  const [showKeywords, setShowKeywords] = useState(false);
  const [showSearchTerms, setShowSearchTerms] = useState(false);

  if (loading && !data) return <SectionLoading />;
  if (!data) return null;
  if (data.note) return <EmptyState message={data.note} />;
  if (data.error) return <EmptyState message={data.error} tone="warn" />;
  if (!data.summary || !data.account) return <EmptyState message="Sem dados Google Ads no período." />;

  const currency = data.account.currencyCode;
  const money = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 2 });
  const moneyShort = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  const s = data.summary;

  // Identificar campanhas com badges
  const bestCtrId =
    data.campaigns.length > 0
      ? data.campaigns.reduce((a, b) => (b.ctr > a.ctr ? b : a)).campaignId
      : null;
  const mostConversionsId =
    data.campaigns.length > 0 && data.campaigns.some((c) => c.conversions > 0)
      ? data.campaigns.reduce((a, b) => (b.conversions > a.conversions ? b : a)).campaignId
      : null;

  const dailyData: DailyRow[] = data.daily.map((d) => ({
    date: d.date,
    clicks: d.clicks,
    cost: d.cost,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* KPIs */}
      <section>
        <SectionHeader
          eyebrow={`Google Ads · ${data.dateRangeLabel}`}
          title="Resumo da conta"
          description={`Conta ${data.account.name} — ${currency}.`}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <KpiCard label="Investimento" value={moneyShort(s.cost)} icon={<DollarSign size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="Cliques" value={num(s.clicks)} icon={<MousePointerClick size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="Impressões" value={num(s.impressions)} icon={<Eye size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="CTR" value={pct(s.ctr)} icon={<TrendingUp size={14} color="#8B867B" strokeWidth={1.7} />} />
          <KpiCard label="CPC médio" value={money(s.averageCpc)} />
          <KpiCard
            label="Conversões"
            value={num(s.conversions)}
            sub={s.conversions > 0 ? `${money(s.costPerConversion)} / conv.` : undefined}
            tone={s.conversions > 0 ? "good" : "default"}
            icon={<Target size={14} color="#8B867B" strokeWidth={1.7} />}
          />
        </div>
      </section>

      {/* Evolução diária */}
      <section>
        <SectionHeader
          eyebrow="Evolução"
          title="Cliques e investimento por dia"
          description="Linha verde: cliques. Linha azul-claro: investimento em R$."
        />
        <EvolutionChart data={dailyData} currency={currency} />
      </section>

      {/* Tabela de campanhas */}
      <section>
        <SectionHeader
          eyebrow="Campanhas"
          title="Onde está indo o investimento"
        />
        <Table>
          <THead>
            <Th>Campanha</Th>
            <Th align="right">Impressões</Th>
            <Th align="right">Cliques</Th>
            <Th align="right">CTR</Th>
            <Th align="right">CPC</Th>
            <Th align="right">Conv.</Th>
            <Th align="right">Custo</Th>
          </THead>
          <tbody>
            {data.campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  Nenhuma campanha no período.
                </td>
              </tr>
            ) : (
              data.campaigns.map((c) => (
                <tr key={c.campaignId} style={trStyle}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{c.campaignName}</span>
                      {c.campaignId === bestCtrId && <Badge tone="good">Melhor CTR</Badge>}
                      {c.campaignId === mostConversionsId && (
                        <Badge tone="accent">Mais conversões</Badge>
                      )}
                    </div>
                  </Td>
                  <Td align="right">{num(c.impressions)}</Td>
                  <Td align="right">{num(c.clicks)}</Td>
                  <Td align="right">{pct(c.ctr)}</Td>
                  <Td align="right">{money(c.averageCpc)}</Td>
                  <Td align="right">{num(c.conversions)}</Td>
                  <Td align="right" strong>
                    {money(c.cost)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </section>

      {/* Keywords (colapsável) */}
      <section>
        <CollapsibleHeader
          eyebrow="Palavras-chave"
          title={`Top ${data.keywords.length} por impressões`}
          open={showKeywords}
          onToggle={() => setShowKeywords((v) => !v)}
        />
        {showKeywords && data.keywords.length > 0 && (
          <Table>
            <THead>
              <Th>Palavra-chave</Th>
              <Th>Tipo</Th>
              <Th>Campanha</Th>
              <Th align="right">Impressões</Th>
              <Th align="right">Cliques</Th>
              <Th align="right">CTR</Th>
              <Th align="right">CPC</Th>
              <Th align="center">Qualidade</Th>
            </THead>
            <tbody>
              {data.keywords.map((k, i) => (
                <tr key={`${k.keywordText}-${i}`} style={trStyle}>
                  <Td>{k.keywordText}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                        color: "#8B867B",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {k.matchType.toLowerCase()}
                    </span>
                  </Td>
                  <Td>{k.campaignName}</Td>
                  <Td align="right">{num(k.impressions)}</Td>
                  <Td align="right">{num(k.clicks)}</Td>
                  <Td align="right">{pct(k.ctr)}</Td>
                  <Td align="right">{money(k.averageCpc)}</Td>
                  <Td align="center">
                    <QualityDot tier={k.qualityTier || "unknown"} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Search terms (colapsável) */}
      <section>
        <CollapsibleHeader
          eyebrow="Termos de busca"
          title={
            data.searchTerms.length > 0
              ? `${data.searchTerms.length} termos que ativaram seus anúncios`
              : "Sem termos disponíveis no período"
          }
          open={showSearchTerms}
          onToggle={() => setShowSearchTerms((v) => !v)}
          disabled={data.searchTerms.length === 0}
        />
        {showSearchTerms && data.searchTerms.length > 0 && (
          <>
            <Table>
              <THead>
                <Th>Termo buscado</Th>
                <Th>Campanha</Th>
                <Th align="right">Cliques</Th>
                <Th align="right">CTR</Th>
                <Th align="right">Custo</Th>
              </THead>
              <tbody>
                {data.searchTerms.map((t, i) => (
                  <tr key={`${t.searchTerm}-${i}`} style={trStyle}>
                    <Td>{t.searchTerm}</Td>
                    <Td>{t.campaignName}</Td>
                    <Td align="right">{num(t.clicks)}</Td>
                    <Td align="right">{pct(t.ctr)}</Td>
                    <Td align="right" strong>
                      {money(t.cost)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p style={{ fontSize: 12, color: "#8B867B", marginTop: 10, lineHeight: 1.5 }}>
              Esses são os termos reais que pessoas digitaram no Google antes de chegar ao seu
              site. Termos com muitos cliques e poucos resultados são revisados semanalmente pela
              equipe Arthea.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

// ─── helpers visuais ─────────────────────────────────────────────

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
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  strong?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: align,
        color: "#1A1A1A",
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

function Badge({ children, tone }: { children: React.ReactNode; tone: "good" | "accent" }) {
  const bg = tone === "good" ? "var(--accent-soft)" : "rgba(124,58,237,0.10)";
  const fg = tone === "good" ? "var(--accent-deep)" : "#5B21B6";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        background: bg,
        color: fg,
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

function QualityDot({ tier }: { tier: "good" | "warn" | "bad" | "unknown" }) {
  const color =
    tier === "good"
      ? "#16A34A"
      : tier === "warn"
        ? "#EAB308"
        : tier === "bad"
          ? "#DC2626"
          : "rgba(13,74,74,0.25)";
  const label =
    tier === "good"
      ? "Boa qualidade"
      : tier === "warn"
        ? "Atenção"
        : tier === "bad"
          ? "Precisa otimizar"
          : "Sem dados";
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
      }}
    />
  );
}

function CollapsibleHeader({
  eyebrow,
  title,
  open,
  onToggle,
  disabled = false,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px 18px",
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: open ? "12px 12px 0 0" : 12,
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        marginBottom: open ? -1 : 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <div>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: "#8B867B",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            display: "block",
          }}
        >
          {eyebrow}
        </span>
        <span style={{ fontSize: 14, color: "#1A1A1A", marginTop: 4, display: "block" }}>{title}</span>
      </div>
      {!disabled && (open ? <ChevronUp size={16} color="#8B867B" /> : <ChevronDown size={16} color="#8B867B" />)}
    </button>
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
      Carregando dados Google Ads…
    </div>
  );
}
