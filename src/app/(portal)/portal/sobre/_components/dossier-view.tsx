import type {
  DigitalPresence,
  BrandContext,
  Voice,
  Market,
  Contact,
  Commercial,
  Archive,
  BrandIdentity,
  Performance,
} from "@/lib/dossier";
import { channelHref } from "@/lib/dossier";
import { FileText } from "lucide-react";

type SectionMeta = {
  key: string;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
};

export function DossierView({ meta, data }: { meta: SectionMeta; data: any }) {
  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <header
        style={{
          padding: "30px 36px 26px",
          borderBottom: "0.5px solid rgba(13,74,74,0.05)",
          background: "linear-gradient(180deg, rgba(250,249,246,0.6), white)",
        }}
      >
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: "#8B867B",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              fontWeight: 600,
            }}
          >
            {meta.number}
          </span>
          {meta.eyebrow}
        </span>
        <h2
          style={{
            fontSize: 26,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 600,
            margin: 0,
            color: "#1A1A1A",
          }}
        >
          {meta.title}
        </h2>
        <p style={{ color: "#8B867B", margin: "8px 0 0", fontSize: 14 }}>{meta.description}</p>
      </header>

      <div>{renderSection(meta.key, data)}</div>
    </section>
  );
}

function renderSection(key: string, data: any) {
  switch (key) {
    case "digitalPresence":
      return <DigitalPresenceView data={data as DigitalPresence} />;
    case "brandContext":
      return <BrandContextView data={data as BrandContext} />;
    case "voice":
      return <VoiceView data={data as Voice} />;
    case "market":
      return <MarketView data={data as Market} />;
    case "contacts":
      return <ContactsView data={data as Contact[]} />;
    case "commercial":
      return <CommercialView data={data as Commercial} />;
    case "archive":
      return <ArchiveView data={data as Archive} />;
    case "brandIdentity":
      return <BrandIdentityView data={data as BrandIdentity} />;
    case "performance":
      return <PerformanceView data={data as Performance} />;
    default:
      return null;
  }
}

// ─── Building blocks ──────────────────────────────────────────────

function Field({
  label,
  children,
  mono,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 28,
        padding: "18px 36px",
        borderBottom: isLast ? "none" : "0.5px solid rgba(13,74,74,0.05)",
      }}
      className="dossier-field"
    >
      <div
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#8B867B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          paddingTop: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#1A1A1A",
          fontSize: 15,
          minHeight: 24,
          lineHeight: 1.55,
          fontFamily: mono ? "ui-monospace, 'JetBrains Mono', Menlo, monospace" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <span style={{ color: "#A0A0A0", fontStyle: "italic", fontSize: 13.5 }}>— a preencher</span>
  );
}

function SubBlock({
  label,
  children,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        padding: "22px 36px",
        borderBottom: isLast ? "none" : "0.5px solid rgba(13,74,74,0.05)",
      }}
    >
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#8B867B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: "0 0 14px",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((s, i) => (
        <span
          key={i}
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            fontSize: 12,
            fontWeight: 500,
            border: "0.5px solid rgba(29,112,112,0.18)",
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function MonoLink({ value, href }: { value: string | null; href?: string | null }) {
  if (!value) return <Empty />;
  if (!href) {
    return <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace", fontSize: 13.5 }}>{value}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "var(--accent-deep)",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        textDecorationColor: "var(--accent)",
        fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
        fontSize: 13.5,
      }}
    >
      {value}
    </a>
  );
}

function instagramUrl(handle: string | null) {
  if (!handle) return null;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}
function tiktokUrl(handle: string | null) {
  if (!handle) return null;
  return `https://tiktok.com/@${handle.replace(/^@/, "")}`;
}

// ─── 01 Digital Presence ─────────────────────────────────────────

