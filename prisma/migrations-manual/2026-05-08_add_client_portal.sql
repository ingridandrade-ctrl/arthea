-- Migration: portal de clientes
-- Aplicar no Neon SQL Editor.
--
-- IMPORTANTE: o "ALTER TYPE Role ADD VALUE 'CLIENT'" precisa rodar SOZINHO
-- (Postgres não permite ALTER TYPE dentro de transação que tenha outras
-- statements). Por isso o script está em DUAS partes — execute na ordem.
--
-- ──────── PARTE 1 (rode primeiro, sozinho) ────────

ALTER TYPE "Role" ADD VALUE 'CLIENT';

-- ──────── PARTE 2 (depois, em outro Run) ────────

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING_REVIEW', 'APPROVED', 'REVISION');

-- CreateEnum
CREATE TYPE "DeliverableCategory" AS ENUM ('POSITIONING', 'CONTENT', 'TRACKING', 'DELIVERY');

-- CreateTable
CREATE TABLE "ClientProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "accentColor" TEXT NOT NULL DEFAULT '#1D7070',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSummary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDeliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DeliverableCategory" NOT NULL,
    "phase" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "documentEmbed" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableQuestion" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" TEXT[],
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeliverableQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableResponse" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableComment" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFromArthea" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverableComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAccess" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "icon" TEXT,
    "username" TEXT,
    "password" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClientAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientReference" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClientReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_clientId_key" ON "ClientProject"("clientId");

-- CreateIndex
CREATE INDEX "ClientProject_clientId_idx" ON "ClientProject"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSummary_projectId_key" ON "ClientSummary"("projectId");

-- CreateIndex
CREATE INDEX "ClientDeliverable_projectId_phase_idx" ON "ClientDeliverable"("projectId", "phase");

-- CreateIndex
CREATE INDEX "ClientDeliverable_status_idx" ON "ClientDeliverable"("status");

-- CreateIndex
CREATE INDEX "DeliverableQuestion_deliverableId_idx" ON "DeliverableQuestion"("deliverableId");

-- CreateIndex
CREATE INDEX "DeliverableResponse_deliverableId_idx" ON "DeliverableResponse"("deliverableId");

-- CreateIndex
CREATE INDEX "DeliverableResponse_questionId_idx" ON "DeliverableResponse"("questionId");

-- CreateIndex
CREATE INDEX "DeliverableComment_deliverableId_idx" ON "DeliverableComment"("deliverableId");

-- CreateIndex
CREATE INDEX "ClientAccess_projectId_idx" ON "ClientAccess"("projectId");

-- CreateIndex
CREATE INDEX "ClientReference_projectId_idx" ON "ClientReference"("projectId");

-- AddForeignKey
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSummary" ADD CONSTRAINT "ClientSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDeliverable" ADD CONSTRAINT "ClientDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableQuestion" ADD CONSTRAINT "DeliverableQuestion_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "ClientDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableResponse" ADD CONSTRAINT "DeliverableResponse_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "ClientDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableResponse" ADD CONSTRAINT "DeliverableResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DeliverableQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableComment" ADD CONSTRAINT "DeliverableComment_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "ClientDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAccess" ADD CONSTRAINT "ClientAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReference" ADD CONSTRAINT "ClientReference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
