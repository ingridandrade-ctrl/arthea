"use client";

import { Settings, MessageCircle, Database, Info } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracoes Gerais</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Sobre o CRM</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">Arthea CRM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versao</span>
              <span className="font-medium">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Next.js 14</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">WhatsApp</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provedor</span>
              <span className="font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">API Oficial (Meta)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600">Configurado</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Para alterar configuracoes do WhatsApp, acesse o Meta Business Suite.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Banco de Dados</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provedor</span>
              <span className="font-medium">Neon PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Regiao</span>
              <span className="font-medium">sa-east-1 (Sao Paulo)</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">IA / Chatbot</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modelo</span>
              <span className="font-medium">Claude Sonnet 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600">Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
