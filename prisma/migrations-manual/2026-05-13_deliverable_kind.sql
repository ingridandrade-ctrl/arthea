-- Migration: adiciona DeliverableKind (TASK/FORM/DOCUMENT) pra distinguir
-- tipos de entregável no portal do cliente (Fase 1 Tráfego Pago e além).
-- Data: 2026-05-13
--
-- Não-destrutivo: cria enum + coluna com default DOCUMENT, que preserva o
-- comportamento atual de TODOS os entregáveis existentes (André).
--
-- Aplicar no Neon SQL Editor. As 2 partes podem rodar juntas (sem ALTER TYPE
-- ADD VALUE dessa vez).

CREATE TYPE "DeliverableKind" AS ENUM ('TASK', 'FORM', 'DOCUMENT');

ALTER TABLE "ClientDeliverable"
  ADD COLUMN "kind" "DeliverableKind" NOT NULL DEFAULT 'DOCUMENT';

-- Fim. Backfill automático via DEFAULT — todos os entregáveis existentes
-- viram DOCUMENT, o que é o que já fazem (revisão + aprovação tradicional).
