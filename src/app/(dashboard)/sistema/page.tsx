import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Info,
  MessageCircle,
  Database,
  Bot,
  CheckCircle2,
  XCircle,
  Globe,
  Server,
  Users,
  Briefcase,
  KanbanSquare,
  FileText,
  Megaphone,
  BarChart3,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SobreSistemaPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN") redirect("/inicio");

  const [
    userCount,
    leadCount,
    dealCount,
    serviceCount,
    automationCount,
    templateCount,
    metaConnections,
    googleConnection,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.service.count(),
    prisma.automation.count(),
    prisma.followUpTemplate.count(),
    prisma.metaConnection.findMany({
      select: { status: true },
    }),
    prisma.googleAdsConnection.findFirst({
      select: { status: true },
    }),
  ]);

  const aiConfig = await prisma.aiConfig.findUnique({ where: { id: "default" } });

  const whatsappConfigured = !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID);
  const aiConfigured = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  const metaConnected = metaConnections.some((c) => c.status === "ACTIVE");
  const googleConnected = googleConnection?.status === "ACTIVE";

  const MODEL_LABELS: Record<string, string> = {
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
    "claude-opus-4-8": "Claude Opus 4.8",
    "claude-sonnet-4-20250514": "Claude Sonnet 4",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
  };
  const aiModelLabel = MODEL_LABELS[aiConfig?.model || ""] || "Claude Sonnet 4";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sobre o Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do seu CRM, integrações e infraestrutura
        </p>
      </div>

      {/* Integrations Status */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Integrações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IntegrationStatus
            icon={MessageCircle}
            name="WhatsApp"
            description="API Oficial (Meta)"
            configured={whatsappConfigured}
            color="text-green-600"
            bg="bg-green-50"
            hint="Variáveis WHATSAPP_API_TOKEN e WHATSAPP_PHONE_ID"
          />
          <IntegrationStatus
            icon={Bot}
            name="IA / Chatbot"
            description={`${aiModelLabel} · ${aiConfig?.active !== false ? "Ativo" : "Desativado"}`}
            configured={aiConfigured}
            color="text-orange-600"
            bg="bg-orange-50"
            hint="Configurar em Configurações → Inteligência Artificial"
          />
          <IntegrationStatus
            icon={Megaphone}
            name="Meta Ads"
            description="Facebook · Instagram · Messenger"
            configured={metaConnected}
            color="text-blue-600"
            bg="bg-blue-50"
            hint="Configurar em Integrações → Meta Ads"
          />
          <IntegrationStatus
            icon={BarChart3}
            name="Google Ads"
            description="Search · Display · YouTube"
            configured={googleConnected}
            color="text-amber-600"
            bg="bg-amber-50"
            hint="Configurar em Integrações → Google Ads"
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados do Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Users} label="Usuários" value={userCount} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={Users} label="Leads" value={leadCount} color="text-teal-600" bg="bg-teal-50" />
          <StatCard icon={KanbanSquare} label="Deals" value={dealCount} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard icon={Briefcase} label="Serviços" value={serviceCount} color="text-orange-600" bg="bg-orange-50" />
          <StatCard icon={Zap} label="Automações" value={automationCount} color="text-yellow-600" bg="bg-yellow-50" />
          <StatCard icon={FileText} label="Templates" value={templateCount} color="text-purple-600" bg="bg-purple-50" />
        </div>
      </div>

      {/* Platform Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Arthea CRM</h2>
              <p className="text-xs text-muted-foreground">Plataforma de gestão</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow label="Versão" value="2.0.0" />
            <InfoRow label="Framework" value="Next.js 14 (App Router)" />
            <InfoRow label="Deploy" value="Vercel" />
            <InfoRow label="Região" value="GRU1 (São Paulo)" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Banco de Dados</h2>
              <p className="text-xs text-muted-foreground">Armazenamento de dados</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow label="Provedor" value="Neon PostgreSQL" />
            <InfoRow label="ORM" value="Prisma" />
            <InfoRow label="Região" value="sa-east-1 (São Paulo)" />
            <InfoRow label="Status" value="Operacional" status="active" />
          </div>
        </div>
      </div>

      {/* Hosting */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Infraestrutura</h2>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Hospedagem</p>
                <p className="text-xs text-muted-foreground">Vercel (Edge Network)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Server className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Runtime</p>
                <p className="text-xs text-muted-foreground">Node.js (Serverless Functions)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Banco</p>
                <p className="text-xs text-muted-foreground">Neon Serverless Postgres</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, status }: { label: string; value: string; status?: "active" | "inactive" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {status ? (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {value}
        </span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function IntegrationStatus({
  icon: Icon,
  name,
  description,
  configured,
  color,
  bg,
  hint,
}: {
  icon: any;
  name: string;
  description: string;
  configured: boolean;
  color: string;
  bg: string;
  hint: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{name}</h3>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            configured
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}>
            {configured ? (
              <><CheckCircle2 className="w-3 h-3" /> Configurado</>
            ) : (
              <><XCircle className="w-3 h-3" /> Não configurado</>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {!configured && (
          <p className="text-[11px] text-muted-foreground mt-1.5 italic">{hint}</p>
        )}
      </div>
    </div>
  );
}
