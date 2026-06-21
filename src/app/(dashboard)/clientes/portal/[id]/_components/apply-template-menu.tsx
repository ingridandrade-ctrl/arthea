"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { EngagementType } from "@prisma/client";
import { templatePhases } from "@/lib/engagement-templates";
import { phaseNamesFor } from "@/app/(portal)/_components/deliverable-status";

export function ApplyTemplateMenu({
  engagementType,
  applying,
  onApply,
}: {
  engagementType: EngagementType;
  applying: boolean;
  onApply: (phase: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const phases = templatePhases(engagementType);
  const phaseNames = phaseNamesFor(engagementType);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (phases.length === 0) {
    // Sem template pra esse tipo — nem mostra o botão
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={applying}
        className="px-3.5 py-1.5 border border-border rounded-lg text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted transition disabled:opacity-60"
        title="Cria os entregáveis padrão Arthea"
      >
        <Sparkles className="w-4 h-4" />
        {applying ? "Aplicando…" : "Aplicar template"}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              onApply(null);
            }}
            className="w-full text-left px-4 py-3 hover:bg-muted transition border-b border-border"
          >
            <p className="text-sm font-medium">Template completo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todas as {phases.length} fases ·{" "}
              {phases.reduce((acc, p) => acc + p.count, 0)} entregáveis
            </p>
          </button>
          {phases.map((p) => {
            const name = phaseNames[p.phase] || `Fase ${p.phase}`;
            return (
              <button
                key={p.phase}
                onClick={() => {
                  setOpen(false);
                  onApply(p.phase);
                }}
                className="w-full text-left px-4 py-3 hover:bg-muted transition border-b border-border last:border-b-0"
              >
                <p className="text-sm font-medium">
                  Só a Fase {p.phase}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {name} · {p.count} {p.count === 1 ? "entregável" : "entregáveis"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
