import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Briefcase, Mail, AlertTriangle, Plus, RadioTower } from "lucide-react";
import { NewClientButton } from "./portal/_components/new-client-button";

// Lista de CLIENTES (User com role=CLIENT) — a porta de entrada única da
// área. Dentro de cada cliente vivem os projetos (ClientEngagement), o
// dossiê, plataformas e contrato.

export default async function ClientesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const clientes = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      engagements: {
        where: { isActive: true },
        select: {
          id: true,
          type: true,
          name: true,
          currentPhase: true,
          accentColor: true,
          deliverables: { select: { status: true } },
          metaAdAccounts: { select: { connection: { select: { status: true } } } },
          googleAdsAccounts: { select: { connection: { select: { status: true } } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada cliente é uma pasta — dentro tem os projetos, dossiê, plataformas e contrato.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/clientes/anuncios"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:border-foreground/30 transition"
          >
            <RadioTower className="w-4 h-4" strokeWidth={1.8} />
            Saúde dos anúncios
          </Link>
          <Link
            href="/projetos"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-3 py-2"
          >
            Ver todos os projetos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </Link>
          <NewClientButton />
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => {
            const engagements = c.engagements;
            const allDeliverables = engagements.flatMap((e) => e.deliverables);
            const totalDeliverables = allDeliverables.length;
            const approved = allDeliverables.filter((d) => d.status === "APPROVED").length;
            const waiting = allDeliverables.filter((d) => d.status === "WAITING_REVIEW").length;
            const pct = totalDeliverables > 0 ? Math.round((approved / totalDeliverables) * 100) : 0;

            const anyMetaIssue = engagements.some((e) =>
              e.metaAdAccounts.some((a) => a.connection.status !== "ACTIVE"),
            );
            const anyGoogleIssue = engagements.some((e) =>
              e.googleAdsAccounts.some((a) => a.connection.status !== "ACTIVE"),
            );
            const accent = engagements[0]?.accentColor || "#1D7070";

            return (
              <div
                key={c.id}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-[var(--accent)]/40 hover:shadow-md transition relative overflow-hidden"
              >
                {/* Clique no card abre a ficha do cliente (link esticado por baixo) */}
                <Link
                  href={`/clientes/${c.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Abrir ficha de ${c.name}`}
                />
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5 pointer-events-none"
                  style={{ background: accent }}
                />

                <div className="flex items-start gap-3 mb-4 pointer-events-none">
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: accent }}
                  >
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {c.email}
                    </p>
                  </div>
                  {(anyMetaIssue || anyGoogleIssue) && (
                    <span title="Conexão com problema">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    </span>
                  )}
                </div>

                {/* Atalhos diretos: cada projeto abre O DASHBOARD em 1 clique */}
                <div className="relative z-10 flex flex-wrap gap-1.5 mb-3">
                  {engagements.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem projetos ativos</span>
                  ) : (
                    engagements.map((e) => (
                      <Link
                        key={e.id}
                        href={`/clientes/portal/${e.id}/performance`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-black/5 text-[11.5px] font-medium text-foreground hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition"
                        title={`Abrir dashboard de ${e.name}`}
                      >
                        <Briefcase className="w-3 h-3" style={{ color: e.accentColor || accent }} />
                        {e.name}
                      </Link>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-3 border-t border-border pointer-events-none">
                  {waiting > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                      {waiting} aguardando você
                    </span>
                  ) : (
                    <span>tudo em dia</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    ficha do cliente
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      style={{ color: accent }}
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
