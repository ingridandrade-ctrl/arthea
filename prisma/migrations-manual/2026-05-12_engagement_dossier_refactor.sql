-- Migration: Refator ClientProject → ClientEngagement + ClientSummary → ClientDossier
-- Data: 2026-05-12
-- Aplicar no Neon SQL Editor (Postgres não permite ALTER TYPE dentro de transação
-- que tenha outras statements, por isso o script é dividido em DUAS partes).
--
-- IMPORTANTE: faça backup da base antes de rodar.
--
-- ──────── PARTE 1 (rode primeiro, sozinho) ────────

-- Novo enum para tipo de engagement
CREATE TYPE "EngagementType" AS ENUM ('STRATEGY', 'PAID_TRAFFIC', 'LANDING_PAGE', 'GMB');

-- Expansão do enum DeliverableCategory (cada ADD VALUE precisa rodar em statement separada
-- em algumas versões do Postgres; se der erro, rode uma de cada vez).
ALTER TYPE "DeliverableCategory" ADD VALUE 'CAMPAIGN_SETUP';
ALTER TYPE "DeliverableCategory" ADD VALUE 'CREATIVE';
ALTER TYPE "DeliverableCategory" ADD VALUE 'REPORT';
ALTER TYPE "DeliverableCategory" ADD VALUE 'OPTIMIZATION';
ALTER TYPE "DeliverableCategory" ADD VALUE 'BRIEFING';
ALTER TYPE "DeliverableCategory" ADD VALUE 'WIREFRAME';
ALTER TYPE "DeliverableCategory" ADD VALUE 'DESIGN';
ALTER TYPE "DeliverableCategory" ADD VALUE 'DEVELOPMENT';
ALTER TYPE "DeliverableCategory" ADD VALUE 'LAUNCH';
ALTER TYPE "DeliverableCategory" ADD VALUE 'PROFILE_SETUP';
ALTER TYPE "DeliverableCategory" ADD VALUE 'POST';
ALTER TYPE "DeliverableCategory" ADD VALUE 'REVIEW_RESPONSE';

-- ──────── PARTE 2 (depois, em outro Run) ────────

-- ─── 1. Renomear ClientProject → ClientEngagement e adicionar novos campos ───

ALTER TABLE "ClientProject" RENAME TO "ClientEngagement";

-- Renomeia índices/constraints associados (Postgres não auto-renomeia)
ALTER INDEX "ClientProject_pkey" RENAME TO "ClientEngagement_pkey";
ALTER INDEX "ClientProject_clientId_key" RENAME TO "ClientEngagement_clientId_key_OLD";
ALTER INDEX "ClientProject_clientId_idx" RENAME TO "ClientEngagement_clientId_idx";
ALTER TABLE "ClientEngagement" RENAME CONSTRAINT "ClientProject_clientId_fkey" TO "ClientEngagement_clientId_fkey";

-- Novos campos
ALTER TABLE "ClientEngagement" ADD COLUMN "type" "EngagementType" NOT NULL DEFAULT 'STRATEGY';
ALTER TABLE "ClientEngagement" ADD COLUMN "slug" TEXT;
ALTER TABLE "ClientEngagement" ADD COLUMN "totalPhases" INTEGER NOT NULL DEFAULT 4;

-- Backfill do slug pros registros existentes (único projeto do André)
UPDATE "ClientEngagement" SET "slug" = 'estrategia-digital' WHERE "slug" IS NULL;

-- Slug agora é NOT NULL
ALTER TABLE "ClientEngagement" ALTER COLUMN "slug" SET NOT NULL;

-- Substitui o unique antigo (clientId só) pelo composite (clientId, slug)
DROP INDEX "ClientEngagement_clientId_key_OLD";
CREATE UNIQUE INDEX "ClientEngagement_clientId_slug_key" ON "ClientEngagement"("clientId", "slug");

-- Index novo para type
CREATE INDEX "ClientEngagement_type_idx" ON "ClientEngagement"("type");

-- ─── 2. Renomear FK columns em tabelas filhas: projectId → engagementId ───

-- ClientDeliverable
ALTER TABLE "ClientDeliverable" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "ClientDeliverable" RENAME CONSTRAINT "ClientDeliverable_projectId_fkey" TO "ClientDeliverable_engagementId_fkey";
ALTER INDEX "ClientDeliverable_projectId_phase_idx" RENAME TO "ClientDeliverable_engagementId_phase_idx";

-- ClientAccess
ALTER TABLE "ClientAccess" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "ClientAccess" RENAME CONSTRAINT "ClientAccess_projectId_fkey" TO "ClientAccess_engagementId_fkey";
ALTER INDEX "ClientAccess_projectId_idx" RENAME TO "ClientAccess_engagementId_idx";

-- ClientReference
ALTER TABLE "ClientReference" RENAME COLUMN "projectId" TO "engagementId";
ALTER TABLE "ClientReference" RENAME CONSTRAINT "ClientReference_projectId_fkey" TO "ClientReference_engagementId_fkey";
ALTER INDEX "ClientReference_projectId_idx" RENAME TO "ClientReference_engagementId_idx";

-- MetaAdAccount: clientProjectId → engagementId
ALTER TABLE "MetaAdAccount" RENAME COLUMN "clientProjectId" TO "engagementId";
ALTER TABLE "MetaAdAccount" RENAME CONSTRAINT "MetaAdAccount_clientProjectId_fkey" TO "MetaAdAccount_engagementId_fkey";
ALTER INDEX "MetaAdAccount_clientProjectId_idx" RENAME TO "MetaAdAccount_engagementId_idx";

-- ─── 3. Criar ClientDossier e migrar dados do ClientSummary ───

CREATE TABLE "ClientDossier" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "digitalPresence" JSONB NOT NULL DEFAULT '{}',
    "brandContext" JSONB NOT NULL DEFAULT '{}',
    "voice" JSONB NOT NULL DEFAULT '{}',
    "market" JSONB NOT NULL DEFAULT '{}',
    "contacts" JSONB NOT NULL DEFAULT '[]',
    "commercial" JSONB NOT NULL DEFAULT '{}',
    "archive" JSONB NOT NULL DEFAULT '{}',
    "brandIdentity" JSONB NOT NULL DEFAULT '{}',
    "performance" JSONB NOT NULL DEFAULT '{}',
    "legacySummaryHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientDossier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientDossier_clientId_key" ON "ClientDossier"("clientId");

ALTER TABLE "ClientDossier"
    ADD CONSTRAINT "ClientDossier_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar conteúdo do ClientSummary (vinculado ao project) → ClientDossier (vinculado ao client)
INSERT INTO "ClientDossier" ("id", "clientId", "legacySummaryHtml", "createdAt", "updatedAt")
SELECT
    'dossier_' || substring(md5(random()::text || e."clientId") for 24),
    e."clientId",
    s."content",
    NOW(),
    s."updatedAt"
FROM "ClientSummary" s
JOIN "ClientEngagement" e ON e."id" = s."projectId";

-- Drop ClientSummary (dados já migrados)
DROP TABLE "ClientSummary";

-- ─── Fim ───
-- Após aplicar, rode `npx prisma generate` no projeto pra atualizar o client.
