// Dados internos (privados da agência) de cada engagement.
// Vivem em ClientEngagement.internalData como JSONB; clientes nunca veem.

export type InternalData = {
  contractUrl: string | null;
  contractFileUrl: string | null;
  contractFileName: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractValue: number | null;
  paymentTerms: string | null;
  notes: string | null;
};

export const INTERNAL_DEFAULTS: InternalData = {
  contractUrl: null,
  contractFileUrl: null,
  contractFileName: null,
  contractStartDate: null,
  contractEndDate: null,
  contractValue: null,
  paymentTerms: null,
  notes: null,
};

export function parseInternalData(raw: unknown): InternalData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    contractUrl: typeof r.contractUrl === "string" ? r.contractUrl : null,
    contractFileUrl: typeof r.contractFileUrl === "string" ? r.contractFileUrl : null,
    contractFileName: typeof r.contractFileName === "string" ? r.contractFileName : null,
    contractStartDate: typeof r.contractStartDate === "string" ? r.contractStartDate : null,
    contractEndDate: typeof r.contractEndDate === "string" ? r.contractEndDate : null,
    contractValue: typeof r.contractValue === "number" ? r.contractValue : null,
    paymentTerms: typeof r.paymentTerms === "string" ? r.paymentTerms : null,
    notes: typeof r.notes === "string" ? r.notes : null,
  };
}
