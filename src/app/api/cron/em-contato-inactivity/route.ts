import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";

/**
 * Verifica leads parados em "Em contato" por mais de 2 dias sem mensagens
 * novas (do lead OU da Arthea) e sem mudança de estágio.
 *
 * Pra cada lead inativo:
 *   - Cria task pra Ingrid: "Avaliar lead — mover para Em negociação ou Perdido"
 *   - Notifica via sininho
 *
 * Dedupe: não cria task/notif duplicada se já existir uma aberta pra esse
 * lead nas últimas 48h.
 *
 * Roda diariamente via GitHub Actions (cron-em-contato-inactivity.yml).
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 dias atrás
  const now = new Date();

  // Pega todos os leadServices em estágio cujo nome contém "em contato"
  const candidates = await prisma.leadService.findMany({
    where: {
      stage: { name: { contains: "em contato", mode: "insensitive" } },
      // Atualizado há mais de 2 dias (proxy pra "tá parado") — a updatedAt
      // do leadService bate quando alguém edita value/customData/stage, mas
      // não bate quando chega mensagem. A última mensagem checamos abaixo.
      updatedAt: { lt: cutoff },
    },
    include: {
      lead: { select: { id: true, name: true, company: true } },
      service: { select: { name: true } },
    },
  });

  let flagged = 0;
  let skipped = 0;

  for (const ls of candidates) {
    // Confirma que não há mensagem (de ninguém) no último 2 dias
    const recentMsg = await prisma.message.findFirst({
      where: {
        conversation: { leadId: ls.lead.id },
        createdAt: { gte: cutoff },
      },
      select: { id: true },
    });
    if (recentMsg) {
      skipped++;
      continue;
    }

    // Dedupe: já notificou esse lead nas últimas 48h?
    const recentNotif = await prisma.notification.findFirst({
      where: {
        type: "em_contato_inactivity",
        createdAt: { gte: cutoff },
        data: { path: ["leadId"], equals: ls.lead.id },
      },
      select: { id: true },
    });
    if (recentNotif) {
      skipped++;
      continue;
    }

    // Cria task
    const taskTitle = `Avaliar lead — mover para Em negociação ou Perdido`;
    const taskDesc = `${ls.lead.name}${ls.lead.company ? ` (${ls.lead.company})` : ""} está em "Em contato" há mais de 2 dias sem evolução. Decida: mover pra Em negociação se conversa esquentou, ou pra Perdido se esfriou.`;
    await prisma.task.create({
      data: {
        title: taskTitle,
        description: taskDesc,
        priority: "medium",
        leadId: ls.lead.id,
        leadServiceId: ls.id,
        dueDate: now,
      },
    });

    // Notifica admin/manager
    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    for (const u of recipients) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: "em_contato_inactivity",
          title: `Lead parado em Em contato há 2 dias: ${ls.lead.name}`,
          body: taskDesc,
          data: { leadId: ls.lead.id, leadServiceId: ls.id },
        },
      });
    }
    flagged++;
  }

  return NextResponse.json({ checked: candidates.length, flagged, skipped });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
