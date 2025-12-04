-- AlterTable (handle both bots and agents table names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'avatar_url') THEN
      ALTER TABLE "agents" ADD COLUMN "avatar_url" TEXT;
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bots') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'avatar_url') THEN
      ALTER TABLE "bots" ADD COLUMN "avatar_url" TEXT;
    END IF;
  END IF;
END $$;
