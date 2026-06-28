// Converte template no formato {{nome}}, {{empresa}} pro formato Meta
// {{1}}, {{2}}, preservando a ordem em que cada variável aparece.

export interface MetaConversion {
  body: string;             // texto com {{1}}, {{2}}, etc
  paramOrder: string[];     // ["nome", "empresa", "linkAnalise"]
  exampleParams: string[];  // ["João da Silva", "Clínica X", "https://gbp.example.com"]
}

const EXAMPLES: Record<string, string> = {
  nome: "Maria Silva",
  empresa: "Clínica Exemplo",
  telefone: "+5511999999999",
  email: "maria@exemplo.com",
  servico: "Google Meu Negócio",
  segmento: "Saúde",
  cidadeEstado: "São Paulo / SP",
  linkAnalise: "https://gbpcheck.com/exemplo",
};

export function convertToMeta(template: string): MetaConversion {
  const paramOrder: string[] = [];
  const body = template.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
    let idx = paramOrder.indexOf(varName);
    if (idx === -1) {
      paramOrder.push(varName);
      idx = paramOrder.length - 1;
    }
    return `{{${idx + 1}}}`;
  });
  const exampleParams = paramOrder.map((v) => EXAMPLES[v] || `[${v}]`);
  return { body, paramOrder, exampleParams };
}

export function resolveMetaParams(
  paramOrder: string[],
  variables: Record<string, string>,
): string[] {
  return paramOrder.map((v) => variables[v] || "");
}
