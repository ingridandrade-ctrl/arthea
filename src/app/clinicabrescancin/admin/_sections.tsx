import React from "react";

export type FieldType =
  | "text"
  | "list"
  | "bool"
  | "date"
  | "longtext"
  | "photo"
  | "photos";

export type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  followups?: FieldDef[];
};
export type Section = { title: string; fields: FieldDef[] };

export type ResponseRow = {
  id: string;
  createdAt: string;
  nomeCompleto: string;
  apelido: string | null;
  dataNascimento: string;
  genero: string;
  estadoCivil: string | null;
  profissao: string;
  temFilhos: boolean | null;
  pretendeFilhos: boolean | null;
  cidade: string;
  telefone: string;
  email: string;
  instagram: string | null;
  answers: Record<string, unknown>;
};

export const SECTIONS: Section[] = [
  {
    title: "Identificação",
    fields: [
      { key: "nomeCompleto", label: "Nome completo" },
      { key: "apelido", label: "Apelido" },
      { key: "dataNascimento", label: "Data de nascimento", type: "date" },
      { key: "genero", label: "Gênero" },
      { key: "estadoCivil", label: "Estado civil" },
      { key: "profissao", label: "Profissão" },
      {
        key: "temFilhos",
        label: "Tem filhos",
        type: "bool",
        followups: [
          {
            key: "pretendeFilhos",
            label: "Pretende ter filhos no próximo ano",
            type: "bool",
          },
        ],
      },
      { key: "cidade", label: "Cidade" },
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "instagram", label: "Instagram" },
    ],
  },
  {
    title: "Saúde geral",
    fields: [
      {
        key: "doencasDiagnosticadas",
        label: "Doenças diagnosticadas",
        type: "list",
      },
      { key: "saudeMae", label: "Saúde da mãe", type: "list" },
      { key: "saudePai", label: "Saúde do pai", type: "list" },
      {
        key: "usaMedicamentos",
        label: "Usa medicamento contínuo",
        followups: [
          {
            key: "quaisMedicamentos",
            label: "Qual(is) medicamento(s)",
            type: "longtext",
          },
        ],
      },
      {
        key: "usaSuplementos",
        label: "Usa suplementos",
        followups: [
          {
            key: "quaisSuplementos",
            label: "Qual(is) suplemento(s)",
            type: "longtext",
          },
        ],
      },
      { key: "usaEsteroides", label: "Usa esteroides anabolizantes" },
      { key: "usaTestosterona", label: "Usa testosterona" },
      {
        key: "usaMedSonoAnsiedade",
        label: "Usa medicamento para sono/ansiedade",
        followups: [
          {
            key: "quaisMedSonoAnsiedade",
            label: "Qual(is) sono/ansiedade",
            type: "longtext",
          },
        ],
      },
      {
        key: "alergiaMedicamento",
        label: "Alergia a medicamento",
        followups: [{ key: "qualAlergia", label: "Qual alergia" }],
      },
      { key: "alergiaAmbiental", label: "Alergia ambiental" },
      {
        key: "fezCirurgia",
        label: "Já fez cirurgia",
        followups: [
          { key: "qualCirurgia", label: "Qual cirurgia", type: "longtext" },
        ],
      },
      { key: "hospitalizadoUltimoAno", label: "Hospitalizado no último ano" },
      {
        key: "teveCovidDengue",
        label: "Teve Covid ou Dengue",
        followups: [{ key: "qualCovidDengue", label: "Qual e quando" }],
      },
      { key: "fuma", label: "Fuma" },
      { key: "frequenciaAlcool", label: "Frequência de álcool" },
    ],
  },
  {
    title: "Estilo de vida",
    fields: [
      {
        key: "atividadeFisica",
        label: "Pratica atividade física",
        followups: [
          {
            key: "qualAtividadeFisica",
            label: "Qual e frequência",
            type: "longtext",
          },
        ],
      },
      { key: "qualidadeSono", label: "Qualidade do sono" },
      { key: "nivelEstresse", label: "Nível de estresse" },
      {
        key: "dieta",
        label: "Dieta",
        followups: [{ key: "dietaOutra", label: "Qual dieta (outra)" }],
      },
      { key: "tomaLeite", label: "Toma leite todos os dias", type: "bool" },
      {
        key: "comeCastanhasAmendoas",
        label: "Come castanhas/amêndoas",
        type: "bool",
      },
    ],
  },
  {
    title: "Cabelo",
    fields: [
      { key: "queixaCapilar", label: "Queixa capilar", type: "list" },
      { key: "tempoQueixa", label: "Tempo da queixa" },
      { key: "tipoQueda", label: "Tipo de queda" },
      { key: "eventosAssociados", label: "Eventos associados", type: "list" },
      {
        key: "historicoFamiliarQueda",
        label: "Histórico familiar",
        followups: [{ key: "quemHistorico", label: "Por parte de quem" }],
      },
      {
        key: "fezTratamentoCapilar",
        label: "Já fez tratamento para o cabelo",
        type: "bool",
        followups: [
          {
            key: "tratamentosAnteriores",
            label: "Qual(is) tratamento(s)",
            type: "longtext",
          },
        ],
      },
      {
        key: "usouMinoxidilFinasterida",
        label: "Usou Minoxidil/Finasterida",
        followups: [
          {
            key: "quaisTempoUso",
            label: "Qual(is) e tempo de uso",
            type: "longtext",
          },
        ],
      },
      { key: "examesSanguineRecentes", label: "Exames de sangue recentes" },
      { key: "fotosCabelo", label: "Fotos do cabelo", type: "photos" },
    ],
  },
  {
    title: "Sobrancelhas",
    fields: [
      {
        key: "temQueixaSobrancelha",
        label: "Tem queixa em sobrancelha",
        followups: [
          { key: "queixaSobrancelha", label: "Queixa específica", type: "list" },
          {
            key: "procedimentoSobrancelhaAnterior",
            label: "Procedimento anterior",
            followups: [
              {
                key: "qualProcedimento",
                label: "Qual e quando",
                type: "longtext",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Fechamento",
    fields: [
      {
        key: "principalIncomodo",
        label: "Principal incômodo",
        type: "longtext",
      },
      {
        key: "duvidaConsulta",
        label: "Dúvida para a consulta",
        type: "longtext",
      },
      { key: "comoConheceu", label: "Como conheceu", type: "list" },
    ],
  },
];

export function getRawValue(row: ResponseRow, key: string): unknown {
  if (key in row) {
    return (row as unknown as Record<string, unknown>)[key];
  }
  return row.answers[key];
}

export function formatValue(value: unknown, type?: FieldType): string {
  if (value === null || value === undefined) return "Não informado";
  if (type === "list") {
    if (!Array.isArray(value) || value.length === 0) return "Não informado";
    return value.join(", ");
  }
  if (type === "bool") {
    if (value === true) return "Sim";
    if (value === false) return "Não";
    return "Não informado";
  }
  if (type === "date") {
    if (typeof value !== "string" || !value) return "Não informado";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Não informado";
    return d.toLocaleDateString("pt-BR");
  }
  if (typeof value === "string") {
    return value.trim() === "" ? "Não informado" : value;
  }
  return String(value);
}

export function renderValue(
  value: unknown,
  type?: FieldType,
): React.ReactNode {
  if (type === "photo") {
    if (typeof value !== "string" || !value.trim()) return "Não informado";
    return (
      <a href={value} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Foto" className="brescancin-patient-photo" />
      </a>
    );
  }
  if (type === "photos") {
    if (!Array.isArray(value) || value.length === 0) return "Não informado";
    return (
      <div className="brescancin-patient-photo-grid">
        {value
          .filter((u): u is string => typeof u === "string" && !!u.trim())
          .map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Foto" className="brescancin-patient-photo" />
            </a>
          ))}
      </div>
    );
  }
  return formatValue(value, type);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatConsultaDate(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "—";
  // input type=date devolve YYYY-MM-DD (sem timezone)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function getDataConsulta(row: ResponseRow): string | null {
  const v = row.answers.dataConsulta;
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export function computeAge(dataNascimentoIso: string): number | null {
  const d = new Date(dataNascimentoIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
