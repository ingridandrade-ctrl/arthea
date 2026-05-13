-- Migration: Adiciona coluna internalData (dados privados da agência) em ClientEngagement
-- Data: 2026-05-12
--
-- Esta migration é APLICADA AUTOMATICAMENTE pelo prisma db push no build do Vercel.
-- Está aqui só pra histórico — não precisa rodar manualmente no Neon a menos que
-- queira aplicar antes do deploy.

ALTER TABLE "ClientEngagement"
  ADD COLUMN IF NOT EXISTS "internalData" JSONB NOT NULL DEFAULT '{}';
