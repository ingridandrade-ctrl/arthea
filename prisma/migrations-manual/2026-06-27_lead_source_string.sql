-- Converte Lead.source de enum LeadSource para TEXT, mapeando valores antigos
-- pros 3 novos: PROSPECCAO, INDICACAO, FORMS.
-- Idempotente: se já for text, não faz nada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'source' AND udt_name = 'LeadSource'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN source DROP DEFAULT;
    ALTER TABLE "Lead" ALTER COLUMN source TYPE TEXT USING (
      CASE source::text
        WHEN 'WHATSAPP' THEN 'PROSPECCAO'
        WHEN 'MANUAL' THEN 'PROSPECCAO'
        WHEN 'WEBSITE' THEN 'FORMS'
        WHEN 'QUIZ' THEN 'FORMS'
        WHEN 'REFERRAL' THEN 'INDICACAO'
        ELSE 'PROSPECCAO'
      END
    );
    ALTER TABLE "Lead" ALTER COLUMN source SET DEFAULT 'PROSPECCAO';
    DROP TYPE "LeadSource";
  END IF;
END $$;
