"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, AlertCircle, Check, Info, ArrowUpRight } from "lucide-react";
import type { InsightSeverity } from "@prisma/client";

type Insight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
};

const SEVERITY_STYLE: Record<InsightSeverity, { bg: string; icon: any }> = {
  OK: { bg: "bg-success/12 text-success", icon: Check },
  WARN: { bg: "bg-warning/14 text-warning", icon: AlertCircle },
  INFO: { bg: "bg-info/12 text-info", icon: Info },
};

// Card de "Análise" — puxa ClientInsight status=APPROVED do engagement.
// Só o admin vê o link "Curar" pra tela de curadoria.
export function InsightsCard({
  engagementId,
  showCurationLink,
}: {
  engagementId: string;
  showCurationLink?: boolean;
}) {
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    fetch(`/api/portal/insights?engagementId=${engagementId}&status=APPROVED`)
      .then((r) => r.json())
      .then((data) => setInsights(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setInsights([]));
  }, [engagementId]);

  return (
    <div className="relative bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-6 overflow-hidden min-h-[280px]">
      {/* Halo — único da página, marca o card de análise */}
      <div
        className="absolute -top-1/3 -right-1/5 w-[340px] h-[340px] pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(60,176,166,0.28), transparent 55%), radial-gradient(circle at 70% 60%, rgba(238,156,122,0.16), transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur border border-border flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand" strokeWidth={1.9} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
              Análise
              <span className="text-[11px] text-muted-foreground font-medium ml-2">
                · pela Arthea
              </span>
            </h3>
          </div>
          {showCurationLink && (
            <Link
              href={`/clientes/portal/${engagementId}/analise`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition"
            >
              Curar <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          )}
        </div>

        {insights === null && (
          <div className="flex-1 flex items-center justify-center text-[12px] text-muted-foreground">
            Carregando…
          </div>
        )}

        {insights !== null && insights.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 pt-2">
            <div className="text-[13px] text-foreground/80 max-w-[240px] leading-relaxed">
              Nenhuma análise publicada ainda.
            </div>
            {showCurationLink && (
              <Link
                href={`/clientes/portal/${engagementId}/analise`}
                className="text-[12px] text-brand hover:underline"
              >
                Gerar sugestões e aprovar →
              </Link>
            )}
          </div>
        )}

        {insights && insights.length > 0 && (
          <div className="flex-1 flex flex-col gap-2">
            {insights.map((i) => {
              const s = SEVERITY_STYLE[i.severity];
              const Icon = s.icon;
              return (
                <div
                  key={i.id}
                  className="bg-card/70 backdrop-blur border border-border/60 rounded-xl p-3 flex gap-2.5 items-start"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                    <Icon className="w-3 h-3" strokeWidth={2.4} />
                  </div>
                  <div className="text-[12.5px] text-foreground leading-relaxed">
                    <strong className="text-foreground font-semibold">{i.title}</strong>
                    <span className="block text-muted-foreground text-[11.5px] mt-0.5 leading-tight line-clamp-2">
                      {i.body}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
