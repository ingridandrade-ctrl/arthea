export function TopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-container items-center justify-between px-6 pt-7 text-[11px] uppercase tracking-eyebrow text-cream/70 md:pt-9">
        <span>André Borges · Psicólogo</span>
        <span>Pirassununga · SP</span>
      </div>
    </div>
  );
}
