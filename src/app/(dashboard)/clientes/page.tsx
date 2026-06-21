import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Briefcase, Mail, AlertTriangle } from "lucide-react";

// Lista de CLIENTES (User com role=CLIENT). Substitui a antiga lista de
// engagements em /clientes/portal — aqui é a unidade primária.
// Engagements aparecem como sub-info de cada card.

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
            Cada cliente é uma pasta — dentro tem as frentes (engagements), dossiê, plataformas, contrato.
          </p>
        </div>
        <Link
          href="/clientes/portal"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Ver por frente
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-[var(--accent)]/40 hover:shadow-md transition relative overflow-hidden"
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                  style={{ background: accent }}
                />

                <div className="flex items-start gap-3 mb-4">
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

                <div className="space-y-2 mb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    {engagements.length === 0
                      ? "Sem frentes ativas"
                      : `${engagements.length} ${engagements.length === 1 ? "frente" : "frentes"}: ${engagements.map((e) => e.name).join(" · ")}`}
                  </p>
                </div>

                {totalDeliverables > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        {approved}/{totalDeliverables} entregas aprovadas
                      </span>
                      <span className="font-semibold" style={{ color: accent }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: accent + "20" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: accent }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                  {waiting > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                      {waiting} aguardando você
                    </span>
                  ) : (
                    <span>tudo em dia</span>
                  )}
                  <ArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: accent }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
