import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDossier, SECTIONS } from "@/lib/dossier";
import { DossierView } from "./_components/dossier-view";

export default async function DossierPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;
  const userName = session.user?.name || "";
  const firstName = userName.split(" ")[0];

  const dossierRow = await prisma.clientDossier.findUnique({
    where: { clientId: userId },
  });

  // Engagements ativos pra contagem no hero
  const activeCount = await prisma.clientEngagement.count({
    where: { clientId: userId, isActive: true },
  });

  const dossier = parseDossier({
    digitalPresence: dossierRow?.digitalPresence,
    brandContext: dossierRow?.brandContext,
    voice: dossierRow?.voice,
    market: dossierRow?.market,
    contacts: dossierRow?.contacts,
    commercial: dossierRow?.commercial,
    archive: dossierRow?.archive,
    brandIdentity: dossierRow?.brandIdentity,
    performance: dossierRow?.performance,
  });

  const updatedAt = dossierRow?.updatedAt
    ? dossierRow.updatedAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).replace(/\./g, "")
    : null;

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top meta bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              position: "relative",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--accent)",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: 999,
                border: "1px solid var(--accent)",
                opacity: 0.4,
              }}
            />
          </span>
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10.5,
              color: "#8B867B",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Dossiê / Cliente
          </span>
          {updatedAt && (
            <>
              <span style={{ color: "#bcb6a8", fontSize: 11 }}>·</span>
              <span
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                  fontSize: 10.5,
                  color: "#8B867B",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Atualizado {updatedAt}
              </span>
            </>
          )}
        </div>
        <Link
          href="/portal/sobre/editar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: "0.02em",
            background: "var(--accent)",
            color: "white",
            border: "0.5px solid var(--accent)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Pencil size={13} strokeWidth={1.8} />
          Editar dossiê
        </Link>
      </div>

      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1fr)",
          background: "white",
          border: "0.5px solid rgba(13,74,74,0.10)",
          borderRadius: 18,
          overflow: "hidden",
          marginBottom: 18,
          boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
        }}
        className="dossier-hero"
      >
        <div style={{ padding: "44px 44px 38px", borderRight: "0.5px solid rgba(13,74,74,0.05)" }}>
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10.5,
              color: "var(--accent)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 16, height: 1, background: "var(--accent)" }} />
            00 / Contexto Estratégico
          </span>
          <h1
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "clamp(34px, 4.5vw, 52px)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              margin: 0,
              color: "#1A1A1A",
            }}
          >
            Tudo que importa saber
            <br />
            sobre{" "}
            <em
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--accent)",
              }}
            >
              {firstName || "você"}
            </em>
            .
          </h1>
          <p
            style={{
              color: "#8B867B",
              margin: "18px 0 0",
              maxWidth: 520,
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            A base que orienta todo o trabalho da Arthea — presença digital, marca, voz, mercado,
            contatos, comercial, acervo e metas. Vivo e editável.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
          <HeroStat label="Frentes ativas" value={String(activeCount).padStart(2, "0")} tag="No portal" />
          <HeroStat label="Seções" value="09" tag="Categorias estruturadas" bordered />
        </div>
      </section>

      {/* 9 seções */}
      {SECTIONS.map((meta) => (
        <DossierView
          key={meta.key}
          meta={meta}
          data={(dossier as any)[meta.key]}
        />
      ))}

      {/* Legacy HTML (se houver) */}
      {dossierRow?.legacySummaryHtml && (
        <section
          style={{
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.10)",
            borderRadius: 14,
            padding: "30px 36px",
            marginTop: 10,
          }}
        >
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10.5,
              color: "#8B867B",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Resumo original
          </p>
          <div
            className="portal-prose"
            dangerouslySetInnerHTML={{ __html: dossierRow.legacySummaryHtml }}
          />
        </section>
      )}

      <footer
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "0.5px solid rgba(13,74,74,0.05)",
          display: "flex",
          justifyContent: "space-between",
          color: "#8B867B",
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>Dossiê / {firstName || userName}</span>
        <span>arthea</span>
      </footer>
    </div>
  );
}

function HeroStat({
  label,
  value,
  tag,
  bordered,
}: {
  label: string;
  value: string;
  tag: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        borderTop: bordered ? "0.5px solid rgba(13,74,74,0.05)" : "none",
      }}
    >
      <span
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#8B867B",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div>
        <div
          style={{
            fontSize: 42,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            color: "#1A1A1A",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12.5, color: "#8B867B", marginTop: 8 }}>{tag}</div>
      </div>
    </div>
  );
}
