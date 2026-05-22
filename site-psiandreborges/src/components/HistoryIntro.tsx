export function HistoryIntro() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-container px-6 text-center">
        <p className="eyebrow text-muted">História</p>
        <h2 className="display mx-auto mt-6 max-w-3xl text-[clamp(2rem,4.2vw,3.5rem)] text-ink">
          A maioria das histórias que chegam até mim não{" "}
          <span className="accent">termina</span> aqui.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
          Relacionamentos desgastados{" "}
          <strong className="font-semibold text-ink">
            não são relacionamentos mortos
          </strong>
          . São relacionamentos que perderam o caminho — e que, com o espaço
          certo, conseguem se reencontrar.
        </p>

        <div className="relative mx-auto mt-14 aspect-[4/5] max-w-xl overflow-hidden rounded-2xl bg-ink-800 md:aspect-[5/4]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/painting-couple-2.jpg')" }}
          />
        </div>
      </div>
    </section>
  );
}
