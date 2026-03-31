import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const PIPELINE_STAGES = [
  { name: "Novo Lead", order: 0, color: "#94a3b8" },
  { name: "Em Contato", order: 1, color: "#3b82f6" },
  { name: "Briefing Realizado", order: 2, color: "#8b5cf6" },
  { name: "Proposta Enviada", order: 3, color: "#f59e0b" },
  { name: "Negociação", order: 4, color: "#f97316" },
  { name: "Fechado Ganho", order: 5, color: "#22c55e" },
  { name: "Fechado Perdido", order: 6, color: "#ef4444" },
];

const FOLLOW_UP_TEMPLATES = [
  // Etapa 0 — Novo Lead
  {
    name: "Boas-vindas imediata",
    stageOrder: 0,
    followUpOrder: 1,
    channel: "whatsapp",
    messageTemplate:
      "Oi {{nome}}! Aqui é a equipe da Arthea. Recebemos seu contato sobre {{servico}}. Vou te ajudar a entender como podemos melhorar seus resultados. Pode me contar um pouco mais sobre seu negócio?",
    isAutomatic: true,
  },
  {
    name: "Segundo contato (30min)",
    stageOrder: 0,
    followUpOrder: 2,
    channel: "whatsapp",
    messageTemplate:
      "{{nome}}, vi que você se interessou por {{servico}}. Muitos dos nossos clientes tinham desafios parecidos quando nos procuraram. Qual é o maior desafio do seu negócio hoje?",
    isAutomatic: true,
  },
  {
    name: "Terceiro contato (24h)",
    stageOrder: 0,
    followUpOrder: 3,
    channel: "whatsapp",
    messageTemplate:
      "Oi {{nome}}! Sei que a rotina é corrida. Quando tiver um minutinho, me conta: você já investe em marketing digital hoje ou está começando agora? Isso me ajuda a te indicar o melhor caminho.",
    isAutomatic: true,
  },
  // Etapa 1 — Em Contato
  {
    name: "Lembrete 48h sem resposta",
    stageOrder: 1,
    followUpOrder: 1,
    channel: "internal",
    messageTemplate:
      "Lembrete: {{nome}} não respondeu há 48h. Sugestão: enviar mensagem perguntando se quer agendar uma conversa rápida de 15min.",
    isAutomatic: false,
  },
  {
    name: "Lembrete 5 dias sem resposta",
    stageOrder: 1,
    followUpOrder: 2,
    channel: "internal",
    messageTemplate:
      "Último contato com {{nome}}: enviar mensagem informal. Sugestão: 'Vi que ficou corrido, posso te ligar em 5min pra gente conversar?'",
    isAutomatic: false,
  },
  // Etapa 2 — Briefing Realizado
  {
    name: "Lembrete montar proposta",
    stageOrder: 2,
    followUpOrder: 1,
    channel: "internal",
    messageTemplate:
      "Lembrete: montar proposta para {{nome}} ({{servico}}). Dados do briefing estão nas notas do lead.",
    isAutomatic: false,
  },
  // Etapa 3 — Proposta Enviada
  {
    name: "Follow-up proposta 24h",
    stageOrder: 3,
    followUpOrder: 1,
    channel: "internal",
    messageTemplate:
      "Sugestão de mensagem para {{nome}}: 'Oi {{nome}}! Conseguiu dar uma olhada na proposta? Se tiver qualquer dúvida, estou aqui.'",
    isAutomatic: false,
  },
  {
    name: "Enviar case de sucesso (3 dias)",
    stageOrder: 3,
    followUpOrder: 2,
    channel: "internal",
    messageTemplate:
      "Sugestão: enviar case de sucesso relevante para {{nome}}. Compartilhe um resultado real de {{servico}}.",
    isAutomatic: false,
  },
  {
    name: "Oferecer call (7 dias)",
    stageOrder: 3,
    followUpOrder: 3,
    channel: "internal",
    messageTemplate:
      "Sugestão de mensagem: '{{nome}}, sei que é uma decisão importante. Quer que a gente faça uma call rápida pra eu tirar todas as dúvidas?'",
    isAutomatic: false,
  },
  {
    name: "Última tentativa proposta (14 dias)",
    stageOrder: 3,
    followUpOrder: 4,
    channel: "internal",
    messageTemplate:
      "Última tentativa com {{nome}}. Sugestão: oferecer condição especial com prazo de validade ou mencionar agenda limitada.",
    isAutomatic: false,
  },
  // Etapa 4 — Negociação
  {
    name: "Enviar proposta ajustada (48h)",
    stageOrder: 4,
    followUpOrder: 1,
    channel: "internal",
    messageTemplate:
      "Lembrete: enviar proposta ajustada para {{nome}} conforme negociação.",
    isAutomatic: false,
  },
  {
    name: "Urgência (5 dias)",
    stageOrder: 4,
    followUpOrder: 2,
    channel: "internal",
    messageTemplate:
      "Sugestão de mensagem: '{{nome}}, conseguimos alinhar? Minha agenda para novos projetos está ficando apertada esse mês.'",
    isAutomatic: false,
  },
  // Etapa 6 — Fechado Perdido (Reaquecimento)
  {
    name: "Reaquecimento 30 dias",
    stageOrder: 6,
    followUpOrder: 1,
    channel: "internal",
    messageTemplate:
      "Reaquecimento: {{nome}} não fechou há 30 dias. Sugestão: enviar mensagem sobre novidade relevante para o problema identificado no briefing.",
    isAutomatic: false,
  },
  {
    name: "Reaquecimento 60 dias",
    stageOrder: 6,
    followUpOrder: 2,
    channel: "internal",
    messageTemplate:
      "Reaquecimento: compartilhar case novo de {{servico}} com {{nome}}.",
    isAutomatic: false,
  },
  {
    name: "Reaquecimento 90 dias",
    stageOrder: 6,
    followUpOrder: 3,
    channel: "internal",
    messageTemplate:
      "Último reaquecimento: '{{nome}}, ainda precisa de ajuda com {{servico}}? Temos condições especiais este mês.'",
    isAutomatic: false,
  },
];

