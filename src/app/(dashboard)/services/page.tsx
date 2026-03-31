"use client";

import { useEffect, useState } from "react";
import { Target, MapPin, Users, Layout } from "lucide-react";

const iconMap: Record<string, any> = {
  target: Target,
  "map-pin": MapPin,
  users: Users,
  layout: Layout,
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.leadsByService || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Hardcoded service info since we only have 4 services
  const serviceDetails = [
    {
      name: "Trafego Pago",
      slug: "trafego-pago",
      description: "Gestao de campanhas de midia paga (Google Ads, Meta Ads, TikTok Ads)",
      icon: "target",
      color: "#ef4444",
    },
    {
      name: "Google Meu Negocio",
      slug: "google-meu-negocio",
      description: "Otimizacao e gestao de perfil no Google Meu Negocio",
      icon: "map-pin",
      color: "#22c55e",
    },
    {
      name: "CRM / Automacao",
      slug: "crm-automacao",
      description: "Consultoria e implementacao de CRM e automacoes para empresas",
      icon: "users",
      color: "#6366f1",
    },
    {
      name: "Landing Pages",
      slug: "landing-pages",
      description: "Criacao de landing pages de alta conversao",
      icon: "layout",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Servicos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Servicos funcionam como tags nos leads. Um lead pode ter mais de um servico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceDetails.map((service) => {
          const Icon = iconMap[service.icon] || Target;
          const stats = services.find((s) => s.service === service.name);
          return (
            <div
              key={service.slug}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: service.color }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold">{stats?.count || 0}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
