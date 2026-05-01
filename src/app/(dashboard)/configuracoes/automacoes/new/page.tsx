"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewAutomationPage() {
  const router = useRouter();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trigger, setTrigger] = useState("STAGE_CHANGE");
  const [action, setAction] = useState("SEND_WHATSAPP");

  useEffect(() => {
    fetch("/api/pipeline").then(async (r) => {
      const pipeline = await r.json();
      // Pipeline is now a single object with stages
      if (pipeline && pipeline.stages) {
        setStages(pipeline.stages);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const triggerConfig: any = {};
    if (trigger === "STAGE_CHANGE") {
      triggerConfig.toStageId = formData.get("toStageId");
    }
    if (trigger === "TIME_AFTER_STAGE") {
      triggerConfig.stageId = formData.get("stageId");
      triggerConfig.delayMinutes = Number(formData.get("delayMinutes")) || 60;
    }
    if (trigger === "NO_RESPONSE") {
      triggerConfig.delayMinutes = Number(formData.get("delayMinutes")) || 1440;
    }

    const actionConfig: any = {};
    if (action === "SEND_WHATSAPP") {
      actionConfig.template = formData.get("template");
    }
    if (action === "MOVE_STAGE") {
      actionConfig.targetStageId = formData.get("targetStageId");
    }

    const body = {
      name: formData.get("name"),
      description: formData.get("description"),
      trigger,
      triggerConfig,
      action,
      actionConfig,
    };

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar automacao");
      setLoading(false);
      return;
    }

    router.push("/configuracoes/automacoes");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Nova Automacao</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input
            name="name"
            required
            placeholder="Ex: Follow-up 3 dias sem resposta"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descricao</label>
          <textarea
            name="description"
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Trigger */}
        <div className="border-t border-border pt-5">
          <label className="block text-sm font-semibold mb-2">Gatilho (Quando?)</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="STAGE_CHANGE">Quando deal mudar de estagio</option>
            <option value="TIME_AFTER_STAGE">Apos tempo no estagio</option>
            <option value="NEW_LEAD">Quando novo lead for criado</option>
            <option value="NO_RESPONSE">Quando lead nao responder</option>
          </select>

          {trigger === "STAGE_CHANGE" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Quando mover para o estagio:</label>
              <select name="toStageId" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Qualquer estagio</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {trigger === "TIME_AFTER_STAGE" && (
            <>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Estagio:</label>
                <select name="stageId" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Tempo (minutos):</label>
                <input
                  name="delayMinutes"
                  type="number"
                  defaultValue={4320}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">4320 min = 3 dias</p>
              </div>
            </>
          )}

          {trigger === "NO_RESPONSE" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Tempo sem resposta (minutos):</label>
              <input
                name="delayMinutes"
                type="number"
                defaultValue={1440}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">1440 min = 24 horas</p>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="border-t border-border pt-5">
          <label className="block text-sm font-semibold mb-2">Acao (O que fazer?)</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SEND_WHATSAPP">Enviar mensagem WhatsApp</option>
            <option value="MOVE_STAGE">Mover para outro estagio</option>
            <option value="ASSIGN_AGENT">Atribuir a um agente</option>
            <option value="CREATE_REMINDER">Criar lembrete</option>
          </select>

          {action === "SEND_WHATSAPP" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">
                Template da mensagem (use {"{{nome}}"}, {"{{empresa}}"}, {"{{servico}}"} como variaveis):
              </label>
              <textarea
                name="template"
                rows={4}
                placeholder={"Ola {{nome}}! Tudo bem? Notamos que faz um tempo desde nosso ultimo contato. Gostaria de saber se ainda tem interesse em {{servico}}."}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {action === "MOVE_STAGE" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Mover para estagio:</label>
              <select name="targetStageId" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar Automacao"}
        </button>
      </form>
    </div>
  );
}