// Delay hours for each follow-up template
const TEMPLATE_DELAYS: Record<string, number> = {
  "0-1": 0, // 5 min (round to 0 for scheduling purposes, immediate)
  "0-2": 0, // 30 min
  "0-3": 24,
  "1-1": 48,
  "1-2": 120, // 5 days
  "2-1": 24,
  "3-1": 24,
  "3-2": 72, // 3 days
  "3-3": 168, // 7 days
  "3-4": 336, // 14 days
  "4-1": 48,
  "4-2": 120, // 5 days
  "6-1": 720, // 30 days
  "6-2": 1440, // 60 days
  "6-3": 2160, // 90 days
};

async function main() {
  // Create users
  const hashedPassword = await bcryptjs.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@arthea.com" },
    update: {},
    create: {
      name: "Admin Arthea",
      email: "admin@arthea.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  const manager = await prisma.user.upsert({
    where: { email: "manager@arthea.com" },
    update: {},
    create: {
      name: "Carla Souza",
      email: "manager@arthea.com",
      password: hashedPassword,
      role: "MANAGER",
    },
  });
  console.log("Created manager user:", manager.email);

  const agent = await prisma.user.upsert({
    where: { email: "agent@arthea.com" },
    update: {},
    create: {
      name: "Lucas Pereira",
      email: "agent@arthea.com",
      password: hashedPassword,
      role: "AGENT",
    },
  });
  console.log("Created agent user:", agent.email);

  // Create 4 services (tags)
  const services = [
    {
      name: "Tráfego Pago",
      slug: "trafego-pago",
      description:
        "Gestão de campanhas de mídia paga (Google Ads, Meta Ads, TikTok Ads)",
      icon: "target",
      color: "#ef4444",
    },
    {
      name: "Google Meu Negócio",
      slug: "google-meu-negocio",
      description:
        "Otimização e gestão de perfil no Google Meu Negócio",
      icon: "map-pin",
      color: "#22c55e",
    },
    {
      name: "CRM / Automação",
      slug: "crm-automacao",
      description:
        "Consultoria e implementação de CRM e automações para empresas",
      icon: "users",
      color: "#6366f1",
    },
    {
      name: "Landing Pages",
      slug: "landing-pages",
      description: "Criação de landing pages de alta conversão",
      icon: "layout",
      color: "#f59e0b",
    },
  ];

  const createdServices: Record<string, string> = {};
  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { slug: service.slug },
      update: { name: service.name, description: service.description, icon: service.icon, color: service.color },
      create: service,
    });
    createdServices[service.slug] = created.id;
    console.log(`Created service: ${created.name}`);
  }

  // Create SINGLE pipeline
  let pipeline = await prisma.pipeline.findFirst({
    include: { stages: { orderBy: { order: "asc" } } },
  });

  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        name: "Pipeline Comercial",
        stages: { create: PIPELINE_STAGES },
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    console.log("Created single pipeline:", pipeline.name);
  }

  const stages = pipeline.stages;
  const stageByOrder: Record<number, string> = {};
  for (const stage of stages) {
    stageByOrder[stage.order] = stage.id;
  }

  // Create follow-up templates
  const existingTemplates = await prisma.followUpTemplate.count();
  if (existingTemplates === 0) {
    for (const template of FOLLOW_UP_TEMPLATES) {
      const key = `${template.stageOrder}-${template.followUpOrder}`;
      await prisma.followUpTemplate.create({
        data: {
          ...template,
          messageTemplate: template.messageTemplate,
        },
      });
    }
    console.log(`Created ${FOLLOW_UP_TEMPLATES.length} follow-up templates`);
  }

  // Create sample leads
  const sampleLeads = [
    {
      name: "Maria Silva",
      phone: "+5511999001001",
      email: "maria@empresa.com",
      company: "Silva & Associados",
      source: "WEBSITE" as const,
      status: "QUALIFIED" as const,
      tags: ["premium", "retorno-alto"],
      score: 85,
      notes:
        "Interessada em campanhas de Google Ads para escritório de advocacia.",
      servicesSlugs: ["trafego-pago"],
    },
    {
      name: "João Santos",
      phone: "+5511999002002",
      email: "joao@techstart.com",
      company: "TechStart Ltda",
      source: "WHATSAPP" as const,
      status: "CONTACTED" as const,
      tags: ["startup", "saas"],
      score: 60,
      notes:
        "Startup de tecnologia buscando presença digital e automação.",
      servicesSlugs: ["crm-automacao", "landing-pages"],
    },
    {
      name: "Ana Oliveira",
      phone: "+5511999003003",
      email: "ana@belezaecia.com",
      company: "Beleza & Cia",
      source: "REFERRAL" as const,
      status: "NEW" as const,
      tags: ["varejo", "local"],
      score: 40,
      notes:
        "Rede de salões de beleza com 3 unidades, quer melhorar presença no Google.",
      servicesSlugs: ["google-meu-negocio"],
    },
    {
      name: "Carlos Mendes",
      phone: "+5511999004004",
      email: "carlos@construtora.com",
      company: "Mendes Construções",
      source: "MANUAL" as const,
      status: "QUALIFIED" as const,
      tags: ["construção", "alto-ticket"],
      score: 90,
      notes:
        "Construtora grande, precisa de landing pages para lançamentos imobiliários.",
      servicesSlugs: ["landing-pages", "trafego-pago"],
    },
    {
      name: "Fernanda Lima",
      phone: "+5511999005005",
      email: "fernanda@educaplus.com",
      company: "EducaPlus",
      source: "WEBSITE" as const,
      status: "CONTACTED" as const,
      tags: ["educação", "online"],
      score: 70,
      notes:
        "Plataforma de cursos online querendo automação de marketing.",
      servicesSlugs: ["crm-automacao"],
    },
  ];

  const createdLeads: { id: string; name: string; primaryServiceId: string }[] = [];

  for (const leadData of sampleLeads) {
    const { servicesSlugs, ...data } = leadData;
    const primaryServiceId = createdServices[servicesSlugs[0]];

    const created = await prisma.lead.upsert({
      where: { phone: data.phone },
      update: {},
      create: data,
    });

    // Create LeadService associations
    for (const slug of servicesSlugs) {
      const serviceId = createdServices[slug];
      if (serviceId) {
        await prisma.leadService.upsert({
          where: { leadId_serviceId: { leadId: created.id, serviceId } },
          update: {},
          create: { leadId: created.id, serviceId },
        });
      }
    }

    createdLeads.push({ id: created.id, name: created.name, primaryServiceId });
    console.log(`Created lead: ${created.name}`);
  }

  // Create sample deals (all in single pipeline)
  const sampleDeals = [
    {
      title: "Google Ads - Silva & Associados",
      value: 5000,
      probability: 80,
      expectedCloseDate: new Date("2026-04-15"),
      leadId: createdLeads[0].id,
      serviceId: createdLeads[0].primaryServiceId,
      stageId: stageByOrder[3], // Proposta Enviada
      assignedToId: agent.id,
      diagnosticNotes: {
        problems: [
          {
            id: "1",
            description: "Sem campanhas pagas ativas",
            suggestedService: "Tráfego Pago",
            priority: "high",
            notes: "Concorrentes investindo forte em Google Ads",
          },
        ],
        currentInvestment: "R$ 0 em ads",
        mainGoal: "Captar 20 novos clientes/mês",
        timeline: "Quer começar imediatamente",
      },
    },
    {
      title: "CRM + Landing Page - TechStart",
      value: 8000,
      probability: 50,
      expectedCloseDate: new Date("2026-04-30"),
      leadId: createdLeads[1].id,
      serviceId: createdServices["crm-automacao"],
      stageId: stageByOrder[2], // Briefing Realizado
      assignedToId: agent.id,
    },
    {
      title: "GMN - Beleza & Cia",
      value: 2000,
      probability: 30,
      leadId: createdLeads[2].id,
      serviceId: createdServices["google-meu-negocio"],
      stageId: stageByOrder[1], // Em Contato
      assignedToId: agent.id,
    },
    {
      title: "Landing Pages + Ads - Mendes Construções",
      value: 15000,
      probability: 90,
      expectedCloseDate: new Date("2026-04-10"),
      leadId: createdLeads[3].id,
      serviceId: createdServices["landing-pages"],
      stageId: stageByOrder[4], // Negociação
      assignedToId: manager.id,
      diagnosticNotes: {
        problems: [
          {
            id: "1",
            description: "Site não converte",
            suggestedService: "Landing Pages",
            priority: "high",
            notes: "Taxa de conversão abaixo de 1%",
          },
          {
            id: "2",
            description: "Investimento em ads sem retorno",
            suggestedService: "Tráfego Pago",
            priority: "medium",
            notes: "R$ 5k/mês sem tracking adequado",
          },
        ],
        currentInvestment: "R$ 5.000/mês em Meta Ads",
        mainGoal: "Aumentar vendas em 30%",
        timeline: "Quer começar em 2 semanas",
      },
    },
    {
      title: "Automação - EducaPlus",
      value: 4000,
      probability: 60,
      expectedCloseDate: new Date("2026-05-15"),
      leadId: createdLeads[4].id,
      serviceId: createdServices["crm-automacao"],
      stageId: stageByOrder[0], // Novo Lead
      assignedToId: manager.id,
    },
  ];

  const createdDeals: { id: string; title: string; stageOrder: number }[] = [];

  for (const deal of sampleDeals) {
    const stageOrder = stages.find((s) => s.id === deal.stageId)?.order ?? 0;
    const created = await prisma.deal.create({ data: deal });
    createdDeals.push({ id: created.id, title: created.title, stageOrder });
    console.log(`Created deal: ${created.title}`);
  }

  // Create sample follow-ups for deals
  const followUpTemplates = await prisma.followUpTemplate.findMany({
    where: { isActive: true },
  });

  for (const deal of createdDeals) {
    const templates = followUpTemplates.filter(
      (t) => t.stageOrder === deal.stageOrder
    );
    for (const template of templates) {
      const key = `${template.stageOrder}-${template.followUpOrder}`;
      const delayHours = TEMPLATE_DELAYS[key] || 24;
      const scheduledAt = new Date(
        Date.now() + delayHours * 60 * 60 * 1000
      );
      await prisma.followUp.create({
        data: {
          dealId: deal.id,
          stageId: stageByOrder[template.stageOrder],
          order: template.followUpOrder,
          delayHours,
          messageTemplate: template.messageTemplate,
          channel: template.channel,
          isAutomatic: template.isAutomatic,
          status: "pending",
          scheduledAt,
        },
      });
    }
  }
  console.log("Created sample follow-ups for deals");

  // Create sample activities
  const sampleActivities = [
    {
      type: "deal_created",
      description: "Deal criado: Google Ads - Silva & Associados",
      dealId: createdDeals[0].id,
      leadId: createdLeads[0].id,
      userId: agent.id,
    },
    {
      type: "call",
      description:
        "Ligação realizada para Maria Silva - discutido orçamento de Google Ads",
      leadId: createdLeads[0].id,
      dealId: createdDeals[0].id,
      userId: agent.id,
      metadata: { duration: "15min", outcome: "positive" },
    },
    {
      type: "stage_change",
      description: "Deal movido para Proposta Enviada",
      dealId: createdDeals[0].id,
      leadId: createdLeads[0].id,
      userId: agent.id,
      metadata: { from: "Briefing Realizado", to: "Proposta Enviada" },
    },
    {
      type: "note",
      description:
        "TechStart precisa de CRM integrado + landing page para captura de leads",
      leadId: createdLeads[1].id,
      userId: agent.id,
    },
    {
      type: "deal_created",
      description: "Deal criado: Landing Pages + Ads - Mendes Construções",
      dealId: createdDeals[3].id,
      leadId: createdLeads[3].id,
      userId: manager.id,
    },
    {
      type: "message",
      description: "Mensagem recebida via WhatsApp de Ana Oliveira",
      leadId: createdLeads[2].id,
      metadata: { channel: "whatsapp" },
    },
  ];

  for (const activity of sampleActivities) {
    await prisma.activity.create({ data: activity });
  }
  console.log(`Created ${sampleActivities.length} sample activities`);

  // Create sample tasks
  const now = new Date();
  const sampleTasks = [
    {
      title: "Enviar proposta revisada para Silva & Associados",
      description: "Incluir desconto de 10% para contrato anual",
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      priority: "high",
      leadId: createdLeads[0].id,
      dealId: createdDeals[0].id,
      assignedToId: agent.id,
      createdById: manager.id,
    },
    {
      title: "Agendar reunião com TechStart",
      description: "Apresentar estratégia de CRM + automação",
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      priority: "medium",
      leadId: createdLeads[1].id,
      dealId: createdDeals[1].id,
      assignedToId: agent.id,
      createdById: manager.id,
    },
    {
      title: "Follow-up com Ana Oliveira",
      description: "Retornar sobre proposta de Google Meu Negócio",
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      priority: "urgent",
      leadId: createdLeads[2].id,
      dealId: createdDeals[2].id,
      assignedToId: agent.id,
      createdById: agent.id,
    },
    {
      title: "Criar wireframes das landing pages",
      description: "3 variações para lançamento imobiliário Mendes",
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: "high",
      leadId: createdLeads[3].id,
      dealId: createdDeals[3].id,
      assignedToId: agent.id,
      createdById: manager.id,
    },
    {
      title: "Revisar métricas semanais",
      description: "Compilar relatório de performance de todos os clientes",
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      priority: "low",
      assignedToId: manager.id,
      createdById: admin.id,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.create({ data: task });
  }
  console.log(`Created ${sampleTasks.length} sample tasks`);

  // Create sample notifications
  const sampleNotifications = [
    {
      type: "new_lead",
      title: "Novo lead recebido",
      body: "Fernanda Lima (EducaPlus) entrou via Website",
      userId: manager.id,
      data: { leadId: createdLeads[4].id },
    },
    {
      type: "task_due",
      title: "Tarefa vencendo amanhã",
      body: "Follow-up com Ana Oliveira - Retornar sobre proposta",
      userId: agent.id,
      data: { leadId: createdLeads[2].id },
    },
    {
      type: "deal_won",
      title: "Deal em negociação",
      body: "Landing Pages + Ads - Mendes Construções avançou para Negociação (R$ 15.000)",
      userId: admin.id,
      data: { dealId: createdDeals[3].id },
    },
    {
      type: "followup_due",
      title: "Follow-up pendente",
      body: "3 follow-ups pendentes para hoje",
      userId: agent.id,
    },
  ];

  for (const notification of sampleNotifications) {
    await prisma.notification.create({ data: notification });
  }
  console.log(`Created ${sampleNotifications.length} sample notifications`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
