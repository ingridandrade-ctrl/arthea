export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/images/hero-embrace.jpg')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_40%,rgba(10,23,51,0.55),rgba(10,23,51,0.95)_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/55 to-transparent"
      />

      <div className="mx-auto flex min-h-[88vh] max-w-container flex-col justify-center px-6 pt-32 pb-28 md:pt-40 md:pb-32">
        <div className="max-w-2xl">
          <h1 className="display text-[clamp(2.5rem,5.5vw,5rem)] text-cream">
            Muitos relacionamentos não terminam por falta de{" "}
            <span className="accent">amor</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-cream/85 md:text-xl">
            Terminam por não saber o que fazer com o amor que ainda está ali.
          </p>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-cream/55">
            Psicólogo especialista em relacionamentos. Um lugar para o seu
            relacionamento voltar a fazer sentido — individual ou em casal,
            online e presencial em Pirassununga/SP.
          </p>

          <a
            href="#agendar"
            className="btn-primary mt-8"
          >
            Quero meu relacionamento de volta
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>

        <div className="mt-auto flex items-end justify-between pt-20 text-xs italic text-cream/40">
          <span className="font-serif">online ou presencial</span>
          <span className="font-serif">terapia individual</span>
          <span className="not-italic uppercase tracking-eyebrow text-cream/30">
            scroll
          </span>
        </div>
      </div>
    </section>
  );
}
