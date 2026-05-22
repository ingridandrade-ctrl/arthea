const SERVICES = [
  {
    tag: "Individual",
    title: "Atendimento Individual",
    body: "Às vezes é preciso entender o próprio padrão antes de falar de relacionamento. O atendimento individual começa aí — e já muda a dinâmica entre vocês.",
    meta: "Presencial · Online",
  },
  {
    tag: "Casal",
    title: "Terapia de Casal",
    body: "Os dois presentes. Cada um com espaço pra se expressar, sem que vire mais uma briga. Eu conduzo. Vocês chegam juntos até o que precisa ser dito.",
    meta: "Presencial · Online",
  },
  {
    tag: "Por onde começar",
    title: "Sessão de Clareza",
    body: "Não sabe se está pronto para terapia? 50 minutos para entender sua situação e decidir o próximo passo.",
    meta: "Online · Todo o Brasil",
  },
];

export function Services() {
  return (
    <section id="servicos" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-container px-6">
        <div className="text-center">
          <p className="eyebrow text-muted">Trabalho</p>
          <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.5rem)] text-ink">
            Três <span className="accent">portas</span>.<br />
            Uma direção.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.map((s, i) => (
            <article
              key={i}
              className="card-light flex flex-col gap-6"
            >
              <header className="flex items-start justify-between">
                <span className="text-[11px] uppercase tracking-eyebrow text-muted-dark">
                  {s.tag}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </header>

              <h3 className="font-serif text-3xl italic leading-tight text-ink">
                {s.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-ink/70">
                {s.body}
              </p>

              <footer className="mt-auto flex items-center justify-between border-t border-ink/10 pt-5">
                <span className="text-[11px] uppercase tracking-eyebrow text-muted-dark">
                  {s.meta}
                </span>
                <a
                  href="#agendar"
                  aria-label={`Saber mais sobre ${s.title}`}
                  className="text-ink transition-transform hover:translate-x-1 hover:-translate-y-1"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
