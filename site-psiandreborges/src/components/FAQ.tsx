"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Como funciona o atendimento individual?",
    a: "Sessões semanais de 50 minutos, presencial em Pirassununga/SP ou online. Começamos entendendo o que te trouxe aqui — sem pressa de fechar nada. A primeira sessão é para você decidir se faz sentido continuar.",
  },
  {
    q: "E se meu parceiro não quiser vir?",
    a: "Sem problema. O trabalho individual já mexe na dinâmica do casal — quando um muda, o outro precisa se reposicionar. Muitos casos começam com um só e o parceiro entra depois, quando faz sentido para ele.",
  },
  {
    q: "O atendimento online funciona?",
    a: "Funciona. Atendo online há anos, com casais e indivíduos no Brasil inteiro. O que importa é o vínculo terapêutico e a presença na sessão — isso não depende do espaço físico.",
  },
  {
    q: "Como saber se vale tentar de novo?",
    a: "Essa é exatamente a pergunta da Sessão de Clareza. 50 minutos para olhar de fora, entender o que está acontecendo e decidir com base em algo mais sólido do que o impulso do momento.",
  },
  {
    q: "Qual a frequência das sessões?",
    a: "Semanal no começo. Depois, conforme o trabalho avança, podemos espaçar. O ritmo é definido junto — não tem fórmula.",
  },
  {
    q: "Como agendar?",
    a: "Pelo WhatsApp, ou pelo botão de agendamento no site. Respondo pessoalmente.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(5);

  return (
    <section id="faq" className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-container grid-cols-1 gap-12 px-6 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div>
          <p className="eyebrow text-muted">Dúvidas</p>
          <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.5rem)] text-ink">
            Perguntas que
            <br />
            <span className="accent">aparecem</span>.
          </h2>
          <p className="mt-6 max-w-xs text-[14.5px] leading-relaxed text-ink/70">
            Se a sua não está aqui, manda no WhatsApp. Respondo pessoalmente.
          </p>

          <div className="relative mt-10 aspect-[4/5] max-w-sm overflow-hidden rounded-2xl bg-ink-800">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/consultorio.jpg')" }}
            />
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-eyebrow text-muted-dark">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
            O consultório
          </p>
        </div>

        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-ink"
                >
                  <span className="flex items-center gap-6">
                    <span className="font-serif text-sm italic text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-xl italic leading-snug md:text-2xl">
                      {item.q}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/30 text-ink transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-6 pl-[60px] pr-8 text-[14.5px] leading-relaxed text-ink/70">
                    {item.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
