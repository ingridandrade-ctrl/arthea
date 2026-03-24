"use client";

import { useState } from "react";
import { Wifi, WifiOff, Bot, Key } from "lucide-react";

export default function SettingsPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<string>("unknown");
  const [checking, setChecking] = useState(false);

  async function checkWhatsApp() {
    setChecking(true);
    try {
      const res = await fetch("/api/webhook/evolution", { method: "GET" }).catch(() => null);
      setWhatsappStatus(res?.ok ? "connected" : "disconnected");
    } catch {
      setWhatsappStatus("disconnected");
    }
    setChecking(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* WhatsApp Connection */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5" />
          WhatsApp / Evolution API
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a conexão com o WhatsApp via Evolution API
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">URL da Evolution API</label>
            <input
              type="text"
              defaultValue={process.env.NEXT_PUBLIC_EVOLUTION_URL || "http://localhost:8080"}
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instância</label>
            <input
              type="text"
              defaultValue="arthea"
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={checkWhatsApp}
              disabled={checking}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {checking ? "Verificando..." : "Verificar Conexão"}
            </button>
            <span className="flex items-center gap-1.5 text-sm">
              {whatsappStatus === "connected" ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" /> Conectado
                </>
              ) : whatsappStatus === "disconnected" ? (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" /> Desconectado
                </>
              ) : (
                <span className="text-muted-foreground">Status desconhecido</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Chatbot Settings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5" />
          Chatbot IA
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurações do chatbot com inteligência artificial
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">API Key da Anthropic</label>
            <input
              type="password"
              defaultValue="••••••••••"
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Configure via variável de ambiente ANTHROPIC_API_KEY
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold">Webhook URL</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure esta URL na Evolution API para receber mensagens:
        </p>
        <code className="block mt-3 bg-muted px-4 py-2 rounded-lg text-sm font-mono">
          {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}
          /api/webhook/evolution
        </code>
      </div>
    </div>
  );
}
