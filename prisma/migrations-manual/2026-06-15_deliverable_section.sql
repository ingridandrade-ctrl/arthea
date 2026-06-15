-- Add DeliverableSection concept: Onboarding (initial setup, phased) vs Ongoing (recurring ops)
--
-- Rationale: the original 4-phase model conflated initial setup with continuous operation.
-- Now phases 1-3 (Imersão, Construção, Rastreamento) live under ONBOARDING; phase 4 (Entrega)
-- becomes the seed for ONGOING (dashboard, monthly reports, recurring optimizations).

CREATE TYPE "DeliverableSection" AS ENUM ('ONBOARDING', 'ONGOING');

-- ServiceDeliverableTemplate
ALTER TABLE "ServiceDeliverableTemplate"
  ADD COLUMN "section" "DeliverableSection" NOT NULL DEFAULT 'ONBOARDING';

UPDATE "ServiceDeliverableTemplate"
  SET "section" = 'ONGOING'
  WHERE "phase" >= 4;

DROP INDEX IF EXISTS "ServiceDeliverableTemplate_serviceId_order_idx";
CREATE INDEX "ServiceDeliverableTemplate_serviceId_section_order_idx"
  ON "ServiceDeliverableTemplate"("serviceId", "section", "order");

-- ClientDeliverable
ALTER TABLE "ClientDeliverable"
  ADD COLUMN "section" "DeliverableSection" NOT NULL DEFAULT 'ONBOARDING';

UPDATE "ClientDeliverable"
  SET "section" = 'ONGOING'
  WHERE "phase" >= 4;

DROP INDEX IF EXISTS "ClientDeliverable_engagementId_phase_idx";
CREATE INDEX "ClientDeliverable_engagementId_section_phase_idx"
  ON "ClientDeliverable"("engagementId", "section", "phase");
