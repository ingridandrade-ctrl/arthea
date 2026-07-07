import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { greetingPtBr } from "@/lib/time";

export const metadata = { title: "Início · Portal Agência Arthea" };

function currentDatePtBr(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
}

export default async function InicioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userName = session.user?.name || "";
  const firstName = userName.split(" ")[0];

  const [leadsCount, activeConversations, clientsCount, activeEngagements] =
    await Promise.all([
      prisma.lead.count({ where: { status: { notIn: ["DESQUALIFICADO", "PERDIDO"] } } }),
      prisma.conversation.count({ where: { isAiActive: false } }).catch(() => 0),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.clientEngagement.count({ where: { isActive: true } }),
    ]);

  const greeting = greetingPtBr();
  const dateStr = currentDatePtBr();

  return (
    <div className="max-w-[1180px] mx-auto px-6 py-10 pb-16">
      <header className="mb-14">
        <p className="font-mono text-[11px] text-primary tracking-[0.2em] uppercase inline-flex items-center gap-2.5 mb-5">
          <span className="w-5 h-px bg-primary" />
          {greeting}, {firstName}
          <span className="text-muted-foreground font-normal ml-1">— {dateStr}</span>
        </p>
        <h1 className="text-[clamp(36px,5vw,48px)] leading-[1.02] tracking-[-0.03em] font-semibold max-w-[740px]">
          Onde você quer
          <br />
          <em className="font-serif font-normal italic text-primary">
            trabalhar
          </em>{" "}
          hoje?
        </h1>
        <p className="text-muted-foreground max-w-[520px] text-[15px] mt-5 leading-relaxed">
          Três frentes, três modos de operar. Escolha por onde começar.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ModeCard
          number="01 / Vender"
          title="CRM"
          description="Leads, pipeline, conversas, tarefas e relatórios do funil de vendas."
          href="/crm"
          meta={`${leadsCount} lead${leadsCount === 1 ? "" : "s"} · ${activeConversations} convers${activeConversations === 1 ? "a" : "as"}`}
          color="#1D7070"
          softBg="rgba(29,112,112,0.08)"
          borderAccent="#1D7070"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 8 8l4 4 9-9M14 4h7v7" />
            </svg>
          }
        />
        <ModeCard
          number="02 / Entregar"
          title="Clientes"
          description="Portal dos clientes ativos, frentes de trabalho e dados internos."
          href="/clientes/portal"
          meta={`${clientsCount} cliente${clientsCount === 1 ? "" : "s"} · ${activeEngagements} frente${activeEngagements === 1 ? "" : "s"} ativa${activeEngagements === 1 ? "" : "s"}`}
          color="#2D6A9F"
          softBg="rgba(45,106,159,0.08)"
          borderAccent="#2D6A9F"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24" strokeWidth="1.6">
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
          color="#8B6B2E"
          softBg="rgba(139,107,46,0.08)"
          borderAccent="#8B6B2E"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
            </svg>
          }
        />
      </div>

      <p className="mt-20 text-center text-muted-foreground text-[11px] font-mono tracking-[0.14em] uppercase">
        Portal Agência Arthea
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
  borderAccent,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  meta: string;
  color: string;
  softBg: string;
  borderAccent: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block bg-card rounded-2xl border border-border/60 overflow-hidden no-underline text-inherit transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,74,74,0.08)] hover:border-border focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      {/* Accent top bar */}
      <div className="h-[3px]" style={{ background: borderAccent }} />

      <div className="px-8 pt-8 pb-7">
        <span className="font-mono text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
          {number}
        </span>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mt-6 mb-7"
          style={{ background: softBg, color }}
        >
          {icon}
        </div>

        <h2 className="text-[22px] font-semibold tracking-[-0.02em] mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground text-[13.5px] leading-[1.65]">
          {description}
        </p>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/60 text-[12px] text-muted-foreground">
          <span>{meta}</span>
          <span
            className="inline-flex items-center gap-1.5 font-medium transition-transform duration-200 group-hover:translate-x-1"
            style={{ color }}
          >
            Entrar
            <ArrowRight size={13} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
