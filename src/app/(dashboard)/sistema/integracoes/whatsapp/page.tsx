import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, XCircle, Phone, Key, Globe, Webhook } from "lucide-react";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WhatsAppIntegrationPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase() === "official" ? "official" : "evolution";
  const hasToken = !!process.env.WHATSAPP_API_TOKEN;
  const hasPhoneId = !!process.env.WHATSAPP_PHONE_ID;
  const hasVerifyToken = !!process.env.WHATSAPP_VERIFY_TOKEN;
  const hasEvolutionUrl = !!process.env.EVOLUTION_API_URL;
  const hasEvolutionKey = !!process.env.EVOLUTION_API_KEY;
  const evolutionInstance = process.env.EVOLUTION_INSTANCE || "arthea";

  const isOfficial = provider === "official";
  const configured = isOfficial
    ? hasToken && hasPhoneId
    : hasEvolutionUrl && hasEvolutionKey;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/sistema/integracoes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Integrações
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Mensagens automáticas, chatbot e follow-ups</p>
          </div>
        </div>
      </div>

      {/* Status geral */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Status da Conexão</h2>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            configured
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {configured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {configured ? "Conectado" : "Não configurado"}
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Provider ativo</span>
            <span className="font-medium">{isOfficial ? "Meta Oficial (Cloud API)" : "Evolution API"}</span>
          </div>
        </div>
      </div>

      {/* Configuração do provider ativo */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold">
          {isOfficial ? "Meta WhatsApp Cloud API" : "Evolution API"}
        </h2>

        {isOfficial ? (
          <div className="space-y-3">
            <ConfigRow
              icon={Key}
              label="WHATSAPP_API_TOKEN"
              configured={hasToken}
              hint="Token de acesso do Meta Business"
            />
            <ConfigRow
              icon={Phone}
              label="WHATSAPP_PHONE_ID"
              configured={hasPhoneId}
              hint="ID do número de telefone no Meta"
            />
            <ConfigRow
              icon={Key}
              label="WHATSAPP_VERIFY_TOKEN"
              configured={hasVerifyToken}
              hint="Token de verificação do webhook"
            />
            <ConfigRow
              icon={Webhook}
              label="Webhook URL"
              configured={true}
              hint="/api/webhook/whatsapp"
              isUrl
            />
          </div>
        ) : (
          <div className="space-y-3">
            <ConfigRow
              icon={Globe}
              label="EVOLUTION_API_URL"
              configured={hasEvolutionUrl}
              hint="URL do servidor Evolution"
            />
            <ConfigRow
              icon={Key}
              label="EVOLUTION_API_KEY"
              configured={hasEvolutionKey}
              hint="Chave de API do Evolution"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instância</span>
              <span className="text-sm font-medium">{evolutionInstance}</span>
            </div>
            <ConfigRow
              icon={Webhook}
              label="Webhook URL"
              configured={true}
              hint="/api/webhook/evolution"
              isUrl
            />
          </div>
        )}
      </div>

      {/* Funcionalidades */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold">Funcionalidades Ativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FeatureCard title="Chatbot IA" description="Respostas automáticas com inteligência artificial" active={configured} />
          <FeatureCard title="Follow-ups" description="Mensagens de acompanhamento agendadas" active={configured} />
          <FeatureCard title="Automações" description="Ações automáticas por mudança de status/estágio" active={configured} />
          <FeatureCard title="Handoff" description="Transferência automática para atendente humano" active={configured} />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900">
        <strong>Nota:</strong> As variáveis de ambiente são configuradas diretamente no painel da Vercel. Para alterar o provider ou tokens, acesse as configurações do projeto na Vercel.
      </div>
    </div>
  );
}

function ConfigRow({
  icon: Icon,
  label,
  configured,
  hint,
  isUrl,
}: {
  icon: any;
  label: string;
  configured: boolean;
  hint: string;
  isUrl?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      {isUrl ? (
        <code className="text-xs bg-muted px-2 py-1 rounded">{hint}</code>
      ) : (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          configured ? "text-emerald-600" : "text-red-500"
        }`}>
          {configured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {configured ? "OK" : "Ausente"}
        </span>
      )}
    </div>
  );
}

function FeatureCard({ title, description, active }: { title: string; description: string; active: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${active ? "border-border" : "border-border opacity-50"}`}>
      <div className="flex items-center gap-2">
        {active ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
