"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Plus, Zap, ToggleLeft, ToggleRight, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const triggerLabels: Record<string, string> = {
  STAGE_CHANGE: "Mudanca de Estagio",
  TIME_AFTER_STAGE: "Tempo apos Estagio",
  NEW_LEAD: "Novo Lead",
  NO_RESPONSE: "Sem Resposta",
};

const actionLabels: Record<string, string> = {
  SEND_WHATSAPP: "Enviar WhatsApp",
  MOVE_STAGE: "Mover Estagio",
  ASSIGN_AGENT: "Atribuir Agente",
  CREATE_REMINDER: "Criar Lembrete",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAutomations() {
    setLoading(true);
    const res = await fetch("/api/automations");
    const data = await res.json();
    setAutomations(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAutomations();
  }, []);

  async function toggleAutomation(id: string, isActive: boolean) {
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchAutomations();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automacoes</h1>
        <Link
          href="/automations/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Automacao
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhuma automacao configurada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie automacoes para enviar mensagens, mover deals e mais
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{automation.name}</h3>
                  </div>
                  {automation.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {automation.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{triggerLabels[automation.trigger] || automation.trigger}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="w-4 h-4" />
                      <span>{actionLabels[automation.action] || automation.action}</span>
                    </div>
                  </div>
                  {automation.logs.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Ultima execucao: {formatDate(automation.logs[0].executedAt)} -{" "}
                      {automation.logs[0].status}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleAutomation(automation.id, automation.isActive)}
                  className="shrink-0"
                >
                  {automation.isActive ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
