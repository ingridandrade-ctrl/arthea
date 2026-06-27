import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateChatResponse(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  model?: string,
  maxTokens?: number
): Promise<string> {
  const response = await client.messages.create({
    model: model || "claude-sonnet-4-20250514",
    max_tokens: maxTokens || 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text || "Desculpe, não consegui gerar uma resposta.";
}
