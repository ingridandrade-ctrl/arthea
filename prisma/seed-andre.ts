import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const ANDRE_EMAIL = "andre@psi.andreborges.com.br";
const ANDRE_PASSWORD = "arthea2026";
const ENGAGEMENT_SLUG = "estrategia-digital";

const SUMMARY_HTML = `<p><strong>André Andrielli Borges</strong> é psicólogo especialista em relacionamentos, com atendimento presencial em Pirassununga/SP e online para todo o Brasil. CRP 06/215883.</p>
<p>Antes da psicologia, foi militar concursado federal na AFA — controlador de tráfego aéreo, instrutor e coordenador. Saiu de um salário seguro para empreender na área que escolheu com propósito.</p>
<p>Casado com Isa, pai. Trabalha a dinâmica mais ampla do ser humano — não só comportamento, mas existência, presença e comunicação real.</p>
<p><strong>Instagram:</strong> @psi.andreborges · <strong>TikTok:</strong> @psi.andreborges</p>`;

// Dossiê estruturado — base inicial pro André (vamos enriquecer conforme avança)
const DOSSIER_SEED = {
  digitalPresence: {
    instagram: "@psi.andreborges",
    tiktok: "@psi.andreborges",
    website: null,
    gmb: null,
    address: "Pirassununga — SP · atendimento online em todo o Brasil",
    whatsappGroup: null,
    driveFolder: null,
  },
  brandContext: {
    description:
      "Psicólogo especialista em relacionamentos. Atende presencial em Pirassununga/SP e online no Brasil. CRP 06/215883. Antes da psicologia, foi militar concursado federal — controlador de tráfego aéreo, instrutor e coordenador na AFA. Saiu de um salário seguro para empreender em algo escolhido por propósito.",
    values: ["Presença", "Verdade", "Comunicação real", "Propósito"],
    differentiators:
      "Trabalha a dinâmica mais ampla do ser humano — não só comportamento, mas existência, presença e comunicação real. Vivência militar dá disciplina e leitura de hierarquia rara entre psicólogos.",
    productsServices: ["Terapia individual", "Terapia de casal", "Conteúdo sobre relacionamentos"],
  },
  voice: {
    tone:
      "Direto, sem rodeios. Mistura técnica e experiência vivida. Não infantiliza nem dramatiza. Permite humor seco quando cabe. Nada de jargão acadêmico solto.",
    audience:
      "Pessoas e casais entre 28-45 anos, casados ou em relacionamentos longos, vivendo crise de comunicação ou perda de conexão. Classe B/C, conscientes de que precisam de ajuda mas céticos com terapia tradicional.",
  },
  market: {
    competitors: [],
    notes:
      "Casado com Isa, pai. Histórico militar é diferencial narrativo forte mas precisa ser usado com cuidado pra não dominar a comunicação.",
  },
  contacts: [
    { name: "André Borges", role: "Psicólogo · titular", channels: ["whatsapp", "email"] },
    { name: "Isa Borges", role: "Esposa · suporte estratégico", channels: ["whatsapp"] },
  ],
  commercial: {
    monthlyValue: 0,
    engagementType: "Projeto pontual · 60 dias · Construção de presença digital estratégica",
    startDate: "2026-05-11",
    deliveryDate: "2026-07-10",
  },
  archive: {
    meetingTranscripts: [],
    relevantFiles: [],
    adScripts: [],
  },
  brandIdentity: {
    palette: [
      { name: "Verde André", hex: "#1D7070" },
      { name: "Verde Profundo", hex: "#0D4A4A" },
      { name: "Papel", hex: "#FAF9F6" },
    ],
    logos: [],
  },
  performance: {
    cpaTarget: null,
    minRoas: null,
    avgTicket: null,
    conversionRate: null,
    hourlyRate: null,
  },
};

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

  // Engagement: Estratégia Digital
  const existing = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: user.id, slug: ENGAGEMENT_SLUG } },
  });
  let engagementId: string;
  if (existing) {
    engagementId = existing.id;
    console.log(`• Engagement já existe (${existing.name}), reutilizando.`);
  } else {
    const engagement = await prisma.clientEngagement.create({
      data: {
        name: "Construção de Presença Digital Estratégica",
        slug: ENGAGEMENT_SLUG,
        type: "STRATEGY",
        clientId: user.id,
        currentPhase: 1,
        totalPhases: 4,
        description: "60 dias · Presença digital estratégica para psicólogo de relacionamentos",
        accentColor: "#1D7070",
      },
    });
    engagementId = engagement.id;
    console.log(`✓ Engagement criado: ${engagement.name}`);
  }

  // Dossiê — único por cliente, com 9 seções estruturadas + legacy HTML
  await prisma.clientDossier.upsert({
    where: { clientId: user.id },
    create: {
      clientId: user.id,
      digitalPresence: DOSSIER_SEED.digitalPresence,
      brandContext: DOSSIER_SEED.brandContext,
      voice: DOSSIER_SEED.voice,
      market: DOSSIER_SEED.market,
      contacts: DOSSIER_SEED.contacts,
      commercial: DOSSIER_SEED.commercial,
      archive: DOSSIER_SEED.archive,
      brandIdentity: DOSSIER_SEED.brandIdentity,
      performance: DOSSIER_SEED.performance,
      legacySummaryHtml: SUMMARY_HTML,
    },
    update: {
      legacySummaryHtml: SUMMARY_HTML,
    },
  });
  console.log("✓ Dossiê (Sobre o cliente) configurado.");

  // Wipe & re-seed deliverables (only if none exist yet, to avoid clobbering work)
  const existingCount = await prisma.clientDeliverable.count({ where: { engagementId } });
  if (existingCount === 0) {
    for (let i = 0; i < DELIVERABLES.length; i++) {
      const d = DELIVERABLES[i];
      await prisma.clientDeliverable.create({
        data: {
          engagementId,
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
