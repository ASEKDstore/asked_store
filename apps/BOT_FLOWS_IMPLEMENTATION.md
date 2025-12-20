# Bot Flows Implementation Status

## ✅ Completed

### 1. Prisma Schema Extended
- ✅ Added `BotFlowStatus` enum (DRAFT, PUBLISHED, ARCHIVED)
- ✅ Extended `BotFlow` model with:
  - `status`, `version`, `entryPoints`, `startNodeId`, `publishedAt`
  - Relations to `BotFlowNode`, `BotFlowVersion`, `BotUserState`
- ✅ Created `BotFlowNode` model with:
  - `type` enum (MESSAGE, MEDIA, INPUT, ACTION, MENU)
  - `content`, `keyboard`, `transitions`, `guards`, `effects` (JSON)
- ✅ Created `BotFlowVersion` model for immutable snapshots
- ✅ Created `BotUserState` model for runtime state

**File:** `backend/prisma/schema.prisma`

### 2. Backend API Extended
- ✅ Created `botFlowsExtended.ts` with:
  - GET `/api/admin/bot/flows` (with nodes and versions)
  - GET `/api/admin/bot/flows/:id` (with nodes)
  - POST `/api/admin/bot/flows` (create with nodes)
  - PUT `/api/admin/bot/flows/:id` (update with nodes)
  - POST `/api/admin/bot/flows/:id/duplicate`
  - POST `/api/admin/bot/flows/:id/publish` (with validation)
  - POST `/api/admin/bot/flows/:id/rollback`
  - POST `/api/admin/bot/flows/:id/archive`
  - GET `/api/admin/bot/flows/:id/nodes`
  - PUT `/api/admin/bot/flows/:id/nodes` (bulk save)

- ✅ Created `botPreview.ts` with:
  - POST `/api/admin/bot/preview/run` (simulate flow execution)

**Files:** 
- `backend/src/routes/admin/botFlowsExtended.ts`
- `backend/src/routes/admin/botPreview.ts`
- `backend/src/server.ts` (updated)

### 3. Validation Logic
- ✅ Flow validation on publish:
  - Start node exists
  - All transitions point to valid nodes
  - Entry points don't conflict with other PUBLISHED flows
  - Telegram limits (text length, button count, callback_data length, animation frames)

## ✅ Completed

### 4. Prisma Migration
**Status:** SQL migration created manually

**File:** `backend/prisma/migrations/20241220000000_extend_bot_flows/migration.sql`

**To apply migration:**
```bash
cd apps/backend
npm run migrate:deploy
```

**Migration includes:**
- Added new columns to `bot_flows` table (status, version, entryPoints, startNodeId, publishedAt)
- Created `bot_flow_nodes` table
- Created `bot_flow_versions` table
- Created `bot_user_states` table
- Added indexes and foreign keys
- Kept existing `bot_flow_steps` table (legacy, for backward compatibility)

### 5. Bot FlowEngine Implementation
**File:** `apps/bot/src/flowEngineV2.ts` ✅

**Completed:**
- ✅ Entry point routing (command:start, callback:*, text:*, webapp:*)
- ✅ State machine (load/save BotUserState from Prisma)
- ✅ Node execution with guards/effects
- ✅ Transition handling (button clicks, text input, fallback)
- ✅ Message rendering (sendMessage, editMessageText) - `flowRenderer.ts`
- ✅ Animation effect (editMessage with frames)
- ✅ Auto-delete effect
- ✅ One-message screen (prefer edit over send)

**Integration:**
- ✅ Direct Prisma access (no HTTP calls within monorepo)
- ✅ Uses `DATABASE_URL` from env
- ✅ Handles Telegram API errors gracefully

## 📋 TODO

### 6. Frontend Admin Panel
**File:** `apps/frontend/src/pages/admin/BotFlowsAdminPage.tsx` (needs update)

### 6. Frontend Admin Panel
**File:** `apps/frontend/src/pages/admin/BotFlowsAdminPage.tsx` (needs rewrite)

**Required:**
- [ ] List view with status badges (DRAFT, PUBLISHED, ARCHIVED)
- [ ] Form Builder MVP:
  - Left: Sortable node list
  - Center: Preview bubble (Telegram-like)
  - Right: Node editor (type, content, keyboard, transitions, guards, effects)
- [ ] Publish UI with validation errors display
- [ ] Version history drawer with rollback
- [ ] Preview simulator (mini chat)
- [ ] Duplicate/Archive actions

## 🎯 Next Steps

1. **Create Migration:**
   ```bash
   cd apps/backend
   npm install
   npm run migrate:dev -- --name extend_bot_flows
   ```

2. **Test Backend API:**
   - Create flow with nodes
   - Publish flow
   - Test preview endpoint
   - Test rollback

3. **Implement Bot FlowEngine:**
   - Rewrite `apps/bot/src/flowEngine.ts`
   - Add Prisma client to bot
   - Implement routing and state machine
   - Test with /start command

4. **Update Frontend:**
   - Rewrite `BotFlowsAdminPage.tsx`
   - Add Form Builder UI
   - Add Preview simulator
   - Add Version history

## 📝 Notes

- **Backward Compatibility:** Existing `BotFlowStep` model is kept for legacy support
- **Migration Strategy:** New flows use `BotFlowNode`, old flows can be migrated
- **Telegram Limits:** Validation enforces limits at publish time
- **State Management:** `BotUserState` stores active flow, node, and context
- **Versioning:** Immutable snapshots allow rollback to any published version

## 🔗 API Endpoints Summary

### Flows
- `GET /api/admin/bot/flows` - List all flows
- `GET /api/admin/bot/flows/:id` - Get flow with nodes
- `POST /api/admin/bot/flows` - Create flow
- `PUT /api/admin/bot/flows/:id` - Update flow (DRAFT only)
- `POST /api/admin/bot/flows/:id/duplicate` - Duplicate flow
- `POST /api/admin/bot/flows/:id/publish` - Publish flow (creates version)
- `POST /api/admin/bot/flows/:id/rollback` - Rollback to version
- `POST /api/admin/bot/flows/:id/archive` - Archive flow

### Nodes
- `GET /api/admin/bot/flows/:id/nodes` - Get all nodes
- `PUT /api/admin/bot/flows/:id/nodes` - Bulk save nodes

### Preview
- `POST /api/admin/bot/preview/run` - Simulate flow execution

