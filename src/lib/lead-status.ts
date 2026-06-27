export const LEAD_STATUSES = [
  { value: "ATIVO", label: "Ativo", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  { value: "EM_ESPERA", label: "Em espera", color: "bg-amber-100 text-amber-800 border border-amber-200" },
  { value: "DESQUALIFICADO", label: "Desqualificado", color: "bg-slate-100 text-slate-600 border border-slate-200" },
  { value: "CLIENTE", label: "Cliente", color: "bg-teal-100 text-teal-700 border border-teal-200" },
  { value: "PERDIDO", label: "Perdido", color: "bg-rose-100 text-rose-700 border border-rose-200" },
] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number]["value"];

export function getLeadStatusLabel(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getLeadStatusColor(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-700";
}
