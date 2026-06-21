-- ─────────────────────────────────────────────────────────────────
-- PR C do roadmap — templates de entregáveis por Service
--
-- Cada Service ganha uma lista editável de "entregáveis padrão"
-- que serão criados como ClientDeliverable reais quando o wizard
-- de novo cliente cadastrar esse serviço.
--
-- Roda no Neon SQL Editor.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ServiceDeliverableTemplate" (
  "id"          TEXT NOT NULL,
  "serviceId"   TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "kind"        "DeliverableKind" NOT NULL DEFAULT 'DOCUMENT',
  "phase"       INTEGER NOT NULL DEFAULT 1,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceDeliverableTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceDeliverableTemplate_serviceId_order_idx"
  ON "ServiceDeliverableTemplate"("serviceId", "order");

ALTER TABLE "ServiceDeliverableTemplate"
  ADD CONSTRAINT "ServiceDeliverableTemplate_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
