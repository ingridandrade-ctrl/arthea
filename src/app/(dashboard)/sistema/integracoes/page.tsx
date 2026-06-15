import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Megaphone, BarChart3, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

// Landing das integrações da agência (OAuth Meta + Google + futuro WhatsApp).
// Esta camada é CONFIGURAÇÃO TÉCNICA da agência — 1× por agência.
// A linkagem conta↔engagement (operacional, semanal) mora no cliente.

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const userId = session.user.id;

  const [metaConnections, googleConnection, metaAccountCount, googleAccountCount] = await Promise.all([
    prisma.metaConnection.findMany({
      where: { userId },
      select: { id: true, status: true, metaUserName: true, tokenExpiresAt: true },
    }),
    prisma.googleAdsConnection.findUnique({
      where: { userId },
      select: { id: true, status: true, mccCustomerId: true, updatedAt: true },
    }),
    prisma.metaAdAccount.count({ where: { connection: { userId } } }),
    prisma.googleAdsAccount.count({ where: { connection: { userId } } }),
  ]);

  const metaActive = metaConnections.some((c) => c.status === "ACTIVE");
  const googleActive = googleConnection?.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conexões OAuth da agência (faz uma vez, reconecta quando expira). A linkagem de uma conta a uma frente específica acontece dentro do cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IntegrationCard
          href="/sistema/integracoes/meta"
          icon={Megaphone}
          color="#2563EB"
          name="Meta Ads"
          sub="Facebook · Instagram · Messenger · WhatsApp"
          connected={metaActive}
          subStatus={
            metaActive
              ? `${metaConnections.length} ${metaConnections.length === 1 ? "conta conectada" : "contas conectadas"} · ${metaAccountCount} ad accounts disponíveis`
              : "Sem conexão ativa"
          }
        />
        <IntegrationCard
          href="/sistema/integracoes/google-ads"
          icon={BarChart3}
          color="#F59E0B"
          name="Google Ads"
          sub="Search · Display · YouTube · Performance Max"
          connected={!!googleActive}
          subStatus={
            googleActive
              ? `MCC ${googleConnection?.mccCustomerId} · ${googleAccountCount} contas disponíveis`
              : "Sem conexão ativa"
          }
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
        <strong>Como funciona:</strong> aqui você só conecta a conta-mãe da agência. Pra escolher qual conta do Meta/Google linka com qual frente do cliente, vá em Clientes → [cliente] → Plataformas (em breve).
      </div>
    </div>
  );
}

function IntegrationCard({
  href,
  icon: Icon,
  color,
  name,
  sub,
  connected,
  subStatus,
}: {
  href: string;
  icon: any;
  color: string;
  name: string;
  sub: string;
  connected: boolean;
  subStatus: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-2xl p-6 hover:border-[var(--accent)]/40 hover:shadow-md transition flex items-start gap-4"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "1A", color }}
      >
        <Icon className="w-6 h-6" strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold">{name}</h3>
          <span
            className={
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full " +
              (connected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200")
            }
          >
            {connected ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        <p className="text-sm text-foreground mt-3">{subStatus}</p>
      </div>
      <ArrowRight
        className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 mt-1.5"
      />
    </Link>
  );
}
