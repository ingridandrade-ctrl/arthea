import { prisma } from "@/lib/prisma";
import { runButtonActions } from "./button-handler-actions";

/**
 * Quando o webhook recebe um clique de botão (interactive.button_reply),
 * acha qual template tem esse buttonId e executa as ações configuradas.
 *
 * As actions suportadas estão em lib/flows/button-handler-actions.ts —
 * essa lib é compartilhada com o nó `button_clicked` do builder de fluxos.
 */
export async function handleButtonClick(opts: {
  leadId: string;
  buttonId: string;
}) {
  // Acha qual template tem esse buttonId
  const templates = await prisma.followUpTemplate.findMany({
    where: { buttons: { not: null as any } },
    select: { id: true, name: true, buttons: true },
  });

  let matched: { templateId: string; button: any } | null = null;
  for (const t of templates) {
    const buttons = (t.buttons as any[]) || [];
    const b = buttons.find((x: any) => x.id === opts.buttonId);
    if (b) {
      matched = { templateId: t.id, button: b };
      break;
    }
  }

  if (!matched) return { handled: false, reason: "button_not_found" };

  const actions = (matched.button.actions || []) as any[];
  const executed = await runButtonActions(opts.leadId, actions);

  return { handled: true, button: matched.button.label, executed };
}
