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

## 🔄 In Progress

### 4. Prisma Migration
**Status:** Schema updated, migration needs to be created

**To create migration:**
```bash
cd apps/backend
npm install  # Ensure dependencies are installed
npm run migrate:dev -- --name extend_bot_flows
```

**Note:** Migration will:
- Add new columns to `bot_flows` table
- Create `bot_flow_nodes`, `bot_flow_versions`, `bot_user_states` tables
- Add indexes
- Keep existing `bot_flow_steps` table (legacy, for backward compatibility)

## 📋 TODO

### 5. Bot FlowEngine Implementation
**File:** `apps/bot/src/flowEngine.ts` (needs rewrite)

**Required:**
- [ ] Entry point routing (command:start, callback:*, text:*, webapp:*)
- [ ] State machine (load/save BotUserState from Prisma)
- [ ] Node execution with guards/effects
- [ ] Transition handling (button clicks, text input, fallback)
- [ ] Message rendering (sendMessage, editMessageText)
- [ ] Animation effect (editMessage with frames)
- [ ] Auto-delete effect
- [ ] One-message screen (prefer edit over send)

**Integration points:**
- Direct Prisma access (no HTTP calls within monorepo)
- Use `DATABASE_URL` from env
- Handle Telegram API errors (429, 400)

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

