// CRMs que o rastreamento sabe ler. Cada CRM terá o próprio arquivo nesta
// pasta (rd-station.ts etc.), todos com a mesma interface. O resto do módulo
// só conhece o identificador e o nome.

export const CRMS = [{ id: "rd_station", nome: "RD Station CRM" }] as const;

export type CrmId = (typeof CRMS)[number]["id"];

export function isCrmValido(id: unknown): id is CrmId {
  return typeof id === "string" && CRMS.some((c) => c.id === id);
}

export function nomeDoCrm(id: string): string {
  return CRMS.find((c) => c.id === id)?.nome ?? id;
}
