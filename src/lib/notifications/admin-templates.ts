/**
 * Templates de notificação interna (admin/manager).
 * Diferente dos GMN_TEMPLATES, esses NÃO são parte do fluxo do cliente:
 * são mensagens que o sistema manda PRA equipe quando um evento acontece
 * (lead novo, falha de fluxo, etc).
 *
 * Vivem em FollowUpTemplate (mesmo modelo dos templates de cliente),
 * mas com:
 *   - serviceId: null (não pertence a nenhum serviço)
 *   - isAutomatic: false (engine não dispara)
 *   - code: prefixo ADMIN_*
 *
 * Pra mandar fora da janela de 24h, precisa submeter pra Meta (botão
 * "Submeter pra Meta" na página de Templates) e esperar APPROVED.
 */

export interface AdminTemplate {
  code: string;
  name: string;
  channel: "whatsapp";
  messageTemplate: string;
  metaName: string;
  metaCategory: "UTILITY" | "MARKETING";
}

export const ADMIN_TEMPLATES: AdminTemplate[] = [
  {
    code: "ADMIN_NOVO_LEAD_FORMS",
    name: "Admin · Novo lead Forms",
    channel: "whatsapp",
    metaName: "admin_novo_lead_forms",
    metaCategory: "UTILITY",
    messageTemplate:
`🆕 Novo lead Forms

*{{nome}}* — {{empresa}}
Serviço: {{servico}}
Tel: {{telefone}}`,
  },
];
