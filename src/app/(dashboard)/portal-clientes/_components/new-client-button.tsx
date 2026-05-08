"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function NewClientButton({ variant = "default" }: { variant?: "default" | "primary" }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/client-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description") || null,
          currentPhase: Number(fd.get("currentPhase") || 1),
          accentColor: fd.get("accentColor") || "#1D7070",
          clientName: fd.get("clientName"),
          clientEmail: fd.get("clientEmail"),
          clientPassword: fd.get("clientPassword"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar.");
      } else {
        setOpen(false);
        router.push(`/portal-clientes/${data.id}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "primary"
            ? "px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
            : "px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
        }
      >
        <Plus className="w-4 h-4" /> Novo cliente
      </button>

      {open && (
        <Modal title="Novo cliente do portal" onClose={() => setOpen(false)} maxWidth="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-1">
                Conta de acesso
              </legend>
              <div>
                <label className="block text-xs font-medium mb-1">Nome do cliente *</label>
                <input
                  name="clientName"
                  required
                  placeholder="Ex: André Borges"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">E-mail *</label>
                <input
                  name="clientEmail"
                  type="email"
                  required
                  placeholder="cliente@empresa.com"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Senha inicial *</label>
                <input
                  name="clientPassword"
                  type="text"
                  required
                  defaultValue="arthea2026"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O cliente pode trocar depois em "Meu perfil".
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-1">
                Projeto
              </legend>
              <div>
                <label className="block text-xs font-medium mb-1">Nome do projeto *</label>
                <input
                  name="name"
                  required
                  placeholder="Ex: Construção de Presença Digital"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Descrição curta</label>
                <input
                  name="description"
                  placeholder="60 dias · objetivo, contexto..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Fase atual</label>
                  <select
                    name="currentPhase"
                    defaultValue="1"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="1">1 — Imersão</option>
                    <option value="2">2 — Construção</option>
                    <option value="3">3 — Rastreamento</option>
                    <option value="4">4 — Entrega</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cor de destaque</label>
                  <input
                    name="accentColor"
                    type="color"
                    defaultValue="#1D7070"
                    className="w-full h-9 border border-border rounded-lg"
                  />
                </div>
              </div>
            </fieldset>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Criando..." : "Criar cliente e projeto"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
