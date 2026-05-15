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
      <p className="brescancin-footer-credit">
        Feito por{" "}
        <a
          href="https://wa.me/5519992002917"
          target="_blank"
          rel="noopener noreferrer"
        >
          Agência Arthea
        </a>
      </p>
    </footer>
  );
}
