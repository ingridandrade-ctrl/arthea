/**
 * Aritmética de dias úteis considerando feriados nacionais brasileiros.
 *
 * Os feriados móveis (Carnaval, Corpus Christi) são derivados da Páscoa
 * (algoritmo de Gauss) — funciona pra qualquer ano sem hardcoding.
 *
 * Feriados estaduais/municipais não são considerados aqui — adicionar
 * conforme necessidade da Arthea (ex: 9 de julho em SP, 23 de abril no
 * RJ, etc).
 */

/** Calcula a data da Páscoa pro ano (algoritmo de Gauss). */
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Set de feriados nacionais brasileiros pro ano (chave: "YYYY-MM-DD"). */
function nationalHolidaysBR(year: number): Set<string> {
  const easter = easterDate(year);
  const carnival = addDays(easter, -47); // terça-feira de Carnaval
  const carnivalMon = addDays(easter, -48); // segunda
  const corpusChristi = addDays(easter, 60);
  const goodFriday = addDays(easter, -2);

  return new Set([
    `${year}-01-01`, // Confraternização Universal
    isoYMD(carnivalMon),
    isoYMD(carnival),
    isoYMD(goodFriday),
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Trabalho
    isoYMD(corpusChristi),
    `${year}-09-07`, // Independência
    `${year}-10-12`, // N.S. Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra (federal desde 2024)
    `${year}-12-25`, // Natal
  ]);
}

/** Retorna true se é dia útil (não sábado/domingo/feriado nacional BR). */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const holidays = nationalHolidaysBR(date.getFullYear());
  return !holidays.has(isoYMD(date));
}

/**
 * Adiciona `n` dias úteis a `start`. Mantém a hora/minuto do horário inicial.
 *
 * Ex: addBusinessDays(sexta 14h, 1) → segunda 14h (pula sáb/dom)
 *     addBusinessDays(quinta 14h, 2) → próxima segunda 14h (pula sáb/dom)
 *     addBusinessDays(2026-04-21 / Tiradentes, 1) → 22/abr (pula feriado)
 */
export function addBusinessDays(start: Date, n: number): Date {
  if (n <= 0) {
    // Mesmo com n=0, se cair em fim-de-semana/feriado, avança pro próximo útil
    let d = new Date(start);
    while (!isBusinessDay(d)) d = addDays(d, 1);
    return d;
  }
  let result = new Date(start);
  let added = 0;
  while (added < n) {
    result = addDays(result, 1);
    if (isBusinessDay(result)) added++;
  }
  return result;
}
