// Definição dos campos extras por serviço.
// Cada serviço pode ter campos próprios que ficam armazenados em
// LeadService.customData como JSON.

export type FieldType = "text" | "textarea" | "select" | "boolean";

export interface ServiceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export const SERVICE_FIELDS: Record<string, ServiceField[]> = {
  "google-meu-negocio": [
    {
      key: "segmento",
      label: "Segmento de atuação",
      type: "select",
      options: [
        { value: "saude", label: "Saúde" },
        { value: "gastronomia", label: "Gastronomia" },
        { value: "varejo", label: "Varejo" },
        { value: "servicos", label: "Serviços" },
        { value: "corporativo", label: "Corporativo" },
        { value: "outro", label: "Outro" },
      ],
    },
    { key: "cidadeEstado", label: "Cidade e Estado", type: "text", placeholder: "São Paulo / SP" },
    {
      key: "enderecoFisico",
      label: "Endereço físico?",
      type: "select",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    {
      key: "temGmn",
      label: "Tem Google Meu Negócio?",
      type: "select",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
        { value: "naoSei", label: "Não sei" },
      ],
    },
    {
      key: "temSite",
      label: "Site oficial?",
      type: "select",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    { key: "linkAnalise", label: "Link da análise (GBP Check)", type: "text" },
    { key: "problemaPrincipal", label: "Problema principal da ficha", type: "textarea" },
    { key: "motivoPerda", label: "Motivo da perda (se aplicável)", type: "textarea" },
  ],
};

export function getServiceFields(serviceSlug: string): ServiceField[] {
  return SERVICE_FIELDS[serviceSlug] || [];
}
