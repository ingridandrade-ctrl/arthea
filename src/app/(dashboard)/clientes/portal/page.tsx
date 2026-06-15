import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PanelsTopLeft, ArrowRight, Mail, Briefcase, Plus } from "lucide-react";
import { NewClientButton } from "./_components/new-client-button";

const PHASE_LABEL = ["", "Imersão", "Construção", "Rastreamento", "Entrega"];

export default async function PortalClientesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const projects = await prisma.clientEngagement.findMany({
    include: {
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { deliverables: true, accesses: true, references: true } },
      deliverables: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Portal de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie os projetos visíveis no portal do cliente.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo cliente (wizard)
          </Link>
          <NewClientButton />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PanelsTopLeft className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold mb-2">Nenhum projeto cadastrado</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Crie o primeiro projeto pra começar a usar o portal de clientes. O cliente recebe
            acesso por e-mail e senha pra ver entregáveis, validar, comentar e ver os acessos.
          </p>
          <NewClientButton variant="primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const total = p.deliverables.length;
            const approved = p.deliverables.filter((d) => d.status === "APPROVED").length;
            const waiting = p.deliverables.filter((d) => d.status === "WAITING_REVIEW").length;
            const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
            const accent = p.accentColor || "#1D7070";

            return (
              <Link
                key={p.id}
                href={`/portal-clientes/${p.id}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition relative overflow-hidden"
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                  style={{ background: accent }}
                />

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold truncate">{p.name}</h3>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <p className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        {p.client.name}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {p.client.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: accent + "1A",
                      color: accent,
                    }}
                  >
                    Fase {p.currentPhase} · {PHASE_LABEL[p.currentPhase]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      {approved} de {total} aprovados
                    </span>
                    <span className="font-semibold" style={{ color: accent }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: accent + "20" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: accent }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    {waiting > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium" style={{ color: accent }}>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        {waiting} aguardando
                      </span>
                    )}
                    <span>{p._count.accesses} acessos</span>
                    <span>{p._count.references} refs</span>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: accent }}
                  />
                </div>

                {!p.isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase tracking-wider">
                      Inativo
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
