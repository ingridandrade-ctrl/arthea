import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DossierPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const dossier = await prisma.clientDossier.findUnique({
    where: { clientId: userId },
  });

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <header>
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
          Sobre você
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "12px 0 10px",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}
        >
          Tudo que importa{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            saber
          </em>
        </h1>
        <p style={{ fontSize: 15, color: "#4A4A4A", margin: 0, maxWidth: 580 }}>
          A base que orienta tudo que a Arthea faz pra você — presença, marca, voz, mercado,
          contatos, comercial, acervo e metas.
        </p>
      </header>

      {dossier?.legacySummaryHtml && (
        <section
          style={{
            background: "white",
            borderRadius: 20,
            padding: "36px 40px",
            border: "0.5px solid rgba(29,112,112,0.08)",
            boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
          }}
        >
          <div
            className="portal-prose"
            dangerouslySetInnerHTML={{ __html: dossier.legacySummaryHtml }}
          />
        </section>
      )}

      <div
        style={{
          border: "1px dashed rgba(13,74,74,0.15)",
          borderRadius: 18,
          padding: "32px 28px",
          textAlign: "center",
          color: "#A0A0A0",
          fontSize: 14,
        }}
      >
        As 9 seções estruturadas do dossiê (presença digital, voz, contatos, paleta, metas…)
        vão aparecer aqui em breve.
      </div>
    </div>
  );
}
