-- Migration: módulo Google Ads (GoogleAdsConnection + GoogleAdsAccount)
-- Data: 2026-06-12
--
-- Não-destrutivo:
--   - 1 enum novo (GoogleAdsStatus)
--   - 2 tabelas novas (GoogleAdsConnection, GoogleAdsAccount)
--
-- Aplicar no Neon SQL Editor. Pode rodar em uma única passagem.

CREATE TYPE "GoogleAdsStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

CREATE TABLE "GoogleAdsConnection" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "mccCustomerId"  TEXT NOT NULL,
  "status"         "GoogleAdsStatus" NOT NULL DEFAULT 'ACTIVE',
  "accessToken"    TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleAdsConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleAdsConnection_userId_key" ON "GoogleAdsConnection"("userId");

ALTER TABLE "GoogleAdsConnection"
  ADD CONSTRAINT "GoogleAdsConnection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GoogleAdsAccount" (
  "id"           TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "engagementId" TEXT,
  "customerId"   TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "currencyCode" TEXT NOT NULL DEFAULT 'BRL',
  "hidden"       BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoogleAdsAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleAdsAccount_connectionId_customerId_key"
  ON "GoogleAdsAccount"("connectionId", "customerId");
CREATE INDEX "GoogleAdsAccount_engagementId_idx" ON "GoogleAdsAccount"("engagementId");
CREATE INDEX "GoogleAdsAccount_hidden_idx" ON "GoogleAdsAccount"("hidden");

ALTER TABLE "GoogleAdsAccount"
  ADD CONSTRAINT "GoogleAdsAccount_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "GoogleAdsConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleAdsAccount"
  ADD CONSTRAINT "GoogleAdsAccount_engagementId_fkey"
  FOREIGN KEY ("engagementId") REFERENCES "ClientEngagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
