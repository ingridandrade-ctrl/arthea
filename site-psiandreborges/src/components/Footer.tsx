export function Footer() {
  return (
    <footer className="bg-ink-950 py-8">
      <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-3 px-6 text-center text-[11px] uppercase tracking-eyebrow text-cream/40 md:grid-cols-3 md:text-left">
        <span>André Borges</span>
        <span className="md:text-center">CRP /</span>
        <span className="md:text-right">© {new Date().getFullYear()} — Todos os direitos reservados</span>
      </div>
    </footer>
  );
}
