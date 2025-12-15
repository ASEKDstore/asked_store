# Deployment Paths

This document specifies the exact paths for each service in the monorepo.

## Service Paths

### Frontend
- **Path:** `apps/frontend`
- **Type:** Static Site
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

### Backend
- **Path:** `apps/backend`
- **Type:** Web Service
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

### Bot
- **Path:** `apps/bot`
- **Type:** Background Worker
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

## Verify Paths

Run the following command to verify all paths exist:

```bash
npm run where
```

This will check:
- `apps/backend` ✅/❌
- `backend` ✅/❌
- `apps/frontend` ✅/❌
- `frontend` ✅/❌
- `apps/bot` ✅/❌
- `bot` ✅/❌

