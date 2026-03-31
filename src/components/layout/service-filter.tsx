"use client";

import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { cn } from "@/lib/utils";

const services = [
  { slug: "all", name: "Todos", color: "#6366f1" },
  { slug: "trafego-pago", name: "Trafego Pago", color: "#ef4444" },
  { slug: "google-meu-negocio", name: "Google Meu Negocio", color: "#22c55e" },
  { slug: "crm-automacao", name: "CRM / Automacao", color: "#6366f1" },
  { slug: "landing-pages", name: "Landing Pages", color: "#f59e0b" },
];

export function ServiceFilter() {
  const { activeService, setActiveService } = useServiceFilter();

  return (
    <div className="flex items-center gap-2">
      {services.map((service) => (
        <button
          key={service.slug}
          onClick={() => setActiveService(service.slug)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            activeService === service.slug
              ? "text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          style={
            activeService === service.slug
              ? { backgroundColor: service.color }
              : undefined
          }
        >
          {service.name}
        </button>
      ))}
    </div>
  );
}
