-- CreateEnum: BotFlowStatus (must be created first)
DO $$ BEGIN
 CREATE TYPE "BotFlowStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: BotNodeType (must be created before bot_flow_nodes table)
DO $$ BEGIN
 CREATE TYPE "BotNodeType" AS ENUM('MESSAGE', 'MEDIA', 'INPUT', 'ACTION', 'MENU');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add new columns to bot_flows (idempotent)
DO $$ 
BEGIN
  -- Add description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'description'
  ) THEN
    ALTER TABLE "bot_flows" ADD COLUMN "description" TEXT;
  END IF;

  -- Add version
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'version'
  ) THEN
    ALTER TABLE "bot_flows" ADD COLUMN "version" INTEGER DEFAULT 0;
  END IF;

  -- Add entryPoints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'entryPoints'
  ) THEN
    ALTER TABLE "bot_flows" ADD COLUMN "entryPoints" JSONB DEFAULT '[]';
  END IF;

  -- Add startNodeId
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'startNodeId'
  ) THEN
    ALTER TABLE "bot_flows" ADD COLUMN "startNodeId" TEXT;
  END IF;

  -- Add publishedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'publishedAt'
  ) THEN
    ALTER TABLE "bot_flows" ADD COLUMN "publishedAt" TIMESTAMP(3);
  END IF;

  -- Add/convert status column with enum type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bot_flows' AND column_name = 'status'
  ) THEN
    -- Column doesn't exist, add it
    ALTER TABLE "bot_flows" ADD COLUMN "status" "BotFlowStatus" DEFAULT 'DRAFT'::"BotFlowStatus";
  ELSE
    -- Column exists - check if it's already enum type
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bot_flows' 
      AND column_name = 'status'
      AND udt_name = 'BotFlowStatus'
    ) THEN
      -- It's not enum yet, convert it
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
  END IF;
END $$;

-- CreateTable: bot_flow_nodes (idempotent)
CREATE TABLE IF NOT EXISTS "bot_flow_nodes" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "keyboard" JSONB,
    "transitions" JSONB,
    "guards" JSONB,
    "effects" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_flow_nodes_pkey" PRIMARY KEY ("id")
);

-- Update type column to use enum (idempotent)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bot_flow_nodes' 
    AND column_name = 'type'
    AND udt_name != 'BotNodeType'
  ) THEN
    ALTER TABLE "bot_flow_nodes" 
      ALTER COLUMN "type" TYPE "BotNodeType" USING "type"::"BotNodeType";
  END IF;
END $$;

-- CreateTable: bot_flow_versions (idempotent)
CREATE TABLE IF NOT EXISTS "bot_flow_versions" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedByTgId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_flow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bot_user_states (idempotent)
CREATE TABLE IF NOT EXISTS "bot_user_states" (
    "id" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "activeFlowId" TEXT,
    "activeFlowVersion" INTEGER,
    "currentNodeId" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "lastMessageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_user_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "bot_flows_status_version_idx" ON "bot_flows"("status", "version");
CREATE INDEX IF NOT EXISTS "bot_flows_key_idx" ON "bot_flows"("key");
CREATE INDEX IF NOT EXISTS "bot_flow_nodes_flowId_idx" ON "bot_flow_nodes"("flowId");
CREATE INDEX IF NOT EXISTS "bot_flow_nodes_flowId_order_idx" ON "bot_flow_nodes"("flowId", "order");
CREATE INDEX IF NOT EXISTS "bot_flow_versions_flowId_idx" ON "bot_flow_versions"("flowId");
CREATE UNIQUE INDEX IF NOT EXISTS "bot_flow_versions_flowId_version_key" ON "bot_flow_versions"("flowId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "bot_user_states_telegramUserId_key" ON "bot_user_states"("telegramUserId");
CREATE INDEX IF NOT EXISTS "bot_user_states_telegramUserId_idx" ON "bot_user_states"("telegramUserId");
CREATE INDEX IF NOT EXISTS "bot_user_states_activeFlowId_idx" ON "bot_user_states"("activeFlowId");

-- AddForeignKey (idempotent - will fail silently if constraint exists)
DO $$ 
BEGIN
  -- bot_flow_nodes foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bot_flow_nodes_flowId_fkey'
  ) THEN
    ALTER TABLE "bot_flow_nodes" 
      ADD CONSTRAINT "bot_flow_nodes_flowId_fkey" 
      FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- bot_flow_versions foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bot_flow_versions_flowId_fkey'
  ) THEN
    ALTER TABLE "bot_flow_versions" 
      ADD CONSTRAINT "bot_flow_versions_flowId_fkey" 
      FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- bot_user_states foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bot_user_states_activeFlowId_fkey'
  ) THEN
    ALTER TABLE "bot_user_states" 
      ADD CONSTRAINT "bot_user_states_activeFlowId_fkey" 
      FOREIGN KEY ("activeFlowId") REFERENCES "bot_flows"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

