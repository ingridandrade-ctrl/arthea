import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PanelsTopLeft, Plus, ArrowRight } from "lucide-react";
import { NewClientButton } from "./_components/new-client-button";

export default async function PortalClientesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");

  const projects = await prisma.clientProject.findMany({
    include: {
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { deliverables: true, accesses: true, references: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portal de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie os projetos visíveis no portal do cliente.
          </p>
        </div>
        <NewClientButton />
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <PanelsTopLeft className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Nenhum projeto cadastrado ainda.</p>
          <NewClientButton variant="primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/portal-clientes/${p.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Cliente
                  </p>
                  <p className="text-sm font-medium mt-0.5">{p.client.name}</p>
                  <p className="text-xs text-muted-foreground">{p.client.email}</p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    background: (p.accentColor || "#1D7070") + "1A",
                    color: p.accentColor || "#1D7070",
                  }}
                >
                  Fase {p.currentPhase}
                </span>
              </div>
              <h3 className="text-base font-semibold mb-3">{p.name}</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {p._count.deliverables} entregáveis · {p._count.accesses} acessos ·{" "}
                  {p._count.references} referências
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