function DigitalPresenceView({ data }: { data: DigitalPresence }) {
  return (
    <>
      <Field label="Instagram">
        <MonoLink value={data.instagram} href={instagramUrl(data.instagram)} />
      </Field>
      <Field label="TikTok">
        <MonoLink value={data.tiktok} href={tiktokUrl(data.tiktok)} />
      </Field>
      <Field label="Site">
        <MonoLink value={data.website} href={data.website} />
      </Field>
      <Field label="Google Meu Negócio">
        <MonoLink value={data.gmb} href={data.gmb} />
      </Field>
      <Field label="Endereço">{data.address || <Empty />}</Field>
      <Field label="Grupo WhatsApp">
        <MonoLink value={data.whatsappGroup} href={data.whatsappGroup} />
      </Field>
      <Field label="Pasta Google Drive" isLast>
        <MonoLink value={data.driveFolder} href={data.driveFolder} />
      </Field>
    </>
  );
}

// ─── 02 Brand Context ────────────────────────────────────────────

function BrandContextView({ data }: { data: BrandContext }) {
  return (
    <>
      <Field label="Descrição">{data.description || <Empty />}</Field>
      <Field label="Valores">
        <Chips items={data.values || []} />
      </Field>
      <Field label="Diferenciais">{data.differentiators || <Empty />}</Field>
      <Field label="Produtos & Serviços" isLast>
        {data.productsServices && data.productsServices.length > 0 ? (
          data.productsServices.join(" · ")
        ) : (
          <Empty />
        )}
      </Field>
    </>
  );
}

// ─── 03 Voice ─────────────────────────────────────────────────────

function VoiceView({ data }: { data: Voice }) {
  return (
    <>
      <Field label="Tom de Voz">{data.tone || <Empty />}</Field>
      <Field label="Público-alvo" isLast>
        {data.audience || <Empty />}
      </Field>
    </>
  );
}

// ─── 04 Market ───────────────────────────────────────────────────

function MarketView({ data }: { data: Market }) {
  return (
    <>
      <Field label="Concorrentes">
        {data.competitors && data.competitors.length > 0 ? (
          <Chips items={data.competitors} />
        ) : (
          <Empty />
        )}
      </Field>
      <Field label="Informações Relevantes" isLast>
        {data.notes || <Empty />}
      </Field>
    </>
  );
}

// ─── 05 Contacts ─────────────────────────────────────────────────

