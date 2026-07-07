import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { greetingPtBr } from "@/lib/time";
import Link from "next/link";
import { ArrowRight, Briefcase, Megaphone, Globe, MapPin, FileText } from "lucide-react";

const TYPE_META: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  STRATEGY: { label: "Estratégia digital", icon: Briefcase, color: "#1D7070" },
  PAID_TRAFFIC: { label: "Tráfego pago", icon: Megaphone, color: "#7C3AED" },
  LANDING_PAGE: { label: "Landing page", icon: Globe, color: "#0EA5E9" },
  GMB: { label: "Google Meu Negócio", icon: MapPin, color: "#F59E0B" },
};

export default async function PortalHub() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");
  const firstName = (session.user?.name || "").split(" ")[0];

  const engagements = await prisma.clientEngagement.findMany({
    where: { clientId: userId, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { deliverables: true } },
      deliverables: { select: { status: true } },
    },
  });

  const dossier = await prisma.clientDossier.findUnique({
    where: { clientId: userId },
    select: { id: true, updatedAt: true },
  });

  // Atalho: 1 engagement só → manda direto pra dashboard dela
  if (engagements.length === 1) {
    redirect(`/portal/${engagements[0].slug}`);
  }

  const greeting = greetingPtBr();

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <header style={{ padding: "8px 0 0" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          {greeting}, {firstName}
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(36px, 5.5vw, 52px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "16px 0 12px",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          Suas{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            frentes
          </em>{" "}
          ativas
        </h1>
        <p style={{ fontSize: 15, color: "#4A4A4A", margin: 0, maxWidth: 580 }}>
          Cada frente representa um trabalho da Arthea com você. Entre numa pra ver entregáveis,
          acessos e referências.
        </p>
      </header>

      {/* Dossiê do cliente */}
      <Link
        href="/portal/sobre"
        className="portal-card-hover"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.10)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: 18,
          padding: "22px 26px",
          textDecoration: "none",
          color: "inherit",
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={20} strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: 0,
            }}
          >
            Sobre você
          </p>
          <p style={{ fontSize: 17, fontWeight: 500, color: "#1A1A1A", margin: "3px 0 0" }}>
            Dossiê do cliente
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
            Contexto, marca, voz, contatos, paleta e metas.
            {dossier?.updatedAt && (
              <> · Atualizado {dossier.updatedAt.toLocaleDateString("pt-BR")}</>
            )}
          </p>
        </div>
        <ArrowRight size={16} strokeWidth={1.8} color="var(--accent)" />
      </Link>

      {/* Engagements */}
      {engagements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#A0A0A0",
            fontSize: 14,
            border: "1px dashed rgba(13,74,74,0.15)",
            borderRadius: 18,
          }}
        >
          Nenhuma frente ativa no momento.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {engagements.map((e, idx) => {
            const meta = TYPE_META[e.type] || TYPE_META.STRATEGY;
            const Icon = meta.icon;
            const total = e.deliverables.length;
            const approved = e.deliverables.filter((d) => d.status === "APPROVED").length;
            const waiting = e.deliverables.filter((d) => d.status === "WAITING_REVIEW").length;
            const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
            const accent = e.accentColor || meta.color;

            return (
              <Link
                key={e.id}
                href={`/portal/${e.slug}`}
                className="portal-card-hover portal-stagger"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.10)",
                  borderRadius: 18,
                  padding: "24px 26px",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                  overflow: "hidden",
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: accent,
                  }}
                />

                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: accent + "1A",
                      color: accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "#A0A0A0",
                        margin: 0,
                      }}
                    >
                      {meta.label}
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#1A1A1A",
                        margin: "3px 0 0",
                        lineHeight: 1.25,
                      }}
                    >
                      {e.name}
                    </p>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>
                      {approved} de {total} aprovados
                    </span>
                    <span style={{ fontWeight: 600, color: accent }}>{pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      background: accent + "1A",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: accent,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  <span>
                    Fase {e.currentPhase} de {e.totalPhases}
                  </span>
                  {waiting > 0 ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        color: accent,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: accent,
                        }}
                      />
                      {waiting} aguardando você
                    </span>
                  ) : (
                    <ArrowRight size={14} strokeWidth={1.8} color={accent} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
