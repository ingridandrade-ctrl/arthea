export function ContrastSection() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink-800 md:max-w-md">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/painting-couple-1.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
        </div>

        <div className="text-ink">
          <h2 className="display text-[clamp(2rem,4vw,3.25rem)]">
            Nunca se falou tanto sobre como as pessoas devem se{" "}
            <span className="accent">relacionar</span>.
          </h2>
          <h2 className="display mt-4 text-[clamp(2rem,4vw,3.25rem)]">
            E nunca as pessoas estiveram tão{" "}
            <span className="accent underline decoration-gold/40 decoration-from-font underline-offset-4">
              perdidas
            </span>{" "}
            dentro dos seus relacionamentos.
          </h2>

          <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-ink/75">
            <p>
              O problema não é falta de informação. É{" "}
              <strong className="font-semibold text-ink">excesso de resposta</strong>{" "}
              para uma pergunta que cada um precisa responder por si mesmo.
            </p>
            <p>
              Não estou aqui para dizer o que você deve fazer com o seu
              relacionamento. Estou aqui para que{" "}
              <strong className="font-semibold text-ink">
                você chegue à sua própria resposta
              </strong>{" "}
              — com clareza e sem pressa.
            </p>
          </div>

          <p className="mt-10 text-[11px] uppercase tracking-eyebrow text-muted-dark">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-current opacity-50" />
            André Borges · 2026
          </p>
        </div>
      </div>
    </section>
  );
}
