import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  LayoutGrid,
  CircleDollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Início · Portal Agência Arthea" };

export default async function InicioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userName = session.user?.name || "";
  const firstName = userName.split(" ")[0];

  const [leadsCount, activeConversations, clientsCount, activeEngagements] =
    await Promise.all([
      prisma.lead.count({ where: { status: { not: "UNQUALIFIED" } } }),
      prisma.conversation.count({ where: { isAiActive: false } }).catch(() => 0),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.clientEngagement.count({ where: { isActive: true } }),
    ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 0 60px",
      }}
    >
      <header style={{ marginBottom: 60 }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 11,
            color: "var(--primary, #1D7070)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <span style={{ width: 18, height: 1, background: "var(--primary, #1D7070)" }} />
          {greeting}, {firstName}
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(36px, 5vw, 60px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            fontWeight: 600,
            margin: 0,
            maxWidth: 740,
          }}
        >
          Onde você quer
          <br />
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--primary, #1D7070)",
            }}
          >
            trabalhar
          </em>{" "}
          hoje?
        </h1>
        <p
          style={{
            color: "#8B867B",
            maxWidth: 580,
            fontSize: 16,
            margin: "20px 0 0",
            lineHeight: 1.6,
          }}
        >
          Três frentes, três modos de operar. Escolha por onde começar — você troca em 1
          clique.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}
      >
        <ModeCard
          number="01 / Vender"
          title="CRM"
          description="Leads, pipeline, conversas, tarefas e relatórios do funil de vendas."
          href="/crm"
          meta={`${leadsCount} lead${leadsCount === 1 ? "" : "s"} · ${activeConversations} convers${activeConversations === 1 ? "a" : "as"} aguardando`}
          color="#1D7070"
          softBg="rgba(29,112,112,0.10)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="26" height="26" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 8 8l4 4 9-9M14 4h7v7" />
            </svg>
          }
        />
        <ModeCard
          number="02 / Entregar"
          title="Clientes"
          description="Portal dos clientes ativos, frentes de trabalho, contratos e dados internos."
          href="/clientes/portal"
          meta={`${clientsCount} cliente${clientsCount === 1 ? "" : "s"} · ${activeEngagements} frente${activeEngagements === 1 ? "" : "s"} ativa${activeEngagements === 1 ? "" : "s"}`}
          color="#7C3AED"
          softBg="rgba(124,58,237,0.10)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="26" height="26" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          }
        />
        <ModeCard
          number="03 / Faturar"
          title="Financeiro"
          description="Lançamentos, recorrências, acertos e o panorama da casa."
          href="/financeiro"
          meta="Lançamentos · Recorrências"
          color="#B45309"
          softBg="rgba(245,158,11,0.10)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="26" height="26" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
            </svg>
          }
        />
      </div>

      <p
        style={{
          marginTop: 80,
          textAlign: "center",
          color: "#8B867B",
          fontSize: 11,
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Portal Agência Arthea · maio·2026
      </p>
    </div>
  );
}

function ModeCard({
  number,
  title,
  description,
  href,
  meta,
  color,
  softBg,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  meta: string;
  color: string;
  softBg: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 20,
        padding: "36px 34px 32px",
        textDecoration: "none",
        color: "inherit",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="inicio-card"
    >
      <span
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10,
          color: "#A0A0A0",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {number}
      </span>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: softBg,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 24,
          marginBottom: 28,
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#8B867B",
          fontSize: 14,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {description}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 36,
          paddingTop: 20,
          borderTop: "0.5px solid rgba(13,74,74,0.10)",
          fontSize: 12,
          color: "#8B867B",
        }}
      >
        <span>{meta}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color,
            fontWeight: 500,
          }}
        >
          Entrar
          <ArrowRight size={13} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
