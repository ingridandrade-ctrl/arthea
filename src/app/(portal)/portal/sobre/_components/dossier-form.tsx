"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, X, Check } from "lucide-react";
import type { Dossier, Contact, PaletteColor } from "@/lib/dossier";
import { SECTIONS } from "@/lib/dossier";

export function DossierForm({ initialData }: { initialData: Dossier }) {
  const router = useRouter();
  const [data, setData] = useState<Dossier>(initialData);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function patch<K extends keyof Dossier>(key: K, value: Dossier[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/portal/dossier", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "Erro ao salvar");
        return false;
      }
      setToast("Dossiê salvo");
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndExit() {
    if (await save()) {
      startTransition(() => router.push("/portal/sobre"));
    }
  }

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/portal/sobre"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6B7280",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} strokeWidth={1.7} />
          Voltar ao dossiê
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => save()}
            disabled={pending || saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: "white",
              color: "#1A1A1A",
              border: "0.5px solid rgba(13,74,74,0.18)",
              cursor: pending || saving ? "wait" : "pointer",
              opacity: pending || saving ? 0.7 : 1,
            }}
          >
            <Save size={14} strokeWidth={1.8} />
            {saving ? "Salvando…" : "Salvar"}
          </button>
          <button
            onClick={saveAndExit}
            disabled={pending || saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: "var(--accent)",
              color: "white",
              border: "0.5px solid var(--accent)",
              cursor: pending || saving ? "wait" : "pointer",
              opacity: pending || saving ? 0.7 : 1,
            }}
          >
            Salvar e sair
          </button>
        </div>
      </div>

      {toast && (
        <div className="portal-toast" role="status">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Check size={14} strokeWidth={2.4} />
            {toast}
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "0.5px solid #FCA5A5",
            color: "#991B1B",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#991B1B" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
            letterSpacing: "-0.025em",
          }}
        >
          Editar{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            dossiê
          </em>
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0" }}>
          Preencha o que fizer sentido. Você pode salvar a qualquer momento e voltar depois.
        </p>
      </header>

      {SECTIONS.map((meta) => (
        <SectionShell key={meta.key} meta={meta}>
          {meta.key === "digitalPresence" && (
            <DigitalPresenceForm
              value={data.digitalPresence}
              onChange={(v) => patch("digitalPresence", v)}
            />
          )}
          {meta.key === "brandContext" && (
            <BrandContextForm value={data.brandContext} onChange={(v) => patch("brandContext", v)} />
          )}
          {meta.key === "voice" && (
            <VoiceForm value={data.voice} onChange={(v) => patch("voice", v)} />
          )}
          {meta.key === "market" && (
            <MarketForm value={data.market} onChange={(v) => patch("market", v)} />
          )}
          {meta.key === "contacts" && (
            <ContactsForm value={data.contacts} onChange={(v) => patch("contacts", v)} />
          )}
          {meta.key === "commercial" && (
            <CommercialForm value={data.commercial} onChange={(v) => patch("commercial", v)} />
          )}
          {meta.key === "archive" && (
            <ArchiveForm value={data.archive} onChange={(v) => patch("archive", v)} />
          )}
          {meta.key === "brandIdentity" && (
            <BrandIdentityForm
              value={data.brandIdentity}
              onChange={(v) => patch("brandIdentity", v)}
            />
          )}
          {meta.key === "performance" && (
            <PerformanceForm value={data.performance} onChange={(v) => patch("performance", v)} />
          )}
        </SectionShell>
      ))}
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────

function SectionShell({
  meta,
  children,
}: {
  meta: { number: string; eyebrow: string; title: string; description: string };
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "24px 28px 20px",
          borderBottom: "0.5px solid rgba(13,74,74,0.05)",
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
            marginBottom: 8,
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
            fontSize: 20,
            lineHeight: 1.2,
            fontWeight: 600,
            margin: "2px 0 4px",
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
          }}
        >
          {meta.title}
        </h2>
        <p style={{ fontSize: 13, color: "#8B867B", margin: 0 }}>{meta.description}</p>
      </header>
      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
  fontSize: 10.5,
  color: "#8B867B",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "0.5px solid rgba(13,74,74,0.18)",
  borderRadius: 8,
  background: "white",
  fontSize: 14,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  color: "#1A1A1A",
  outline: "none",
  resize: "vertical",
};

function Label({ children }: { children: React.ReactNode }) {
  return <label style={labelStyle}>{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        fontFamily: mono ? "ui-monospace, 'JetBrains Mono', Menlo, monospace" : inputStyle.fontFamily,
      }}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, minHeight: rows * 24 + 20 }}
    />
  );
}

function ChipsEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {value.map((s, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 4px 4px 10px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              fontSize: 12,
              fontWeight: 500,
              border: "0.5px solid rgba(29,112,112,0.18)",
            }}
          >
            {s}
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-deep)",
                cursor: "pointer",
                padding: "0 4px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <X size={10} strokeWidth={2.4} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...value, draft.trim()]);
              setDraft("");
            }
          }}
          placeholder={placeholder || "Adicionar (Enter)"}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={() => {
            if (draft.trim()) {
              onChange([...value, draft.trim()]);
              setDraft("");
            }
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.18)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
        >
          <Plus size={13} strokeWidth={1.8} /> Adicionar
        </button>
      </div>
    </div>
  );
}

// ─── 01 Digital Presence ─────────────────────────────────────────

function DigitalPresenceForm({
  value,
  onChange,
}: {
  value: Dossier["digitalPresence"];
  onChange: (v: Dossier["digitalPresence"]) => void;
}) {
  const set = (key: keyof Dossier["digitalPresence"], v: string | null) =>
    onChange({ ...value, [key]: v });
  return (
    <>
      <Field label="Instagram">
        <TextInput value={value.instagram} onChange={(v) => set("instagram", v)} placeholder="@usuario" mono />
      </Field>
      <Field label="TikTok">
        <TextInput value={value.tiktok} onChange={(v) => set("tiktok", v)} placeholder="@usuario" mono />
      </Field>
      <Field label="Site">
        <TextInput value={value.website} onChange={(v) => set("website", v)} placeholder="https://..." mono />
      </Field>
      <Field label="Google Meu Negócio">
        <TextInput value={value.gmb} onChange={(v) => set("gmb", v)} placeholder="URL ou nome" mono />
      </Field>
      <Field label="Endereço">
        <TextInput value={value.address} onChange={(v) => set("address", v)} placeholder="Cidade, estado, etc." />
      </Field>
      <Field label="Grupo WhatsApp">
        <TextInput value={value.whatsappGroup} onChange={(v) => set("whatsappGroup", v)} placeholder="https://chat.whatsapp.com/..." mono />
      </Field>
      <Field label="Pasta Google Drive">
        <TextInput value={value.driveFolder} onChange={(v) => set("driveFolder", v)} placeholder="https://drive.google.com/..." mono />
      </Field>
    </>
  );
}

// ─── 02 Brand Context ────────────────────────────────────────────

function BrandContextForm({
  value,
  onChange,
}: {
  value: Dossier["brandContext"];
  onChange: (v: Dossier["brandContext"]) => void;
}) {
  return (
    <>
      <Field label="Descrição">
        <TextArea
          value={value.description}
          onChange={(v) => onChange({ ...value, description: v })}
          placeholder="Quem é, no que acredita, o que entrega..."
          rows={5}
        />
      </Field>
      <Field label="Valores">
        <ChipsEditor
          value={value.values || []}
          onChange={(v) => onChange({ ...value, values: v })}
          placeholder="Ex: Verdade, Presença..."
        />
      </Field>
      <Field label="Diferenciais">
        <TextArea
          value={value.differentiators}
          onChange={(v) => onChange({ ...value, differentiators: v })}
          placeholder="O que torna esse cliente único?"
          rows={3}
        />
      </Field>
      <Field label="Produtos & Serviços">
        <ChipsEditor
          value={value.productsServices || []}
          onChange={(v) => onChange({ ...value, productsServices: v })}
          placeholder="Ex: Terapia individual..."
        />
      </Field>
    </>
  );
}

// ─── 03 Voice ─────────────────────────────────────────────────────

function VoiceForm({
  value,
  onChange,
}: {
  value: Dossier["voice"];
  onChange: (v: Dossier["voice"]) => void;
}) {
  return (
    <>
      <Field label="Tom de Voz">
        <TextArea
          value={value.tone}
          onChange={(v) => onChange({ ...value, tone: v })}
          placeholder="Como o cliente fala — direto, técnico, próximo, etc."
          rows={4}
        />
      </Field>
      <Field label="Público-alvo">
        <TextArea
          value={value.audience}
          onChange={(v) => onChange({ ...value, audience: v })}
          placeholder="Quem é a pessoa do outro lado?"
          rows={4}
        />
      </Field>
    </>
  );
}

// ─── 04 Market ───────────────────────────────────────────────────

