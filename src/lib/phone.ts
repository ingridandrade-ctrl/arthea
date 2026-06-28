/**
 * Normaliza telefone brasileiro pra o formato `5511999991234` (só dígitos,
 * com DDI 55). Usado em CRUD de Lead e nas buscas — sem isso, um lead
 * salvo via formulário como "+55 11 99999-1234" não casa com a resposta
 * que chega do webhook do WhatsApp como "5511999991234", criando lead
 * duplicado e mandando fluxo no vazio.
 *
 * Regras:
 *  - Strip de tudo que não é dígito.
 *  - Se a string final tiver 10–11 dígitos (DDD+número sem DDI), prepend "55".
 *  - Se já começa com 55 e tem 12–13 dígitos, mantém.
 *  - Outros formatos (ex: internacional não-BR) retornam o strip puro.
 */
export function normalizeLeadPhone(input: string | null | undefined): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  // 10 dígitos = DDD + 8 (fixo), 11 = DDD + 9 (celular). Falta DDI.
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}
