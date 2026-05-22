const DIFFS = [
  {
    title: "O relacionamento é um sistema",
    body: "Quando um muda, o outro precisa se reposicionar. Por isso começo sempre pelo individual — antes de qualquer outra coisa. A transformação de um já move o outro.",
  },
  {
    title: "Desgastado é diferente de abusivo",
    body: "Essa distinção muda tudo. Relacionamento desgastado tem potencial de transformação. Relacionamento abusivo exige saída — e sou o primeiro a dizer quando esse é o caso.",
  },
  {
    title: "A pessoa inteira na sessão",
    body: "O que acontece no trabalho, no corpo, no propósito — tudo chega na relação. Não existe conflito que não carregue algo de cada uma das duas vidas.",
  },
  {
    title: "Um psicólogo que entende o lado dele",
    body: "Existe um terapeuta aqui que fala com homens sem julgamento. Isso muda a dinâmica — dos dois lados.",
  },
];

export function WhyDifferent() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-container px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="eyebrow text-muted">Diferencial</p>
            <h2 className="display mt-6 text-[clamp(2rem,4vw,3.25rem)] text-ink">
              Por que <span className="accent">diferente</span>.
            </h2>
          </div>
          <p className="self-end text-[15px] leading-relaxed text-ink/70">
            Em um nicho dominado por psicólogas focadas no empoderamento
            individual, ocupo um espaço único: entendo o casal como{" "}
            <strong className="font-semibold text-ink">sistema</strong> —
            homem e mulher, com a mesma profundidade.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {DIFFS.map((d, i) => (
            <article key={i} className="card-light relative">
              <span
                aria-hidden
                className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full bg-gold"
              />
              <h3 className="font-serif text-2xl italic text-ink">
                {d.title}
              </h3>
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink/70">
                {d.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
