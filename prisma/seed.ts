import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const PIPELINE_STAGES = [
  { name: "Novo Lead", order: 0, color: "#94a3b8" },
  { name: "Em Contato", order: 1, color: "#3b82f6" },
  { name: "Qualificado", order: 2, color: "#8b5cf6" },
  { name: "Proposta Enviada", order: 3, color: "#f59e0b" },
  { name: "Negociação", order: 4, color: "#f97316" },
  { name: "Fechado Ganho", order: 5, color: "#22c55e" },
  { name: "Fechado Perdido", order: 6, color: "#ef4444" },
];

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

  // Create services
  const services = [
    {
      name: "Tráfego Pago",
      slug: "trafego-pago",
      description: "Gestão de campanhas de mídia paga (Google Ads, Meta Ads, TikTok Ads)",
      icon: "target",
      color: "#ef4444",
    },
    {
      name: "Google Meu Negócio",
      slug: "google-meu-negocio",
      description: "Otimização e gestão de perfil no Google Meu Negócio",
      icon: "map-pin",
      color: "#22c55e",
    },
    {
      name: "CRM",
      slug: "crm",
      description: "Consultoria e implementação de CRM para empresas",
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
    {
      name: "Social Media",
      slug: "social-media",
      description: "Gestão completa de redes sociais (Instagram, Facebook, TikTok, LinkedIn)",
      icon: "share-2",
      color: "#ec4899",
    },
    {
      name: "SEO",
      slug: "seo",
      description: "Otimização para motores de busca e estratégias de conteúdo orgânico",
      icon: "search",
      color: "#14b8a6",
    },
    {
      name: "Email Marketing",
      slug: "email-marketing",
      description: "Campanhas de email marketing, automação e nutrição de leads",
      icon: "mail",
      color: "#8b5cf6",
    },
    {
      name: "Branding & Design",
      slug: "branding-design",
      description: "Identidade visual, branding e design gráfico para empresas",
      icon: "palette",
      color: "#f97316",
    },
  ];

  // Store created services and their pipeline stages for sample data
  const createdServices: Record<string, { id: string; stages: { id: string; name: string; order: number }[] }> = {};

  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });

    // Check if pipeline already exists for this service
    const existingPipeline = await prisma.pipeline.findFirst({
      where: { serviceId: created.id },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    let stages: { id: string; name: string; order: number }[];

    if (existingPipeline) {
      stages = existingPipeline.stages;
    } else {
      const pipeline = await prisma.pipeline.create({
        data: {
          name: `Pipeline ${service.name}`,
          serviceId: created.id,
          stages: {
            create: PIPELINE_STAGES,
          },
        },
        include: { stages: { orderBy: { order: "asc" } } },
      });
      stages = pipeline.stages;
      console.log(`Created pipeline for ${service.name}:`, pipeline.name);
    }

    createdServices[service.slug] = { id: created.id, stages };
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
      serviceId: createdServices["trafego-pago"].id,
      notes: "Interessada em campanhas de Google Ads para escritório de advocacia.",
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
      serviceId: createdServices["social-media"].id,
      notes: "Startup de tecnologia buscando presença nas redes sociais.",
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
      serviceId: createdServices["google-meu-negocio"].id,
      notes: "Rede de salões de beleza com 3 unidades, quer melhorar presença no Google.",
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
      serviceId: createdServices["landing-pages"].id,
      notes: "Construtora grande, precisa de landing pages para lançamentos imobiliários.",
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
      serviceId: createdServices["email-marketing"].id,
      notes: "Plataforma de cursos online querendo nutrição de leads via email.",
    },
    {
      name: "Ricardo Almeida",
      phone: "+5511999006006",
      email: "ricardo@organicfood.com",
      company: "Organic Food Brasil",
      source: "WHATSAPP" as const,
      status: "NEW" as const,
      tags: ["alimentos", "ecommerce"],
      score: 50,
      serviceId: createdServices["seo"].id,
      notes: "E-commerce de alimentos orgânicos buscando melhorar posicionamento no Google.",
    },
  ];

  const createdLeads: { id: string; name: string; serviceSlug: string }[] = [];

  for (const lead of sampleLeads) {
    const serviceSlug = services.find((s) => s.slug && createdServices[s.slug]?.id === lead.serviceId)?.slug || "";
    const created = await prisma.lead.upsert({
      where: { phone: lead.phone },
      update: {},
      create: lead,
    });
    createdLeads.push({ id: created.id, name: created.name, serviceSlug });
    console.log(`Created lead: ${created.name}`);
  }

  // Create sample deals
  const sampleDeals = [
    {
      title: "Google Ads - Silva & Associados",
      value: 5000,
      probability: 80,
      expectedCloseDate: new Date("2026-04-15"),
      leadId: createdLeads[0].id,
      serviceId: createdServices["trafego-pago"].id,
      stageId: createdServices["trafego-pago"].stages[3].id, // Proposta Enviada
      assignedToId: agent.id,
    },
    {
      title: "Social Media - TechStart",
      value: 3000,
      probability: 50,
      expectedCloseDate: new Date("2026-04-30"),
      leadId: createdLeads[1].id,
      serviceId: createdServices["social-media"].id,
      stageId: createdServices["social-media"].stages[2].id, // Qualificado
      assignedToId: agent.id,
    },
    {
      title: "GMN - Beleza & Cia",
      value: 2000,
      probability: 30,
      leadId: createdLeads[2].id,
      serviceId: createdServices["google-meu-negocio"].id,
      stageId: createdServices["google-meu-negocio"].stages[1].id, // Em Contato
      assignedToId: agent.id,
    },
    {
      title: "Landing Pages - Mendes Construções",
      value: 15000,
      probability: 90,
      expectedCloseDate: new Date("2026-04-10"),
      leadId: createdLeads[3].id,
      serviceId: createdServices["landing-pages"].id,
      stageId: createdServices["landing-pages"].stages[4].id, // Negociação
      assignedToId: manager.id,
    },
    {
      title: "Email Marketing - EducaPlus",
      value: 4000,
      probability: 60,
      expectedCloseDate: new Date("2026-05-15"),
      leadId: createdLeads[4].id,
      serviceId: createdServices["email-marketing"].id,
      stageId: createdServices["email-marketing"].stages[2].id, // Qualificado
      assignedToId: agent.id,
    },
    {
      title: "SEO - Organic Food Brasil",
      value: 3500,
      probability: 40,
      leadId: createdLeads[5].id,
      serviceId: createdServices["seo"].id,
      stageId: createdServices["seo"].stages[0].id, // Novo Lead
      assignedToId: manager.id,
    },
  ];

  const createdDeals: { id: string; title: string }[] = [];

  for (const deal of sampleDeals) {
    const created = await prisma.deal.create({
      data: deal,
    });
    createdDeals.push({ id: created.id, title: created.title });
    console.log(`Created deal: ${created.title}`);
  }

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
      description: "Ligação realizada para Maria Silva - discutido orçamento de Google Ads",
      leadId: createdLeads[0].id,
      dealId: createdDeals[0].id,
      userId: agent.id,
      metadata: { duration: "15min", outcome: "positive" },
    },
    {
      type: "email",
      description: "Proposta comercial enviada para Silva & Associados",
      leadId: createdLeads[0].id,
      dealId: createdDeals[0].id,
      userId: agent.id,
    },
    {
      type: "stage_change",
      description: "Deal movido para Proposta Enviada",
      dealId: createdDeals[0].id,
      leadId: createdLeads[0].id,
      userId: agent.id,
      metadata: { from: "Qualificado", to: "Proposta Enviada" },
    },
    {
      type: "note",
      description: "TechStart tem interesse em pacote completo de redes sociais (Instagram + LinkedIn)",
      leadId: createdLeads[1].id,
      userId: agent.id,
    },
    {
      type: "deal_created",
      description: "Deal criado: Landing Pages - Mendes Construções",
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
    {
      type: "automation",
      description: "Email de boas-vindas enviado automaticamente para Ricardo Almeida",
      leadId: createdLeads[5].id,
      metadata: { automationType: "welcome_email" },
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
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: "high",
      leadId: createdLeads[0].id,
      dealId: createdDeals[0].id,
      assignedToId: agent.id,
      createdById: manager.id,
    },
    {
      title: "Agendar reunião com TechStart",
      description: "Apresentar estratégia de redes sociais para Q2",
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      priority: "medium",
      leadId: createdLeads[1].id,
      dealId: createdDeals[1].id,
      assignedToId: agent.id,
      createdById: manager.id,
    },
    {
      title: "Preparar audit SEO para Organic Food",
      description: "Análise completa do site e concorrentes",
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      priority: "medium",
      leadId: createdLeads[5].id,
      dealId: createdDeals[5].id,
      assignedToId: manager.id,
      createdById: admin.id,
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
      body: "Ricardo Almeida (Organic Food Brasil) entrou via WhatsApp",
      userId: manager.id,
      data: { leadId: createdLeads[5].id },
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
      body: "Landing Pages - Mendes Construções avançou para Negociação (R$ 15.000)",
      userId: admin.id,
      data: { dealId: createdDeals[3].id },
    },
    {
      type: "handoff",
      title: "Handoff de atendimento",
      body: "Ana Oliveira solicitou falar com um atendente humano",
      userId: agent.id,
      data: { leadId: createdLeads[2].id },
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
