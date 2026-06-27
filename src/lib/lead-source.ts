export const LEAD_SOURCES = [
  { value: "PROSPECCAO", label: "Prospecção", color: "bg-purple-100 text-purple-700 border border-purple-200" },
  { value: "INDICACAO", label: "Indicação", color: "bg-pink-100 text-pink-700 border border-pink-200" },
  { value: "FORMS", label: "Forms site", color: "bg-sky-100 text-sky-700 border border-sky-200" },
] as const;

export function getSourceLabel(value: string): string {
  return LEAD_SOURCES.find((s) => s.value === value)?.label || value;
}

export function getSourceColor(value: string): string {
  return LEAD_SOURCES.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-700";
}
