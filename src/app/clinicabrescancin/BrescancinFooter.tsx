export default function BrescancinFooter() {
  return (
    <footer className="brescancin-footer">
      <div className="brescancin-footer-rule" aria-hidden />
      <p className="brescancin-footer-brand">Clínica Brescancin</p>
      <p className="brescancin-footer-tagline">
        Excelência em Restauração Capilar
      </p>
      <p className="brescancin-footer-meta">
        © {new Date().getFullYear()} · Todos os direitos reservados
      </p>
    </footer>
  );
}