function MarketForm({
  value,
  onChange,
}: {
  value: Dossier["market"];
  onChange: (v: Dossier["market"]) => void;
}) {
  return (
    <>
      <Field label="Concorrentes">
        <ChipsEditor
          value={value.competitors || []}
          onChange={(v) => onChange({ ...value, competitors: v })}
          placeholder="Nome ou @"
        />
      </Field>
      <Field label="Informações Relevantes">
        <TextArea
          value={value.notes}
          onChange={(v) => onChange({ ...value, notes: v })}
          placeholder="Qualquer contexto extra"
          rows={4}
        />
      </Field>
    </>
  );
}

// ─── 05 Contacts ─────────────────────────────────────────────────

const CHANNEL_OPTIONS = ["whatsapp", "email", "telefone", "instagram"];

function ContactsForm({
  value,
  onChange,
}: {
  value: Contact[];
  onChange: (v: Contact[]) => void;
}) {
  function updateAt(i: number, patch: Partial<Contact>) {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function toggleChannel(i: number, channel: string) {
    const current = value[i].channels || [];
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    updateAt(i, { channels: next });
  }
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {value.map((c, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              border: "0.5px solid rgba(13,74,74,0.08)",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
              <input
                value={c.name}
                onChange={(e) => updateAt(i, { name: e.target.value })}
                placeholder="Nome"
                style={inputStyle}
              />
              <input
                value={c.role || ""}
                onChange={(e) => updateAt(i, { role: e.target.value || null })}
                placeholder="Papel"
                style={inputStyle}
              />
              <button
                onClick={() => removeAt(i)}
                style={{
                  padding: "0 12px",
                  borderRadius: 8,
                  background: "white",
                  border: "0.5px solid rgba(13,74,74,0.18)",
                  cursor: "pointer",
                  color: "#9F1239",
                }}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CHANNEL_OPTIONS.map((ch) => {
                const on = (c.channels || []).includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(i, ch)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      background: on ? "var(--accent-soft)" : "white",
                      color: on ? "var(--accent-deep)" : "#8B867B",
                      border: `0.5px solid ${on ? "rgba(29,112,112,0.30)" : "rgba(13,74,74,0.15)"}`,
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          onChange([...value, { name: "", role: null, channels: [] }])
        }
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "white",
          border: "0.5px dashed rgba(13,74,74,0.25)",
          cursor: "pointer",
          fontSize: 13,
          color: "var(--accent-deep)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
        }}
      >
        <Plus size={14} strokeWidth={1.8} /> Adicionar contato
      </button>
    </>
  );
}

// ─── 06 Commercial ───────────────────────────────────────────────

function CommercialForm({
  value,
  onChange,
}: {
  value: Dossier["commercial"];
  onChange: (v: Dossier["commercial"]) => void;
}) {
  return (
    <>
      <Field label="Valor mensal (R$)">
        <input
          type="number"
          step="0.01"
          value={value.monthlyValue ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              monthlyValue: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="0,00"
          style={{ ...inputStyle, fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace" }}
        />
      </Field>
      <Field label="Tipo de engajamento">
        <TextInput
          value={value.engagementType}
          onChange={(v) => onChange({ ...value, engagementType: v })}
          placeholder="Ex: Projeto pontual, 60 dias..."
        />
      </Field>
      <Field label="Início do projeto">
        <TextInput
          value={value.startDate}
          onChange={(v) => onChange({ ...value, startDate: v })}
          placeholder="YYYY-MM-DD"
          mono
        />
      </Field>
      <Field label="Entrega prevista">
        <TextInput
          value={value.deliveryDate}
          onChange={(v) => onChange({ ...value, deliveryDate: v })}
          placeholder="YYYY-MM-DD"
          mono
        />
      </Field>
    </>
  );
}

// ─── 07 Archive ──────────────────────────────────────────────────

function ArchiveItemListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: { title: string; url: string | null }[];
  onChange: (v: { title: string; url: string | null }[]) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input
            value={it.title}
            onChange={(e) =>
              onChange(items.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))
            }
            placeholder="Título"
            style={inputStyle}
          />
          <input
            value={it.url ?? ""}
            onChange={(e) =>
              onChange(
                items.map((x, idx) =>
                  idx === i ? { ...x, url: e.target.value || null } : x,
                ),
              )
            }
            placeholder="URL (opcional)"
            style={{ ...inputStyle, fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace" }}
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{
              padding: "0 12px",
              borderRadius: 8,
              background: "white",
              border: "0.5px solid rgba(13,74,74,0.18)",
              cursor: "pointer",
              color: "#9F1239",
            }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { title: "", url: null }])}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          background: "white",
          border: "0.5px dashed rgba(13,74,74,0.25)",
          cursor: "pointer",
          fontSize: 12.5,
          color: "var(--accent-deep)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
        }}
      >
        <Plus size={13} strokeWidth={1.8} /> {placeholder || "Adicionar"}
      </button>
    </div>
  );
}