function ContactsView({ data }: { data: Contact[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "22px 36px" }}>
        <Empty />
      </div>
    );
  }
  return (
    <div style={{ padding: "22px 36px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((c, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 18px",
              border: "0.5px solid rgba(13,74,74,0.05)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: i === 0 ? "var(--accent)" : "var(--accent-deep)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {(c.name || "?")
                .split(" ")
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
              {c.role && (
                <div style={{ fontSize: 13, color: "#8B867B", marginTop: 1 }}>{c.role}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {(c.channels || []).map((ch) => {
                const href = channelHref(ch);
                const chipStyle: React.CSSProperties = {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "var(--accent-soft)",
                  color: "var(--accent-deep)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  border: "0.5px solid rgba(29,112,112,0.18)",
                };
                const label = (
                  <>
                    <span style={{ fontWeight: 600 }}>{ch.kind}</span>
                    {ch.value && (
                      <span
                        style={{
                          textTransform: "none",
                          letterSpacing: "0",
                          color: "#4A4A4A",
                          fontWeight: 400,
                        }}
                      >
                        {ch.value}
                      </span>
                    )}
                  </>
                );
                return href ? (
                  <a
                    key={ch.kind}
                    href={href}
                    target={ch.kind === "email" || ch.kind === "telefone" ? undefined : "_blank"}
                    rel="noreferrer"
                    style={chipStyle}
                  >
                    {label}
                  </a>
                ) : (
                  <span key={ch.kind} style={{ ...chipStyle, cursor: "default", opacity: 0.7 }}>
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 06 Commercial ───────────────────────────────────────────────

function CommercialView({ data }: { data: Commercial }) {
  const money = (n: number | null) =>
    n == null
      ? null
      : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <>
      <Field label="Valor mensal" mono>
        {money(data.monthlyValue) || <Empty />}
      </Field>
      <Field label="Tipo de engajamento">{data.engagementType || <Empty />}</Field>
      <Field label="Início do projeto" mono>
        {data.startDate || <Empty />}
      </Field>
      <Field label="Entrega prevista" mono isLast>
        {data.deliveryDate || <Empty />}
      </Field>
    </>
  );
}

// ─── 07 Archive ──────────────────────────────────────────────────

function ArchiveView({ data }: { data: Archive }) {
  return (
    <>
      <SubBlock label="Transcrições de Reuniões">
        <FileList items={data.meetingTranscripts || []} fallbackIcon="PDF" />
      </SubBlock>
      <SubBlock label="Arquivos Relevantes">
        <FileList items={data.relevantFiles || []} fallbackIcon="DOC" />
      </SubBlock>
      <SubBlock label="Roteiros de Anúncios" isLast>
        <FileList items={data.adScripts || []} fallbackIcon="01" accent />
      </SubBlock>
    </>
  );
}

function FileList({
  items,
  fallbackIcon,
  accent,
}: {
  items: { title: string; url: string | null }[];
  fallbackIcon: string;
  accent?: boolean;
}) {
  if (items.length === 0) return <Empty />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((f, i) => {
        const content = (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "0.5px solid rgba(13,74,74,0.05)",
              background: "linear-gradient(180deg, white, rgba(250,249,246,0.5))",
              fontSize: 14,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: accent ? "var(--accent)" : "var(--accent-soft)",
                color: accent ? "white" : "var(--accent-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {fallbackIcon}
            </div>
            <div style={{ flex: 1 }}>{f.title}</div>
          </div>
        );
        return f.url ? (
          <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            {content}
          </a>
        ) : (
          <div key={i}>{content}</div>
        );
      })}
    </div>
  );
}

// ─── 08 Brand Identity ───────────────────────────────────────────

function BrandIdentityView({ data }: { data: BrandIdentity }) {
  return (
    <>
      <SubBlock label="Paleta da Marca">
        {data.palette && data.palette.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {data.palette.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 10px 6px 6px",
                  background: "white",
                  border: "0.5px solid rgba(13,74,74,0.10)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 5,
                    background: c.hex,
                    border: "0.5px solid rgba(13,74,74,0.10)",
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                      fontSize: 11,
                      color: "#8B867B",
                    }}
                  >
                    {c.hex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </SubBlock>
      <SubBlock label="Logos" isLast>
        {data.logos && data.logos.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.logos.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "0.5px solid rgba(13,74,74,0.05)",
                  background: "white",
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: 14,
                }}
              >
                <FileText size={16} color="var(--accent)" strokeWidth={1.6} />
                <span>{l.name}</span>
              </a>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </SubBlock>
    </>
  );
}

// ─── 09 Performance ──────────────────────────────────────────────

function PerformanceView({ data }: { data: Performance }) {
  const metrics = [
    { label: "CPA Alvo", value: data.cpaTarget != null ? `R$ ${data.cpaTarget}` : null, sub: "por lead qualificado" },
    { label: "ROAS Mínimo", value: data.minRoas != null ? `${data.minRoas}×` : null, sub: "retorno mensal" },
    { label: "Ticket Médio", value: data.avgTicket != null ? `R$ ${data.avgTicket}` : null, sub: "por sessão" },
    { label: "Conversão", value: data.conversionRate != null ? `${data.conversionRate}%` : null, sub: "lead → cliente" },
    { label: "Taxa/Hora", value: data.hourlyRate != null ? `R$ ${data.hourlyRate}` : null, sub: "operação" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        padding: "0 36px 28px",
      }}
      className="dossier-metrics"
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          style={{
            padding: "22px 0",
            borderRight: i < metrics.length - 1 ? "0.5px solid rgba(13,74,74,0.05)" : "none",
            paddingLeft: i > 0 ? 16 : 0,
            paddingRight: i < metrics.length - 1 ? 16 : 0,
          }}
        >
          <div
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10,
              color: "#8B867B",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {m.label}
          </div>
          {m.value ? (
            <>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "#1A1A1A",
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: "#8B867B", marginTop: 4 }}>{m.sub}</div>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: "#A0A0A0", fontStyle: "italic" }}>a definir</div>
          )}
        </div>
      ))}
    </div>
  );
}
