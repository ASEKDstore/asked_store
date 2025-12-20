-- Script to fix failed migration state
-- Run this manually in your database if migration failed

-- 1. Mark migration as applied (if it partially succeeded)
-- First, check if the migration record exists
-- If it exists with failed status, we need to either:
--   a) Delete it and re-run (if nothing was created)
--   b) Mark it as applied (if tables/columns were created)

-- Option A: If migration partially applied, mark it as rolled back
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20241220000000_extend_bot_flows';

-- Option B: If you want to manually fix the database and mark migration as applied:
-- This assumes you've manually fixed the status column issue

-- Check current state
SELECT migration_name, finished_at, rolled_back_at, logs 
FROM "_prisma_migrations" 
WHERE migration_name = '20241220000000_extend_bot_flows';

-- If you need to delete the failed migration record (use with caution):
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20241220000000_extend_bot_flows';

