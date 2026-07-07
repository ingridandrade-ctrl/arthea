-- Plataformas de mídia por dashboard: o setup do dashboard do cliente agora
-- registra quais plataformas ele roda ("meta" e/ou "google"). O dashboard só
-- renderiza (e só mostra tabs) pro que estiver aqui.

ALTER TABLE "ClientDashboardConfig"
  ADD COLUMN IF NOT EXISTS "platforms" JSONB NOT NULL DEFAULT '["meta"]'::jsonb;
