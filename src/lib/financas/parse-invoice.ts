import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ParsedRow = {
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
};

export async function parseInvoiceText(
  rawText: string,
  cardName: string,
  categories: { id: string; name: string }[]
): Promise<{ parsed: ParsedRow[] | null }> {
  const categoryList = categories.map((c) => `- ${c.id} | ${c.name}`).join("\n");
  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `Você é um assistente especializado em ler faturas de cartão de crédito brasileiras.

Sua tarefa: extrair APENAS as compras desta fatura (período já fechado ou em andamento). NUNCA extraia compras futuras, parcelas a vencer ou projeções de próximas faturas.

PASSO 1 — Identifique a estrutura da fatura
- Localize a seção principal de lançamentos do período (cabeçalhos típicos: "Lançamentos do período", "Compras do mês", "Movimentação", "Transações", "Histórico de compras").
- IGNORE TUDO que vier depois de cabeçalhos como:
  • "Próximos lançamentos"
  • "Próxima fatura"
  • "Parcelas futuras"
  • "Lançamentos futuros"
  • "A vencer" / "À vencer"
  • "Demonstrativo de parcelas"
  • "Projeção"
  • "Saldo a vencer"
  • "Lançamentos em aberto"
  • "Compras parceladas — total" (resumo)
- Se a fatura tem várias páginas, considere TODO o documento mas respeite essas barreiras de seção.

PASSO 2 — Para cada compra do período identificado, extraia:
- date: formato YYYY-MM-DD. Hoje é ${today}. Use o ano implícito da fatura.
- description: nome do estabelecimento, limpo, sem códigos de autorização. Para parcelas que JÁ caem nesta fatura, mantenha "Nome (3/12)" no final.
- amount: valor POSITIVO em BRL como número (sem "R$", use ponto decimal). Ex: 152.30
- categoryId: ID exato (string da esquerda do "|") da categoria mais provável da lista. null se não houver match claro.
- owner: sempre "COUPLE" (a menos que o texto deixe explícito quem usou)

NÃO EXTRAIA:
- Pagamentos recebidos, créditos, estornos (sinais negativos, "PAGAMENTO RECEBIDO", "CREDITO", "ESTORNO")
- Subtotais, totais, saldos, limites
- Encargos: juros, multa, IOF separado, anuidade, tarifa, encargos
- Linhas de cabeçalho ou rodapé

PISTAS DE CATEGORIZAÇÃO (use estas como referência ao escolher categoryId da lista):
- Mercados (Carrefour, Pão de Açúcar, Extra, Atacadão, BIG, Assaí, Sams Club): "Mercado/Supermercado"
- Apps de delivery (iFood, Rappi, UberEats): "Restaurante/Alimentação/Delivery"
- Apps de transporte (Uber, 99, Cabify, Lyft): "Transporte"
- Postos (Shell, Ipiranga, BR, Petrobras, Alesat, Raízen): "Combustível/Transporte"
- Farmácias (Drogasil, Pacheco, Raia, Drogaria, Pague Menos): "Saúde/Farmácia"
- Streaming (Netflix, Spotify, Disney+, Prime Video, HBO, Apple TV, YouTube Premium, Globoplay, Deezer): "Assinaturas/Streaming"
- Software/Apps (Google, Apple, Microsoft, Adobe, OpenAI, ChatGPT, Anthropic, Claude): "Assinaturas/Tecnologia"
- Lojas de roupa (Renner, C&A, Riachuelo, Marisa, Zara): "Roupas/Pessoal"
- Beleza (Sephora, O Boticário, Natura, Beleza na Web): "Beleza/Pessoal"
- Pet (Petz, Cobasi, Petlove): "Pet"
- Educação (Alura, Udemy, Coursera, escola, faculdade): "Educação"
- Casa (Tok&Stok, Etna, Camicado, Leroy Merlin): "Casa"
- E-commerce genérico (Amazon, Mercado Livre, Shopee, AliExpress, Magazine Luiza): use null se não conseguir inferir o tipo do item
- Quando incerto, prefira null em vez de adivinhar

CATEGORIAS DISPONÍVEIS (use o ID exato da esquerda):
${categoryList}

SAÍDA:
Retorne APENAS um array JSON válido, SEM texto antes ou depois, SEM markdown, SEM crase.

Exemplo:
[{"date":"2026-04-15","description":"Carrefour","amount":152.30,"categoryId":"abc123","owner":"COUPLE"},{"date":"2026-04-18","description":"Apple.com (3/12)","amount":83.25,"categoryId":"xyz789","owner":"COUPLE"}]

Se não houver nenhuma compra válida no texto, retorne [].`;

  const userMessage = `Texto da fatura do cartão "${cardName}":

${rawText.slice(0, 80000)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return { parsed: null };

  const arr = parseJsonArray(textBlock.text);
  if (!arr) return { parsed: null };

  const validIds = new Set(categories.map((c) => c.id));
  const cleaned: ParsedRow[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const date = typeof item.date === "string" ? item.date.slice(0, 10) : null;
    const description = typeof item.description === "string" ? item.description.trim() : null;
    const amount = typeof item.amount === "number" ? item.amount : Number(item.amount);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!description) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const categoryId =
      typeof item.categoryId === "string" && validIds.has(item.categoryId)
        ? item.categoryId
        : null;
    const owner =
      item.owner === "PARTNER_A" || item.owner === "PARTNER_B" ? item.owner : "COUPLE";
    cleaned.push({ date, description, amount, categoryId, owner });
  }
  return { parsed: cleaned };
}

function parseJsonArray(raw: string): any[] | null {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const arr = JSON.parse(s.slice(start, end + 1));
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}
