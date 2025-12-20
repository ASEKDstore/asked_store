-- AlterTable: Add new columns to bot_flows
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT';
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 0;
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "entryPoints" JSONB DEFAULT '[]';
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "startNodeId" TEXT;
ALTER TABLE "bot_flows" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- CreateEnum: BotFlowStatus
DO $$ BEGIN
 CREATE TYPE "BotFlowStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update status column to use enum
ALTER TABLE "bot_flows" ALTER COLUMN "status" TYPE "BotFlowStatus" USING "status"::"BotFlowStatus";
ALTER TABLE "bot_flows" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable: bot_flow_nodes
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

-- CreateEnum: BotNodeType
DO $$ BEGIN
 CREATE TYPE "BotNodeType" AS ENUM('MESSAGE', 'MEDIA', 'INPUT', 'ACTION', 'MENU');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update type column to use enum
ALTER TABLE "bot_flow_nodes" ALTER COLUMN "type" TYPE "BotNodeType" USING "type"::"BotNodeType";

-- CreateTable: bot_flow_versions
CREATE TABLE IF NOT EXISTS "bot_flow_versions" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedByTgId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_flow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bot_user_states
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bot_flows_status_version_idx" ON "bot_flows"("status", "version");
CREATE INDEX IF NOT EXISTS "bot_flows_key_idx" ON "bot_flows"("key");
CREATE INDEX IF NOT EXISTS "bot_flow_nodes_flowId_idx" ON "bot_flow_nodes"("flowId");
CREATE INDEX IF NOT EXISTS "bot_flow_nodes_flowId_order_idx" ON "bot_flow_nodes"("flowId", "order");
CREATE INDEX IF NOT EXISTS "bot_flow_versions_flowId_idx" ON "bot_flow_versions"("flowId");
CREATE UNIQUE INDEX IF NOT EXISTS "bot_flow_versions_flowId_version_key" ON "bot_flow_versions"("flowId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "bot_user_states_telegramUserId_key" ON "bot_user_states"("telegramUserId");
CREATE INDEX IF NOT EXISTS "bot_user_states_telegramUserId_idx" ON "bot_user_states"("telegramUserId");
CREATE INDEX IF NOT EXISTS "bot_user_states_activeFlowId_idx" ON "bot_user_states"("activeFlowId");

-- AddForeignKey
ALTER TABLE "bot_flow_nodes" ADD CONSTRAINT "bot_flow_nodes_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_flow_versions" ADD CONSTRAINT "bot_flow_versions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "bot_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_user_states" ADD CONSTRAINT "bot_user_states_activeFlowId_fkey" FOREIGN KEY ("activeFlowId") REFERENCES "bot_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

