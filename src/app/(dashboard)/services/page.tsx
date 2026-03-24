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
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((pipelines) => {
        const svcs = pipelines.map((p: any) => ({
          ...p.service,
          pipeline: p,
          stageCount: p.stages.length,
          dealCount: p.stages.reduce(
            (sum: number, s: any) => sum + s.deals.length,
            0
          ),
        }));
        setServices(svcs);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Serviços</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Target;
          return (
            <div
              key={service.id}
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
                      <p className="text-xl font-bold">{service.dealCount}</p>
                      <p className="text-xs text-muted-foreground">Deals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{service.stageCount}</p>
                      <p className="text-xs text-muted-foreground">Estágios</p>
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
