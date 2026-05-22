const KEYWORDS = [
  "escuta",
  "vínculo",
  "presença",
  "responsabilidade afetiva",
  "clareza",
  "abordagem existencial",
  "sistema",
  "verdade",
];

function Strip() {
  return (
    <div className="flex shrink-0 items-center gap-12 px-6">
      {KEYWORDS.map((word, i) => (
        <span key={i} className="flex items-center gap-12">
          <span className="font-serif italic text-base md:text-lg text-ink/80">
            {word}
          </span>
          <span aria-hidden className="text-gold">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden border-y border-ink/5 bg-cream py-4">
      <div className="flex w-max animate-marquee">
        <Strip />
        <Strip />
      </div>
    </div>
  );
}
