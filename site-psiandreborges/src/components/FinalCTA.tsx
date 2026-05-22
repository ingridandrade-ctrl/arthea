export function FinalCTA() {
  return (
    <section id="agendar" className="relative isolate overflow-hidden bg-ink py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/images/hero-embrace.jpg')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40"
      />

      <div className="mx-auto max-w-container px-6 text-center">
        <p className="eyebrow text-cream/40">Próximo passo</p>
        <h2 className="display mx-auto mt-6 max-w-3xl text-[clamp(2.5rem,5.5vw,4.75rem)] text-cream">
          O relacionamento que você quer ainda{" "}
          <span className="accent">existe</span>.
        </h2>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-8 md:flex-row md:items-end md:justify-between md:text-left">
          <p className="max-w-md text-[15px] leading-relaxed text-cream/70">
            Mas precisa de atenção antes que a distância vire permanente.
            Agende uma sessão de clareza — 50 minutos para decidir o próximo
            passo.
          </p>
          <a href="https://wa.me/" className="btn-primary shrink-0">
            Agendar sessão de clareza
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
