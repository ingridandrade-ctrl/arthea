// Templates de follow-up exclusivos do serviço Google Meu Negócio.
// Stage order (pipeline GMN):
//   0 = Novo lead, 1 = Análise gerada, 2 = Em contato,
//   3 = Em negociação, 4 = Ganho, 5 = Perdido
//
// condition: { origem: "forms" | "prospeccao" } filtra por LeadService.customData.origem
// delayHoursOverride: horas após entrar no estágio. Null = imediato.
// channel: "whatsapp" = enviado automaticamente; "internal" = lembrete pra equipe

export interface GmnTemplate {
  code: string;
  name: string;
  stageOrder: number;
  followUpOrder: number;
  channel: "whatsapp" | "internal";
  isAutomatic: boolean;
  delayHoursOverride: number | null;
  condition: { source?: "FORMS" | "PROSPECCAO" | "INDICACAO" } | null;
  messageTemplate: string;
}

export const GMN_TEMPLATES: GmnTemplate[] = [
  {
    code: "GMN_T1",
    name: "F1 — Boas-vindas Formulário",
    stageOrder: 0,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "FORMS" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem?
Aqui é a Ingrid, estrategista da Arthea!
Recebemos seu interesse na análise da ficha do {{empresa}} no Google e ficamos muito felizes em saber que você quer melhorar seus resultados por lá.
Vamos começar a análise e em breve te mando tudo por aqui, combinado?
Obrigada! 😊`,
  },
  {
    code: "GMN_T2A",
    name: "F2 — Análise Pronta Formulário",
    stageOrder: 1,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "FORMS" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem por aí?
Ótimas notícias! A análise da ficha do {{empresa}} no Google já está pronta.
Nossa equipe olhou tudo com atenção e encontramos alguns pontos que podem estar impedindo que mais pessoas cheguem até o seu negócio através do Google. E lá você também vai ver como podemos te ajudar a resolver cada um deles.
Você pode acessar por esse link: {{linkAnalise}}
Esperamos que goste bastante e aguardamos seu feedback! 😊`,
  },
  {
    code: "GMN_T2B",
    name: "P1 — Primeiro Contato Prospecção",
    stageOrder: 0,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem?
Me chamo Ingrid, sou estrategista digital da Arthea. A Arthea é uma agência de marketing especializada em posicionamento para negócios através do Google Meu Negócio.
Estou entrando em contato porque estamos fazendo um mapeamento de {{segmento}} em {{cidadeEstado}} e o {{empresa}} apareceu na nossa pesquisa e nos chamou atenção.
Pra começar, não sei se você já conhece, imagino que sim, mas o Google Meu Negócio é aquela ficha que aparece quando pesquisamos algo no Maps ou no Google. Seja o nome de um negócio, seja um serviço que a gente quer contratar, seja até o próprio segmento. É uma busca local e é uma ferramenta que tem uma importância enorme na hora em que clientes procuram por empresas como a sua.
Aqui na Arthea oferecemos uma análise dessa ficha para empresas que chamam a nossa atenção, porque o nosso objetivo é conscientizar o máximo de empresários sobre a importância dessa ferramenta e o potencial de captação de clientes que ela tem.
Essa análise mostra exatamente como está a sua presença hoje e como podemos te ajudar a melhorar.
A análise da ficha é gratuita — você gostaria que eu mandasse a análise do {{empresa}}? 😊`,
  },
  {
    code: "GMN_P2",
    name: "P2 — Confirmação de Análise",
    stageOrder: 0,
    followUpOrder: 2,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Que ótimo, {{nome}}! 😊

Nossa equipe já vai começar a preparar a análise da sua ficha e em até 24 horas úteis a gente te manda tudo por aqui.

Obrigada! Até logo!`,
  },
  {
    code: "GMN_T3",
    name: "P3 — Análise Enviada Prospecção",
    stageOrder: 1,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 0,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Que ótimo, {{nome}}! 😊
Aqui está a análise da ficha do {{empresa}}:
{{linkAnalise}}
Ela mostra exatamente como está sua presença hoje no Google e o que podemos fazer juntos para melhorar. Qualquer dúvida, pode falar comigo por aqui!`,
  },
  {
    code: "GMN_T4",
    name: "P4 — Follow-up Permissão Prospecção",
    stageOrder: 0,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Sei como pode ser corrida a vida de quem tem empresa, mas queria confirmar se você viu minha mensagem anterior.
Ainda consigo encaixar com a minha equipe para fazer a análise do {{empresa}} essa semana. Você tem interesse em receber? 😊`,
  },
  {
    code: "GMN_T5",
    name: "C1 — Follow-up Análise 1",
    stageOrder: 2,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Queria saber se você teve a chance de conferir a análise da ficha do {{empresa}} que te mandei.
O que achou? 😊`,
  },
  {
    code: "GMN_T6",
    name: "C2 — Follow-up Análise 2",
    stageOrder: 2,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 120,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Prometo que é a última vez que pergunto sobre a análise do {{empresa}} por enquanto. 😄 Conseguiu dar uma olhada?`,
  },
  {
    code: "GMN_T7",
    name: "C3 — Último Toque",
    stageOrder: 2,
    followUpOrder: 3,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 192,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Passando para avisar que o link com a análise da ficha do {{empresa}} vai sair do ar em breve. Nossa equipe renova os relatórios periodicamente e esse será substituído.
Se tiver interesse em conferir antes, é só me falar! 😊`,
  },
  {
    code: "GMN_T8",
    name: "C4 — Proposta",
    stageOrder: 3,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 0,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}} (após reagir ao feedback dele/dela manualmente):

Que bom que você conferiu, {{nome}}!
[Reação ao feedback — manual]
E aí, o que acha de a gente começar a melhorar a visibilidade do {{empresa}} no Google? 😊`,
  },
  {
    code: "GMN_T9",
    name: "C5 — Follow-up Proposta",
    stageOrder: 3,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Olha, eu não esqueci do feedback que você deu em relação à nossa análise não, viu? 😄
O que você acha da gente começar a trabalhar a ficha do {{empresa}} no Google Meu Negócio? 😊`,
  },
];
