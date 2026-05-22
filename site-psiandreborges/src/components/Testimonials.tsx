const TESTIMONIALS = [
  {
    n: "01",
    text: "Eu e minha esposa chegamos no limite. O André nos ajudou a entender o que a gente estava fazendo um com o outro sem perceber. Hoje somos um casal diferente.",
    author: "M. R.",
    meta: "38 · Terapia de Casal",
  },
  {
    n: "02",
    text: "Eu ia pra sessão achando que era culpa dela. Saí entendendo o que eu trazia. Isso mudou tudo.",
    author: "F. L.",
    meta: "34 · Individual",
  },
  {
    n: "03",
    text: "Finalmente um psicólogo que escuta o lado do homem sem achar que o homem é sempre o problema.",
    author: "R. S.",
    meta: "41 · Individual",
  },
];

export function Testimonials() {
  return (
    <section className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-container px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-cream/40">Vozes</p>
            <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.5rem)] text-cream">
              Quem passou
              <br />
              por <span className="accent">aqui</span>.
            </h2>
          </div>
          <p className="max-w-xs text-[11px] uppercase tracking-eyebrow text-cream/40 md:text-right">
            Depoimentos com consentimento — identidades preservadas
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.n}
              className="flex flex-col gap-6 rounded-2xl bg-cream-50 p-7 text-ink shadow-[0_18px_30px_-22px_rgba(0,0,0,0.6)]"
            >
              <header className="flex items-start justify-between">
                <span aria-hidden className="font-serif text-3xl leading-none text-gold">
                  &rdquo;
                </span>
                <span className="text-[11px] uppercase tracking-eyebrow text-muted-dark">
                  Testemunho · {t.n}
                </span>
              </header>

              <p className="font-serif text-xl italic leading-snug">{t.text}</p>

              <footer className="mt-auto flex items-center justify-between border-t border-ink/10 pt-5 text-[11px] uppercase tracking-eyebrow text-muted-dark">
                <span className="font-semibold text-ink">{t.author}</span>
                <span>{t.meta}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
