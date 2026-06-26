"use client";

import { useEffect, useState } from "react";
import { Bot, Save, Plus, X, Power, PowerOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recomendado)", desc: "Mais recente — melhor equilíbrio entre qualidade e velocidade" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", desc: "Modelo mais avançado, máxima qualidade, mais caro" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", desc: "Versão anterior do Sonnet, estável" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", desc: "Mais rápido e econômico, respostas mais simples" },
];

export default function IAConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    fetch("/api/ai/config")
      .then((r) => r.json())
      .then((data) => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/ai/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function addKeyword() {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || config.handoffKeywords.includes(kw)) return;
    setConfig({ ...config, handoffKeywords: [...config.handoffKeywords, kw] });
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    setConfig({ ...config, handoffKeywords: config.handoffKeywords.filter((k: string) => k !== kw) });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Erro ao carregar configurações da IA
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/sistema/integracoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Integrações
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inteligência Artificial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o chatbot, modelo e comportamento da IA
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Status + Bot Name */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold">Chatbot</h2>
            <p className="text-xs text-muted-foreground">Atendimento automático via WhatsApp</p>
          </div>
          <button
            onClick={() => setConfig({ ...config, active: !config.active })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              config.active
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {config.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
            {config.active ? "Ativo" : "Desativado"}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome do Bot</label>
          <input
            value={config.botName}
            onChange={(e) => setConfig({ ...config, botName: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Arthea IA"
          />
          <p className="text-xs text-muted-foreground mt-1">Como o bot se identifica nas conversas</p>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold">Modelo de IA</h2>
        <div className="space-y-2">
          {MODELS.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                config.model === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <input
                type="radio"
                name="model"
                value={m.id}
                checked={config.model === m.id}
                onChange={() => setConfig({ ...config, model: m.id })}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Máximo de tokens por resposta</label>
          <input
            type="number"
            value={config.maxTokens}
            onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 1024 })}
            className="w-32 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            min={256}
            max={4096}
          />
          <p className="text-xs text-muted-foreground mt-1">Controla o tamanho máximo das respostas (256–4096)</p>
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Prompt do Sistema</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Instruções que definem a personalidade, tom e comportamento do chatbot
          </p>
        </div>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          rows={16}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder="Instruções para o chatbot..."
        />
      </div>

      {/* Handoff Keywords */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Palavras de Transferência</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Quando o lead usar uma dessas palavras, a conversa é transferida para um humano
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {config.handoffKeywords.map((kw: string) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-lg text-sm"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="text-muted-foreground hover:text-red-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Digite uma nova palavra-chave..."
          />
          <button
            onClick={addKeyword}
            className="flex items-center gap-1 px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
