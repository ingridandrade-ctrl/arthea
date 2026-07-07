"use client";

import { useState } from "react";
import type { BusinessType } from "@prisma/client";
import { Zap, ShoppingBag, Users, Check, Loader2 } from "lucide-react";
import type { Platform } from "./platform-tabs";

// Setup inicial do dashboard de um cliente — roda UMA vez (quando o
// engagement ainda não tem ClientDashboardConfig). Escolhe o modelo de
// negócio + as plataformas de mídia, salva e nunca mais aparece; o admin
// pode reabrir pelo link "configurar" no dashboard.

const PERFIS: { id: BusinessType; label: string; icon: any; desc: string }[] = [
  {
    id: "INFOPRODUCT",
    label: "Infoproduto",
    icon: Zap,
    desc: "Lançamentos, VSL, webinar — funil de lead até o checkout.",
  },
  {
    id: "ECOMMERCE",
    label: "E-commerce",
    icon: ShoppingBag,
    desc: "Venda direta no site — ROAS, ticket médio, funil de compra.",
  },
  {
    id: "SERVICES",
    label: "Serviços",
    icon: Users,
    desc: "Clínica, arquitetura, advocacia — o anúncio abre conversa.",
  },
];

const PLATFORMS: { id: Platform; label: string; desc: string }[] = [
  { id: "meta", label: "Meta Ads", desc: "Facebook · Instagram · WhatsApp" },
  { id: "google", label: "Google Ads", desc: "Search · Shopping · YouTube · PMAX" },
];

export function DashboardSetup({
  engagementId,
  engagementName,
  clientName,
  initialBusinessType,
  initialPlatforms,
  onDone,
}: {
  engagementId: string;
  engagementName: string;
  clientName: string;
  initialBusinessType?: BusinessType;
  initialPlatforms?: Platform[];
  onDone: (businessType: BusinessType, platforms: Platform[]) => void;
}) {
  const [businessType, setBusinessType] = useState<BusinessType | null>(
    initialBusinessType ?? null,
  );
  const [platforms, setPlatforms] = useState<Set<Platform>>(
    new Set(initialPlatforms ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const canSave = businessType !== null && platforms.size > 0;

  async function save() {
    if (!canSave || !businessType) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/portal/dashboard-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engagementId,
        businessType,
        platforms: Array.from(platforms),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Falha ao salvar. Tente de novo.");
      return;
    }
    onDone(businessType, Array.from(platforms));
  }

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-brand font-semibold mb-2">
          Configuração inicial
        </p>
        <h1 className="text-[32px] font-semibold tracking-[-0.028em] leading-tight text-foreground">
          Dashboard de {engagementName}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Antes de montar o dashboard de {clientName}, me diz duas coisas. Isso define
          quais métricas e blocos aparecem — dá pra mudar depois.
        </p>
      </div>

      {/* 1 — Modelo de negócio */}
      <div className="mb-8">
        <h2 className="text-[14px] font-semibold text-foreground mb-1">
          1 · Qual o modelo de negócio?
        </h2>
        <p className="text-[12px] text-muted-foreground mb-3">
          Define o funil e as métricas de resultado que o dashboard prioriza.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PERFIS.map((p) => {
            const Icon = p.icon;
            const active = businessType === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setBusinessType(p.id)}
                className={`relative text-left p-4 rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] transition ${
                  active
                    ? "ring-2 ring-brand bg-brand/8"
                    : "bg-card hover:ring-1 hover:ring-brand/30"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
                <Icon
                  className={`w-5 h-5 mb-2 ${active ? "text-brand" : "text-muted-foreground"}`}
                  strokeWidth={1.8}
                />
                <div className="text-[14px] font-semibold text-foreground">{p.label}</div>
                <div className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 — Plataformas */}
      <div className="mb-8">
        <h2 className="text-[14px] font-semibold text-foreground mb-1">
          2 · Onde esse cliente anuncia?
        </h2>
        <p className="text-[12px] text-muted-foreground mb-3">
          O dashboard só mostra o que estiver marcado — sem abas vazias.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLATFORMS.map((p) => {
            const active = platforms.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={`relative text-left p-4 rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] transition ${
                  active
                    ? "ring-2 ring-brand bg-brand/8"
                    : "bg-card hover:ring-1 hover:ring-brand/30"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
                <div className="text-[14px] font-semibold text-foreground">{p.label}</div>
                <div className="text-[11.5px] text-muted-foreground mt-1">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-3 text-[13px] mb-4">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!canSave || saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-[14px] font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
        {saving ? "Criando dashboard…" : "Criar dashboard"}
      </button>
    </div>
  );
}
