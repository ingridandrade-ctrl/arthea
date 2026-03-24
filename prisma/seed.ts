import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
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
  ];

  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });

    // Create default pipeline for each service
    const pipeline = await prisma.pipeline.create({
      data: {
        name: `Pipeline ${service.name}`,
        serviceId: created.id,
        stages: {
          create: [
            { name: "Novo Lead", order: 0, color: "#94a3b8" },
            { name: "Em Contato", order: 1, color: "#3b82f6" },
            { name: "Qualificado", order: 2, color: "#8b5cf6" },
            { name: "Proposta Enviada", order: 3, color: "#f59e0b" },
            { name: "Negociação", order: 4, color: "#f97316" },
            { name: "Fechado Ganho", order: 5, color: "#22c55e" },
            { name: "Fechado Perdido", order: 6, color: "#ef4444" },
          ],
        },
      },
    });

    console.log(`Created pipeline for ${service.name}:`, pipeline.name);
  }

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
