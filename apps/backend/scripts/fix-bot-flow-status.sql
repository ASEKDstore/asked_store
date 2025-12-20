-- Manual fix for bot_flows.status column enum issue
-- Run this BEFORE applying the migration

-- Step 1: Create enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE "BotFlowStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 2: Check if status column exists and fix it
DO $$ 
BEGIN
  -- Check if status column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bot_flows' 
    AND column_name = 'status'
  ) THEN
    -- Column exists - check its type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bot_flows' 
      AND column_name = 'status'
      AND data_type = 'text'
    ) THEN
      -- It's TEXT, convert to enum
      ALTER TABLE "bot_flows" 
        ALTER COLUMN "status" DROP DEFAULT;
      
      ALTER TABLE "bot_flows" 
        ALTER COLUMN "status" TYPE "BotFlowStatus" USING 
          CASE 
            WHEN "status"::text = 'DRAFT' THEN 'DRAFT'::"BotFlowStatus"
            WHEN "status"::text = 'PUBLISHED' THEN 'PUBLISHED'::"BotFlowStatus"
            WHEN "status"::text = 'ARCHIVED' THEN 'ARCHIVED'::"BotFlowStatus"
            WHEN "status"::text = 'true' OR "status"::text = '1' THEN 'PUBLISHED'::"BotFlowStatus"
            WHEN "status"::text = 'false' OR "status"::text = '0' THEN 'DRAFT'::"BotFlowStatus"
            ELSE 'DRAFT'::"BotFlowStatus"
          END;
      
      ALTER TABLE "bot_flows" 
        ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"BotFlowStatus";
    END IF;
  ELSE
    -- Column doesn't exist, add it
    ALTER TABLE "bot_flows" 
      ADD COLUMN "status" "BotFlowStatus" DEFAULT 'DRAFT'::"BotFlowStatus";
  END IF;
END $$;

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bot_flows' AND column_name = 'status';

