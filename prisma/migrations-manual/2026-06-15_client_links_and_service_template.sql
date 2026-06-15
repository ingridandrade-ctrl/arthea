-- ─────────────────────────────────────────────────────────────────
-- PR B do roadmap de IA — fundação técnica do wizard de novo cliente
--
-- Adiciona:
--   1. User.leadId — quando User(CLIENT) foi criado a partir de um Lead
--   2. Contract.clientUserId — qual cliente do portal esse contrato pertence
--   3. Service.engagementType — tipo de frente que esse serviço cria
--   4. Service.defaultDurationMonths — duração default sugerida pro contrato
--
-- Tudo opcional/com default — sem quebra de dados existentes.
-- Rodar no Neon SQL Editor.
-- ─────────────────────────────────────────────────────────────────

-- 1. User.leadId (1:1 com Lead, opcional)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_leadId_key" ON "User"("leadId");
ALTER TABLE "User"
  ADD CONSTRAINT "User_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Contract.clientUserId
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "clientUserId" TEXT;
CREATE INDEX IF NOT EXISTS "Contract_clientUserId_idx" ON "Contract"("clientUserId");
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_clientUserId_fkey"
  FOREIGN KEY ("clientUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Service.engagementType (enum EngagementType já existe)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "engagementType" "EngagementType";

-- 4. Service.defaultDurationMonths
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "defaultDurationMonths" INTEGER NOT NULL DEFAULT 12;