function ArchiveForm({
  value,
  onChange,
}: {
  value: Dossier["archive"];
  onChange: (v: Dossier["archive"]) => void;
}) {
  return (
    <>
      <Field label="Transcrições de Reuniões">
        <ArchiveItemListEditor
          items={value.meetingTranscripts || []}
          onChange={(v) => onChange({ ...value, meetingTranscripts: v })}
          placeholder="Adicionar transcrição"
        />
      </Field>
      <Field label="Arquivos Relevantes">
        <ArchiveItemListEditor
          items={value.relevantFiles || []}
          onChange={(v) => onChange({ ...value, relevantFiles: v })}
          placeholder="Adicionar arquivo"
        />
      </Field>
      <Field label="Roteiros de Anúncios">
        <ArchiveItemListEditor
          items={value.adScripts || []}
          onChange={(v) => onChange({ ...value, adScripts: v })}
          placeholder="Adicionar roteiro"
        />
      </Field>
    </>
  );
}

// ─── 08 Brand Identity ───────────────────────────────────────────

function BrandIdentityForm({
  value,
  onChange,
}: {
  value: Dossier["brandIdentity"];
  onChange: (v: Dossier["brandIdentity"]) => void;
}) {
  function updatePaletteAt(i: number, patch: Partial<PaletteColor>) {
    onChange({
      ...value,
      palette: (value.palette || []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }
  function removePaletteAt(i: number) {
    onChange({ ...value, palette: (value.palette || []).filter((_, idx) => idx !== i) });
  }
  return (
    <>
      <Field label="Paleta da marca">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(value.palette || []).map((c, i) => (
            <div
              key={i}
              style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, alignItems: "center" }}
            >
              <input
                value={c.name}
                onChange={(e) => updatePaletteAt(i, { name: e.target.value })}
                placeholder="Nome da cor"
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={c.hex || "#000000"}
                  onChange={(e) => updatePaletteAt(i, { hex: e.target.value })}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    border: "0.5px solid rgba(13,74,74,0.18)",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
                <input
                  value={c.hex}
                  onChange={(e) => updatePaletteAt(i, { hex: e.target.value })}
                  placeholder="#000000"
                  style={{
                    ...inputStyle,
                    fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                    flex: 1,
                  }}
                />
              </div>
              <button
                onClick={() => removePaletteAt(i)}
                style={{
                  padding: "0 12px",
                  borderRadius: 8,
                  background: "white",
                  border: "0.5px solid rgba(13,74,74,0.18)",
                  cursor: "pointer",
                  color: "#9F1239",
                  height: 38,
                }}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...value, palette: [...(value.palette || []), { name: "", hex: "#1D7070" }] })}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "white",
              border: "0.5px dashed rgba(13,74,74,0.25)",
              cursor: "pointer",
              fontSize: 12.5,
              color: "var(--accent-deep)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
            }}
          >
            <Plus size={13} strokeWidth={1.8} /> Adicionar cor
          </button>
        </div>
      </Field>
      <Field label="Logos (links)">
        <ArchiveItemListEditor
          items={(value.logos || []).map((l) => ({ title: l.name, url: l.url }))}
          onChange={(arr) =>
            onChange({ ...value, logos: arr.map((a) => ({ name: a.title, url: a.url || "" })) })
          }
          placeholder="Adicionar logo"
        />
      </Field>
    </>
  );
}

// ─── 09 Performance ──────────────────────────────────────────────

function PerformanceForm({
  value,
  onChange,
}: {
  value: Dossier["performance"];
  onChange: (v: Dossier["performance"]) => void;
}) {
  const num = (key: keyof Dossier["performance"]) => (
    <input
      type="number"
      step="0.01"
      value={value[key] ?? ""}
      onChange={(e) =>
        onChange({
          ...value,
          [key]: e.target.value === "" ? null : Number(e.target.value),
        })
      }
      placeholder="—"
      style={{ ...inputStyle, fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace" }}
    />
  );
  return (
    <>
      <Field label="CPA alvo (R$)">{num("cpaTarget")}</Field>
      <Field label="ROAS mínimo (multiplicador)">{num("minRoas")}</Field>
      <Field label="Ticket médio (R$)">{num("avgTicket")}</Field>
      <Field label="Taxa de conversão (%)">{num("conversionRate")}</Field>
      <Field label="Taxa/hora (R$)">{num("hourlyRate")}</Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
