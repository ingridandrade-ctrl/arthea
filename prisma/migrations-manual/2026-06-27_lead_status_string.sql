-- Converte Lead.status de enum LeadStatus para TEXT, mapeando valores antigos.
-- Esta migration roda ANTES do prisma db push para preservar dados.
-- Idempotente: se já foi convertida (coluna já é text), o ALTER é no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'status' AND udt_name = 'LeadStatus'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE "Lead" ALTER COLUMN status TYPE TEXT USING (
      CASE status::text
        WHEN 'NEW' THEN 'ATIVO'
        WHEN 'CONTACTED' THEN 'ATIVO'
        WHEN 'QUALIFIED' THEN 'CLIENTE'
        WHEN 'UNQUALIFIED' THEN 'DESQUALIFICADO'
        ELSE 'ATIVO'
      END
    );
    ALTER TABLE "Lead" ALTER COLUMN status SET DEFAULT 'ATIVO';
    DROP TYPE "LeadStatus";
  END IF;
END $$;
