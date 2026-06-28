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
    name: "T1 — Boas-vindas (Forms site)",
    stageOrder: 0,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "FORMS" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem?
Aqui é a Ingrid, da Arthea. Recebemos sua solicitação de análise da ficha do {{empresa}} no Google.
Nossa equipe já está preparando seu relatório e em breve te envio por aqui, combinado?
Obrigada! 😊`,
  },
  {
    code: "GMN_T2A",
    name: "T2A — Envia análise (Forms site)",
    stageOrder: 1,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "FORMS" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem?
A análise da ficha do {{empresa}} no Google que você solicitou já está pronta.
Acesse pelo link: {{linkAnalise}}
No relatório você vai encontrar os pontos analisados pela nossa equipe e as observações de cada um. Qualquer dúvida, é só me responder por aqui!
Obrigada! 😊`,
  },
  {
    code: "GMN_T2B",
    name: "T2B — Primeiro contato (Prospecção)",
    stageOrder: 0,
    followUpOrder: 1,
    channel: "whatsapp",
    isAutomatic: true,
    delayHoursOverride: 0,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Oii, {{nome}}! Tudo bem?
Me chamo Ingrid, sou estrategista digital da Arthea, agência especializada em posicionamento de negócios no Google Meu Negócio (aquela ficha que aparece no Maps quando alguém procura um serviço perto).
Estou em contato porque mapeamos {{segmento}} em {{cidadeEstado}} e o {{empresa}} chamou nossa atenção.
Para empresas selecionadas, preparamos uma análise gratuita da ficha mostrando o que pode estar travando sua visibilidade no Google e como melhorar isso.
Posso te enviar a análise do {{empresa}}? É só responder nos botões abaixo. 😊`,
  },
  {
    code: "GMN_T3",
    name: 'T3 — Envia análise após "sim" (Prospecção)',
    stageOrder: 1,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 0,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Perfeito, {{nome}}! 😊
Conforme combinado, segue a análise da ficha do {{empresa}} no Google:
{{linkAnalise}}
No relatório você confere como está sua presença hoje e os pontos analisados pela nossa equipe. Qualquer dúvida, é só me chamar por aqui!`,
  },
  {
    code: "GMN_T4",
    name: "T4 — Follow-up sem resposta ao T2B (Prospecção)",
    stageOrder: 0,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: { source: "PROSPECCAO" },
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Imagino a correria do dia a dia, então passei só pra confirmar se chegou minha mensagem anterior.
Ainda consigo encaixar a análise gratuita da ficha do {{empresa}} no Google com a minha equipe essa semana. Posso preparar pra você? 😊`,
  },
  {
    code: "GMN_T5",
    name: "T5 — Follow-up 1 da análise (Ambos)",
    stageOrder: 2,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Passando rapidinho pra saber se você conseguiu abrir a análise da ficha do {{empresa}} que te enviei.
O que achou do relatório? 😊`,
  },
  {
    code: "GMN_T6",
    name: "T6 — Follow-up 2 da análise (Ambos)",
    stageOrder: 2,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 120,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Sei que sua rotina é corrida, então prometo não insistir. 😄
Só queria confirmar se você conseguiu dar uma olhada na análise do {{empresa}}. Se preferir, me diz o melhor horário que eu te chamo!`,
  },
  {
    code: "GMN_T7",
    name: "T7 — Último toque da análise (Ambos)",
    stageOrder: 2,
    followUpOrder: 3,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 192,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Aviso importante: o link da análise da ficha do {{empresa}} será desativado em breve, pois nossa equipe renova os relatórios periodicamente.
Caso ainda queira conferir, recomendo acessar antes da renovação: {{linkAnalise}}
Qualquer dúvida, é só me responder! 😊`,
  },
  {
    code: "GMN_T8",
    name: "T8 — Apresenta proposta após feedback (Ambos)",
    stageOrder: 3,
    followUpOrder: 1,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 0,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Que bom que você conferiu, {{nome}}! 😊
Com base nos pontos da análise, conseguimos montar um plano sob medida pra destravar a visibilidade do {{empresa}} no Google e atrair mais clientes da sua região.
Que tal a gente conversar pra eu te apresentar a proposta? Posso te explicar tudo por aqui mesmo ou marcamos uma call rápida, como preferir.`,
  },
  {
    code: "GMN_T9",
    name: "T9 — Follow-up da proposta (Ambos)",
    stageOrder: 3,
    followUpOrder: 2,
    channel: "internal",
    isAutomatic: false,
    delayHoursOverride: 60,
    condition: null,
    messageTemplate:
`Sugestão de mensagem pra {{nome}}:

Oii, {{nome}}! Tudo bem?
Não esqueci do seu feedback sobre a análise, viu? 😄
Fiquei pensando aqui e o melhor próximo passo é a gente começar a trabalhar a ficha do {{empresa}} no Google Meu Negócio com a nossa equipe.
Posso te enviar a proposta com valores e o que está incluso? 😊`,
  },
];
