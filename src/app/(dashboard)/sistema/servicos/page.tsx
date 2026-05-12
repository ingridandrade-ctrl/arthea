"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Target, MapPin, Users, Layout, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const iconMap: Record<string, any> = {
  target: Target,
  "map-pin": MapPin,
  users: Users,
  layout: Layout,
};

export default function ServicosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);

  function fetchServices() {
    setLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchServices();
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
      <div>
        <h1 className="text-2xl font-bold">Servicos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Servicos funcionam como tags nos leads. Um lead pode ter mais de um servico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Target;
          return (
            <div
              key={service.id}
              className="group relative bg-card rounded-xl border border-border p-6"
            >
              <button
                onClick={() => setEditingService(service)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
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
                      <p className="text-xl font-bold">{service._count?.leads || 0}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    {service.basePrice != null && (
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatCurrency(service.basePrice)}</p>
                        <p className="text-xs text-muted-foreground">Preco Base</p>
                      </div>
                    )}
                    {service.setupFee != null && service.setupFee > 0 && (
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatCurrency(service.setupFee)}</p>
                        <p className="text-xs text-muted-foreground">Setup</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingService && (
        <Modal title="Editar Servico" onClose={() => setEditingService(null)}>
          <EditServiceForm
            service={editingService}
            onSaved={() => { setEditingService(null); fetchServices(); }}
          />
        </Modal>
      )}
    </div>
  );
}

function EditServiceForm({ service, onSaved }: { service: any; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description") || null,
        basePrice: fd.get("basePrice") ? parseFloat(fd.get("basePrice") as string) : null,
        setupFee: fd.get("setupFee") ? parseFloat(fd.get("setupFee") as string) : null,
      }),
    });
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input name="name" defaultValue={service.name} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descricao</label>
        <textarea name="description" rows={3} defaultValue={service.description || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Preco Base (R$)</label>
        <input name="basePrice" type="number" step="0.01" defaultValue={service.basePrice || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Taxa de Setup (R$)</label>
        <input name="setupFee" type="number" step="0.01" defaultValue={service.setupFee || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
