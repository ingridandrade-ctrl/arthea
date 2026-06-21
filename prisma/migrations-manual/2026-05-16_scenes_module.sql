-- Migration: módulo Acervo de cenas (Scene + SceneComment) + flag por user
-- Data: 2026-05-16
--
-- Não-destrutivo:
--   - 2 enums novos (SceneTheme, SceneStatus)
--   - 2 tabelas novas (Scene, SceneComment)
--   - 1 coluna nova em User (scenesEnabled, default false)
--
-- Aplicar no Neon SQL Editor. Pode rodar em uma única passagem.

-- ── Parte 1: enums ──

CREATE TYPE "SceneTheme" AS ENUM (
  'COMMUNICATION_FAILURE',
  'SILENT_DISTANCE',
  'THE_CHOICE',
  'CONTROL_ROMANTICIZED',
  'MASCULINE_VULNERABILITY',
  'IDEALIZATION',
  'LOVE_AS_PERMANENCE'
);

CREATE TYPE "SceneStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ── Parte 2: coluna em User ──

ALTER TABLE "User"
  ADD COLUMN "scenesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- ── Parte 3: tabelas ──

CREATE TABLE "Scene" (
  "id"            TEXT NOT NULL,
  "clientId"      TEXT NOT NULL,
  "theme"         "SceneTheme" NOT NULL,
  "order"         INTEGER NOT NULL DEFAULT 0,
  "characters"    TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "work"          TEXT NOT NULL,
  "context"       TEXT NOT NULL,
  "sceneAndQuote" TEXT NOT NULL,
  "platform"      TEXT,
  "videoLink"     TEXT,
  "hook"          TEXT,
  "clinicalAngle" TEXT NOT NULL,
  "status"        "SceneStatus" NOT NULL DEFAULT 'PENDING',
  "scriptText"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Scene_clientId_theme_idx" ON "Scene"("clientId", "theme");
CREATE INDEX "Scene_clientId_status_idx" ON "Scene"("clientId", "status");

ALTER TABLE "Scene"
  ADD CONSTRAINT "Scene_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SceneComment" (
  "id"           TEXT NOT NULL,
  "sceneId"      TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "content"      TEXT NOT NULL,
  "isFromArthea" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SceneComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SceneComment_sceneId_idx" ON "SceneComment"("sceneId");

ALTER TABLE "SceneComment"
  ADD CONSTRAINT "SceneComment_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SceneComment"
  ADD CONSTRAINT "SceneComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Fim. Aplicar prisma generate localmente depois (já está no build do Vercel).
