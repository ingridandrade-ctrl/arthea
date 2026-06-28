import { prisma } from "@/lib/prisma";

/**
 * Monta um bloco de contexto sobre o lead pra anexar no prompt da IA.
 *
 * Sem isso, a Ingrid AI age como se fosse um lead novo a cada conversa:
 * pergunta nome, empresa, finge que vai gerar análise mesmo já tendo
 * gerado, etc. Com esse contexto, ela age como continuidade do fluxo
 * automático que rodou antes (T1/T2A/T2B/T3...).
 *
 * Recebe leadId, retorna string em markdown pra concatenar no system
 * prompt.
 */
export async function buildLeadContext(leadId: string): Promise<string> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      services: {
        include: {
          service: { select: { name: true, slug: true } },
          stage: { select: { name: true, order: true } },
        },
      },
    },
  });
  if (!lead) return "";

  const gmnService = lead.services.find((ls) => ls.service.slug === "google-meu-negocio");
  const customData = (gmnService?.customData || {}) as Record<string, any>;

  // Procura mensagens AI já enviadas (templates do fluxo, IA anterior).
  // Identifica templates pelo conteúdo característico (primeiras palavras).
  const conv = await prisma.conversation.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const sentTemplates: { name: string; when: Date }[] = [];
  if (conv) {
    const aiMessages = await prisma.message.findMany({
      where: { conversationId: conv.id, sender: "AI" },
      orderBy: { createdAt: "asc" },
      select: { content: true, createdAt: true },
      take: 20,
    });
    for (const m of aiMessages) {
      const tplName = identifyTemplate(m.content);
      if (tplName) sentTemplates.push({ name: tplName, when: m.createdAt });
    }
  }

  // Quanto tempo o lead tá no sistema
  const ageMs = Date.now() - lead.createdAt.getTime();
  const ageStr = formatAge(ageMs);

  const lines = [
    "## CONTEXTO DESSE LEAD (use pra personalizar a resposta)",
    "",
    `**Nome:** ${lead.name}`,
    lead.company ? `**Empresa:** ${lead.company}` : null,
    `**Telefone:** ${lead.phone}`,
    lead.email ? `**Email:** ${lead.email}` : null,
    lead.source ? `**Origem:** ${sourceLabel(lead.source)}` : null,
    `**No sistema há:** ${ageStr}`,
  ];

  if (gmnService) {
    lines.push(`**Serviço:** Google Meu Negócio`);
    if (gmnService.stage?.name) lines.push(`**Estágio atual:** ${gmnService.stage.name}`);
    if (customData.linkAnalise) lines.push(`**Link da análise dele:** ${customData.linkAnalise}`);
    if (customData.segmento) lines.push(`**Segmento:** ${customData.segmento}`);
    if (customData.cidadeEstado) lines.push(`**Cidade/UF:** ${customData.cidadeEstado}`);
  }

  if (sentTemplates.length > 0) {
    lines.push("", "**Mensagens já enviadas pelos fluxos automáticos:**");
    for (const t of sentTemplates) {
      lines.push(`- ${t.name} (há ${formatAge(Date.now() - t.when.getTime())})`);
    }
    lines.push("", "⚠️ **NÃO repita o conteúdo dessas mensagens.** A pessoa já recebeu, já leu. Continue de onde elas pararam.");
  }

  lines.push(
    "",
    "## REGRAS APLICÁVEIS AO CONTEXTO",
    "- Já sabe o nome dele/dela — NÃO pergunte de novo",
    "- Já sabe a empresa (se preencheu) — NÃO pergunte",
    "- Se tem **Link da análise**, ele JÁ recebeu a análise — NÃO prometa gerar de novo, responda sobre o que ele viu",
    "- Se origem é FORMS, ele preencheu o formulário do site da Arthea (sabe quem somos)",
    "- Se origem é PROSPECCAO, ele foi contactado por você (talvez não tenha contexto da Arthea ainda)",
  );

  return lines.filter(Boolean).join("\n");
}

function identifyTemplate(content: string): string | null {
  // Heurística simples: identifica templates GMN pelo trecho inicial.
  // Não precisa ser perfeito — só dar contexto à IA sobre o que rolou.
  // Names alinhados ao novo naming (F/P/C) — Jun 2026.
  const c = content.toLowerCase();
  if (c.includes("recebemos seu interesse na análise")) return "F1 — Boas-vindas Formulário";
  if (c.includes("análise da ficha") && c.includes("já está pronta")) return "F2 — Análise Pronta Formulário";
  if (c.includes("estamos fazendo um mapeamento")) return "P1 — Primeiro Contato Prospecção";
  if (c.includes("aqui está a análise da ficha")) return "P2 — Análise Enviada Prospecção";
  if (c.includes("queria confirmar se você viu")) return "P3 — Follow-up Permissão Prospecção";
  if (c.includes("teve a chance de conferir")) return "C1 — Follow-up Análise 1";
  if (c.includes("é a última vez que pergunto")) return "C2 — Follow-up Análise 2";
  if (c.includes("vai sair do ar em breve")) return "C3 — Último Toque";
  if (c.includes("que bom que você conferiu")) return "C4 — Proposta";
  if (c.includes("não esqueci do feedback")) return "C5 — Follow-up Proposta";
  return null;
}

function sourceLabel(s: string): string {
  const m: Record<string, string> = {
    FORMS: "Formulário do site (preencheu pedindo a análise gratuita)",
    PROSPECCAO: "Prospecção fria (Arthea entrou em contato primeiro)",
    INDICACAO: "Indicação (alguém recomendou pra ele)",
    WHATSAPP: "WhatsApp (mandou mensagem direto)",
    WEBSITE: "Site",
  };
  return m[s] || s;
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} dia${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
  return "menos de 1 min";
}
