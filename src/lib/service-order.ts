// Ordem canônica em que os serviços devem aparecer em toda UI.
// Serviços não listados aparecem depois, em ordem alfabética.
export const SERVICE_SLUG_ORDER: string[] = [
  "google-meu-negocio",
  "trafego-pago",
  "landing-pages",
  "crm-automacao",
];

export function sortByCanonicalOrder<T extends { slug: string; name: string }>(items: T[]): T[] {
  const idx = (slug: string) => {
    const i = SERVICE_SLUG_ORDER.indexOf(slug);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...items].sort((a, b) => {
    const ia = idx(a.slug);
    const ib = idx(b.slug);
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}
