import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 4 * 1024 * 1024;

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

    const form = await req.formData();
    const accountId = form.get("accountId");
    const file = form.get("file");
    const passwordRaw = form.get("password");
    const password =
      typeof passwordRaw === "string" && passwordRaw.length > 0 ? passwordRaw : null;

    if (typeof accountId !== "string" || !accountId) {
      return NextResponse.json({ error: "Cartão é obrigatório" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie o PDF" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "O arquivo precisa ser PDF" }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF muito grande (máx ${(MAX_PDF_BYTES / 1024 / 1024).toFixed(0)}MB)` },
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

Analise o conteúdo da fatura e identifique CADA compra individual.

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

    const arrayBuffer = await file.arrayBuffer();

    let userContent: any[];
    if (password) {
      const text = await extractTextFromPdf(new Uint8Array(arrayBuffer), password);
      if (text === "__needs_password__") {
        return NextResponse.json(
          { error: "Senha incorreta para este PDF.", code: "needs_password" },
          { status: 422 }
        );
      }
      if (!text || text.trim().length < 30) {
        return NextResponse.json(
          { error: "Não consegui extrair texto do PDF. Tente o modo 'Colar texto'." },
          { status: 422 }
        );
      }
      userContent = [
        {
          type: "text",
          text: `Texto extraído da fatura do cartão "${account.name}":\n\n${text}`,
        },
      ];
    } else {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      userContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: `Extraia as compras desta fatura do cartão "${account.name}" e devolva o JSON conforme as regras.`,
        },
      ];
    }

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      });
    } catch (apiErr: any) {
      const msg = String(apiErr?.message || apiErr || "");
      if (msg.toLowerCase().includes("password protected")) {
        return NextResponse.json(
          {
            error:
              "Este PDF é protegido por senha. Informe a senha acima e tente novamente.",
            code: "needs_password",
          },
          { status: 422 }
        );
      }
      throw apiErr;
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "IA não retornou resposta" }, { status: 500 });
    }

    const parsed = parseJsonArray(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Não consegui interpretar a resposta. Tente novamente ou cole o texto." },
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
    console.error("[financas/import/parse-pdf] error", e);
    return NextResponse.json(
      { error: "Erro ao analisar PDF: " + (e?.message || "desconhecido") },
      { status: 500 }
    );
  }
}

async function extractTextFromPdf(
  data: Uint8Array,
  password: string
): Promise<string | "__needs_password__"> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    const loadingTask = pdfjs.getDocument({
      data,
      password,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n\n";
    }
    return fullText;
  } catch (err: any) {
    if (err?.name === "PasswordException") {
      return "__needs_password__";
    }
    throw err;
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
