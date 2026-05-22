export function About() {
  return (
    <section className="bg-ink py-24 md:py-32">
      <div className="mx-auto grid max-w-container grid-cols-1 items-start gap-12 px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <div className="relative">
          <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-2xl bg-ink-800">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/andre.jpg')" }}
            />
          </div>

          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cream px-4 py-1.5 text-[10px] uppercase tracking-eyebrow text-ink">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
            CRP Registrado
          </span>

          <span className="absolute -bottom-4 right-0 max-w-[170px] rotate-[-4deg] rounded-2xl bg-gold px-4 py-3 text-[13px] leading-snug text-ink shadow-lg md:-right-6">
            <span className="font-serif italic">
              &ldquo;escuto antes de responder.&rdquo;
            </span>
            <span className="mt-1 block text-[11px] text-ink/70">— A.B.</span>
          </span>
        </div>

        <div className="text-cream">
          <p className="eyebrow text-cream/40">Eu</p>
          <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.5rem)]">
            Entender relacionamentos foi{" "}
            <span className="accent">necessidade</span>
            <br className="hidden md:block" /> antes de profissão.
          </h2>

          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-cream/75">
            <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:leading-none first-letter:text-gold">
              Não cheguei aqui pela teoria. Cheguei porque tive que aprender a
              me relacionar — do zero, com{" "}
              <strong className="font-semibold text-cream">
                tentativas e custos reais
              </strong>
              . Anos de terapia, de processos internos, de trabalho em mim
              mesmo.
            </p>
            <p>
              Cresci sendo o cara que as pessoas procuravam para conversar.{" "}
              <strong className="font-semibold text-cream">
                A psicologia me encontrou muito antes
              </strong>{" "}
              de eu entrar numa faculdade.
            </p>
            <p>
              Hoje sou especialista em psicologia dos relacionamentos e
              psicologia financeira — e entendo essas palavras no sentido mais
              amplo.{" "}
              <strong className="font-semibold text-cream">
                Relacionamento não existe isolado
              </strong>
              . O que se passa no trabalho, nas finanças, no sentido que a
              pessoa dá à própria vida — tudo atravessa o que duas pessoas
              constroem juntas.
            </p>
            <p>
              Minha abordagem é existencial. Não trato sintomas isolados nem
              dou receitas. Crio o espaço para que{" "}
              <strong className="font-semibold text-cream">
                cada um chegue à sua própria resposta
              </strong>{" "}
              — com clareza, sem pressa e sem julgamento.
            </p>
            <p>
              Sou casado, pai, e atendo em Pirassununga/SP e online para todo
              o Brasil.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
