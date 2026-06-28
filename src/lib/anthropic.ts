import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Haiku 4.5 é rápido + barato — ideal pra chatbot de atendimento.
// Trocar pra Sonnet 4.6 (claude-sonnet-4-6) só se a qualidade da
// resposta começar a cair.
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export async function generateChatResponse(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  model?: string,
  maxTokens?: number
): Promise<string> {
  const response = await client.messages.create({
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens || 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text || "Desculpe, não consegui gerar uma resposta.";
}
