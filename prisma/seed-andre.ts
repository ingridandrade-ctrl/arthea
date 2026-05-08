import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const ANDRE_EMAIL = "andre@psi.andreborges.com.br";
const ANDRE_PASSWORD = "arthea2026";

const SUMMARY_HTML = `<p><strong>André Andrielli Borges</strong> é psicólogo especialista em relacionamentos, com atendimento presencial em Pirassununga/SP e online para todo o Brasil. CRP 06/215883.</p>
<p>Antes da psicologia, foi militar concursado federal na AFA — controlador de tráfego aéreo, instrutor e coordenador. Saiu de um salário seguro para empreender na área que escolheu com propósito.</p>
<p>Casado com Isa, pai. Trabalha a dinâmica mais ampla do ser humano — não só comportamento, mas existência, presença e comunicação real.</p>
<p><strong>Instagram:</strong> @psi.andreborges · <strong>TikTok:</strong> @psi.andreborges</p>`;

type Phase = 1 | 2 | 3 | 4;
type Status = "PENDING" | "IN_PROGRESS" | "WAITING_REVIEW" | "APPROVED" | "REVISION";
type Category = "POSITIONING" | "CONTENT" | "TRACKING" | "DELIVERY";

const DELIVERABLES: { title: string; phase: Phase; category: Category; status: Status; description?: string }[] = [
  // Fase 1 — Imersão e Posicionamento
  { title: "Formulário de imersão", phase: 1, category: "POSITIONING", status: "APPROVED" },
  { title: "Pesquisa comportamental de persona", phase: 1, category: "POSITIONING", status: "APPROVED" },
  { title: "Reunião de kick-off", phase: 1, category: "POSITIONING", status: "APPROVED" },
  { title: "Documento de posicionamento", phase: 1, category: "POSITIONING", status: "WAITING_REVIEW" },
  { title: "Documento de tom de voz", phase: 1, category: "POSITIONING", status: "PENDING" },
  { title: "Comunicação imagética", phase: 1, category: "POSITIONING", status: "PENDING" },

  // Fase 2 — Construção e Conteúdo
  { title: "Arquitetura e wireframe do site", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Copy completa do site", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Construção do site", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Revisão do site (rodada 1)", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Revisão do site (rodada 2)", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Publicação do site", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Otimização do Google Meu Negócio", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Calendário editorial do 1º mês", phase: 2, category: "CONTENT", status: "PENDING" },
  { title: "Assistente de IA configurado", phase: 2, category: "CONTENT", status: "PENDING" },

  // Fase 3 — Rastreamento e Ads
  { title: "Setup de rastreamento completo", phase: 3, category: "TRACKING", status: "PENDING" },
  { title: "Setup Meta Ads", phase: 3, category: "TRACKING", status: "PENDING" },
  { title: "Setup Google Ads", phase: 3, category: "TRACKING", status: "PENDING" },

  // Fase 4 — Entrega Final
  { title: "Validação geral do projeto", phase: 4, category: "DELIVERY", status: "PENDING" },
  { title: "Entrega final e transferência de acessos", phase: 4, category: "DELIVERY", status: "PENDING" },
  { title: "Reunião de encerramento", phase: 4, category: "DELIVERY", status: "PENDING" },
];

async function main() {
  const hash = await bcryptjs.hash(ANDRE_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ANDRE_EMAIL },
    update: { role: "CLIENT", name: "André Borges" },
    create: {
      name: "André Borges",
      email: ANDRE_EMAIL,
      password: hash,
      role: "CLIENT",
    },
  });
  console.log(`✓ Usuário cliente: ${user.email}`);

  const existing = await prisma.clientProject.findUnique({ where: { clientId: user.id } });
  let projectId: string;
  if (existing) {
    projectId = existing.id;
    console.log(`• Projeto já existe (${existing.name}), reutilizando.`);
  } else {
    const project = await prisma.clientProject.create({
      data: {
        name: "Construção de Presença Digital Estratégica",
        clientId: user.id,
        currentPhase: 1,
        description: "60 dias · Presença digital estratégica para psicólogo de relacionamentos",
        accentColor: "#1D7070",
      },
    });
    projectId = project.id;
    console.log(`✓ Projeto criado: ${project.name}`);
  }

  await prisma.clientSummary.upsert({
    where: { projectId },
    create: { projectId, content: SUMMARY_HTML },
    update: { content: SUMMARY_HTML },
  });
  console.log("✓ Resumo (Sobre você) configurado.");

  // Wipe & re-seed deliverables (only if none exist yet, to avoid clobbering work)
  const existingCount = await prisma.clientDeliverable.count({ where: { projectId } });
  if (existingCount === 0) {
    for (let i = 0; i < DELIVERABLES.length; i++) {
      const d = DELIVERABLES[i];
      await prisma.clientDeliverable.create({
        data: {
          projectId,
          title: d.title,
          description: d.description || null,
          category: d.category,
          phase: d.phase,
          order: i,
          status: d.status,
        },
      });
    }
    console.log(`✓ ${DELIVERABLES.length} entregáveis criados.`);
  } else {
    console.log(`• ${existingCount} entregáveis já existem. Pulando criação para preservar o trabalho.`);
  }

  console.log("\n— Seed concluído —");
  console.log(`Login do cliente: ${ANDRE_EMAIL} / ${ANDRE_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
