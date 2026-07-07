"use client";

import { Zap, ShoppingBag, Users } from "lucide-react";
import type { BusinessType } from "@prisma/client";

const PERFIS: { id: BusinessType; label: string; icon: any; desc: string }[] = [
  {
    id: "INFOPRODUCT",
    label: "Infoproduto",
    icon: Zap,
    desc: "Lançamentos, VSL, webinar — o resultado vem em janela: lead → checkout → compra.",
  },
  {
    id: "ECOMMERCE",
    label: "E-commerce",
    icon: ShoppingBag,
    desc: "Venda direta no site — ROAS, AOV, funil ViewContent → AddToCart → Purchase.",
  },
  {
    id: "SERVICES",
    label: "Serviços",
    icon: Users,
    desc: "Clínica, arquitetura, advocacia, SaaS — o anúncio abre conversa e a venda é offline.",
  },
];

export function PerfilSelector({
  value,
  onChange,
}: {
  value: BusinessType;
  onChange: (v: BusinessType) => void;
}) {
  const current = PERFIS.find((p) => p.id === value) || PERFIS[2];

  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-0.5 p-1 bg-card border border-border rounded-full shadow-sm mb-3">
        {PERFIS.map((p) => {
          const Icon = p.icon;
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition ${
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {p.label}
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] text-muted-foreground max-w-2xl">{current.desc}</p>
    </div>
  );
}
