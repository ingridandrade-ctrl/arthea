export const LEAD_STATUSES = [
  { value: "ATIVO", label: "Ativo", color: "bg-blue-100 text-blue-700" },
  { value: "EM_ESPERA", label: "Em espera", color: "bg-yellow-100 text-yellow-700" },
  { value: "DESQUALIFICADO", label: "Desqualificado", color: "bg-gray-100 text-gray-600" },
  { value: "CLIENTE", label: "Cliente", color: "bg-green-100 text-green-700" },
  { value: "PERDIDO", label: "Perdido", color: "bg-red-100 text-red-700" },
] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number]["value"];

export function getLeadStatusLabel(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getLeadStatusColor(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-700";
}
