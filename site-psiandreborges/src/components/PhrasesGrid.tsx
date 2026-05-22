const PHRASES: { text: string; tone: "dark" | "gold" }[] = [
  {
    text: "A gente tenta conversar, mas sempre termina em briga. Ninguém se sente ouvido.",
    tone: "dark",
  },
  {
    text: "Sinto que a gente se afastou — e não sei quando foi acontecer isso.",
    tone: "gold",
  },
  {
    text: "Às vezes me pergunto se sou eu o problema. Ou se é ele.",
    tone: "dark",
  },
  {
    text: "A gente repete os mesmos conflitos. Parece que não tem saída.",
    tone: "dark",
  },
  {
    text: "Vale investir no relacionamento ou já passou do ponto?",
    tone: "gold",
  },
  {
    text: "Estou carregando isso sozinha e não sei mais o que sentir.",
    tone: "dark",
  },
  {
    text: "Quando o filho chegou, a gente parou de ser casal. Virou só rotina.",
    tone: "dark",
  },
  {
    text: "Durmo do lado dele todo dia e me sinto completamente só.",
    tone: "gold",
  },
];

function QuoteCard({ text, tone }: { text: string; tone: "dark" | "gold" }) {
  const isGold = tone === "gold";
  return (
    <article
      className={
        isGold
          ? "card-quote-gold relative"
          : "card-quote-dark relative text-cream"
      }
    >
      <span
        aria-hidden
        className={`absolute right-5 top-3 font-serif text-3xl leading-none ${
          isGold ? "text-ink/60" : "text-gold"
        }`}
      >
        &rdquo;
      </span>
      <p className="font-serif text-lg italic leading-snug md:text-xl">
        {text}
      </p>
    </article>
  );
}

export function PhrasesGrid() {
  return (
    <section className="bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-container px-6">
        <div className="text-center">
          <p className="eyebrow text-cream/40">Sintomas</p>
          <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.5rem)] text-cream">
            Frases que aparecem
            <br />
            nas <span className="accent">primeiras</span> sessões.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {PHRASES.map((p, i) => (
            <QuoteCard key={i} {...p} />
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center font-serif text-lg italic text-cream/70">
          Esses momentos não definem o fim. Definem que alguma coisa precisa de{" "}
          <span className="accent underline decoration-from-font underline-offset-4">
            atenção
          </span>
          .
        </p>
      </div>
    </section>
  );
}
