// Saudação em pt-BR baseada no horário de Brasília (America/Sao_Paulo).
// O servidor da Vercel roda em UTC, então usar `new Date().getHours()` direto
// dá saudação errada — quando é 09h em São Paulo, o servidor diz 12h UTC e
// já estaria "Boa tarde". Esse helper resolve via Intl.

/**
 * Retorna a hora local em Brasília (0-23), independente de onde o código
 * está executando (servidor em UTC, edge, etc).
 */
export function brHour(now: Date = new Date()): number {
  // Intl é a forma estável de pegar a hora em uma timezone específica.
  // Compatível com Node sem precisar de lib externa.
  const hourStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).format(now);
  // Pode vir "09" ou "9", então Number() resolve os dois.
  return Number(hourStr);
}

/**
 * Saudação adequada à hora atual em Brasília.
 *   madrugada e manhã (00–11) → "Bom dia"
 *   tarde (12–17)            → "Boa tarde"
 *   noite (18–23)            → "Boa noite"
 */
export function greetingPtBr(now: Date = new Date()): "Bom dia" | "Boa tarde" | "Boa noite" {
  const h = brHour(now);
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
