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
      label: "Segmento",
      type: "select",
      options: [
        { value: "dermatologista", label: "Dermatologista" },
        { value: "odonto", label: "Odontologia" },
        { value: "fisio", label: "Fisioterapia" },
        { value: "psicologo", label: "Psicologia" },
        { value: "cirurgiao-plastico", label: "Cirurgião Plástico" },
        { value: "outro", label: "Outro" },
      ],
    },
    { key: "cidade", label: "Cidade", type: "text" },
    { key: "estado", label: "Estado (UF)", type: "text", placeholder: "SP" },
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
      label: "Tem site?",
      type: "select",
      options: [
        { value: "sim", label: "Sim" },
        { value: "nao", label: "Não" },
      ],
    },
    { key: "endereco", label: "Endereço físico", type: "text" },
    {
      key: "origem",
      label: "Origem do lead",
      type: "select",
      options: [
        { value: "prospeccao", label: "Prospecção" },
        { value: "indicacao", label: "Indicação" },
        { value: "forms", label: "Forms site" },
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
