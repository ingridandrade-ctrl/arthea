export const LEAD_SOURCES = [
  { value: "WHATSAPP", label: "WhatsApp", color: "bg-green-100 text-green-700" },
  { value: "WEBSITE", label: "Website", color: "bg-sky-100 text-sky-700" },
  { value: "MANUAL", label: "Manual", color: "bg-slate-100 text-slate-700" },
  { value: "REFERRAL", label: "Indicação", color: "bg-purple-100 text-purple-700" },
  { value: "QUIZ", label: "Quiz", color: "bg-pink-100 text-pink-700" },
] as const;

export function getSourceLabel(value: string): string {
  return LEAD_SOURCES.find((s) => s.value === value)?.label || value;
}

export function getSourceColor(value: string): string {
  return LEAD_SOURCES.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-700";
}
