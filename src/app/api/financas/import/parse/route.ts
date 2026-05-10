import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";

const MAX_TEXT_LENGTH = 30000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ParsedRow = {
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
};

export async function POST(req: Request) {
  try {
    const household = await requireHousehold();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { accountId, text } = body ?? {};

    if (typeof accountId !== "string" || !accountId) {
      return NextResponse.json({ error: "Cartão é obrigatório" }, { status: 400 });
    }
    if (typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Cole o texto da fatura (pelo menos algumas linhas)" },
        { status: 400 }
      );
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Texto muito longo (máx ${MAX_TEXT_LENGTH} caracteres). Cole por partes.` },
        { status: 400 }
      );
    }

    const account = await prisma.finAccount.findFirst({
      where: { id: accountId, householdId: household.id, type: "CREDIT_CARD" },
    });
    if (!account) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }

    const categories = await prisma.finCategory.findMany({
      where: { householdId: household.id, kind: "EXPENSE", archived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const categoryList = categories
      .map((c) => `- ${c.id} | ${c.name}`)
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `Você é um assistente financeiro que extrai compras de faturas de cartão de crédito brasileiras.

Analise o texto colado pelo usuário e identifique CADA compra individual.

Para cada compra, retorne:
- date: data no formato YYYY-MM-DD (se o ano não estiver explícito, infira pelo contexto; hoje é ${today})
- description: nome do estabelecimento, limpo, sem códigos. Para parcelas, mantenha "Nome (3/12)" se aparecer.
- amount: valor positivo em reais como número (use ponto, não vírgula). Ex: 152.30
- categoryId: o ID exato (string da esquerda do "|") da categoria mais provável da lista abaixo, ou null se nenhuma se encaixar
- owner: sempre "COUPLE" salvo se houver indicação clara de quem usou

CATEGORIAS DISPONÍVEIS (id | nome):
${categoryList}

REGRAS IMPORTANTES:
- IGNORE pagamentos recebidos / créditos / estornos (não são despesas)
- IGNORE linhas de subtotais, IOF separado, juros, anuidade — a menos que sejam linhas normais de gastos
- Se for parcela ("3/12", "PARC 02/06"), inclua a parcela na descrição
- Se ver compras internacionais já convertidas em BRL, use o valor em BRL
- Retorne APENAS um array JSON válido, sem texto antes ou depois, sem markdown
- Se não conseguir identificar nenhuma compra, retorne []`;

    const userMessage = `Texto da fatura (cartão "${account.name}"):

${text}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "IA não retornou resposta" }, { status: 500 });
    }

    const parsed = parseJsonArray(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Não consegui interpretar a resposta. Tente colar novamente ou em partes." },
        { status: 500 }
      );
    }

    const validIds = new Set(categories.map((c) => c.id));
    const cleaned: ParsedRow[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const date = typeof item.date === "string" ? item.date.slice(0, 10) : null;
      const description = typeof item.description === "string" ? item.description.trim() : null;
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount);
      if (!date || !description || !Number.isFinite(amount) || amount <= 0) continue;
      const categoryId =
        typeof item.categoryId === "string" && validIds.has(item.categoryId)
          ? item.categoryId
          : null;
      const owner =
        item.owner === "PARTNER_A" || item.owner === "PARTNER_B" ? item.owner : "COUPLE";
      cleaned.push({ date, description, amount, categoryId, owner });
    }

    return NextResponse.json({
      transactions: cleaned,
      categories,
      account: { id: account.id, name: account.name, color: account.color },
    });
  } catch (e: any) {
    if (e instanceof HouseholdAuthError) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("[financas/import/parse] error", e);
    return NextResponse.json(
      { error: "Erro ao analisar fatura: " + (e?.message || "desconhecido") },
      { status: 500 }
    );
  }
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
