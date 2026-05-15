/**
 * Opções dos campos do formulário pré-consulta da Clínica Brescancin.
 * Tudo em pt-BR, com escrita do briefing preservada (acentos, parênteses).
 */

export const SIM_NAO = ["Sim", "Não"] as const;
export const SIM_NAO_NAOSEI = ["Sim", "Não", "Não sei"] as const;

// Etapa 1
export const GENERO = ["Feminino", "Masculino"] as const;

export const ESTADO_CIVIL = [
  "Solteiro(a)",
  "Casado(a)",
  "União estável",
  "Divorciado(a)",
  "Viúvo(a)",
] as const;

// Etapa 2 — Saúde
export const DOENCAS_DIAGNOSTICADAS = [
  "Hipertensão/Pressão Alta",
  "Diabetes/Glicose Alta",
  "Síndrome Metabólica",
  "Obesidade",
  "Dislipidemia/Colesterol Alto",
  "Hipotireoidismo/Problema de Tireoide",
  "Dermatite Alérgica",
  "Reumatismo",
  "Lúpus",
  "Doença Celíaca ou Inflamatória Intestinal",
  "Câncer de Mama, Ovário ou Próstata",
  "Síndrome do Ovário Policístico (SOP)",
  "Endometriose",
  "Nenhuma das anteriores",
] as const;
// Opção exclusiva — marcá-la desmarca todas; marcar qualquer outra desmarca essa.
export const DOENCAS_EXCLUSIVA = "Nenhuma das anteriores";

export const SAUDE_MAE = [
  "Saudável",
  "Falecida",
  "Hipertensa",
  "Diabética",
  "Obesa",
  "Problema Renal",
  "Problema de Tireoide",
  "Histórico de Câncer de Mama ou Ovário",
] as const;

export const SAUDE_PAI = [
  "Saudável",
  "Falecido",
  "Hipertenso",
  "Diabético",
  "Obeso",
  "Problema Renal",
  "Problema de Tireoide",
  "Histórico de Câncer de Próstata",
] as const;

export const FREQUENCIA_ALCOOL = [
  "Não costumo",
  "1x por semana",
  "2 a 3x por semana",
  "4 a 5x por semana",
  "6 a 7x por semana",
] as const;

// Etapa 3 — Estilo de vida
export const QUALIDADE_SONO = [
  "Menos de 5h",
  "Entre 5h e 6h",
  "Entre 7h e 8h",
  "Mais de 8h",
] as const;

export const NIVEL_ESTRESSE = ["Baixo", "Moderado", "Alto", "Muito alto"] as const;

// Etapa 4 — Cabelo
export const QUEIXA_CAPILAR = [
  "Queda intensa",
  "Fios afinando",
  "Falhas no couro cabeludo",
  "Caspa persistente",
  "Oleosidade excessiva",
  "Coceira ou irritação",
  "Nada no momento",
] as const;
// Opção exclusiva — marcar "Nada no momento" zera as outras.
export const QUEIXA_CAPILAR_EXCLUSIVA = "Nada no momento";

export const TIPO_QUEDA = ["De repente", "Foi gradual", "Não sei dizer"] as const;

export const EVENTOS_ASSOCIADOS = [
  "Parto ou amamentação",
  "Estresse intenso",
  "Mudança hormonal (anticoncepcional, menopausa)",
  "Doença ou cirurgia recente",
  "Emagrecimento rápido",
  "Nenhum dos anteriores",
] as const;
export const EVENTOS_ASSOCIADOS_EXCLUSIVA = "Nenhum dos anteriores";

export const EXAMES_SANGUINEOS_RECENTES = [
  "Sim, tenho os resultados",
  "Fiz mas não lembro",
  "Não fiz",
] as const;

// Etapa 4 — Sobrancelhas
export const QUEIXA_SOBRANCELHA = [
  "Muito falha ou quase sem fios",
  "Falha só no início ou na cauda",
  "Assimétrica",
  "Fios finos e esparsos",
] as const;

// Etapa 5 — Fechamento
export const COMO_CONHECEU = [
  "Instagram",
  "Indicação de alguém",
  "Google",
  "Anúncio",
  "Outro",
] as const;
