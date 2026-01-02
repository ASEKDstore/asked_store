# ASKED - Telegram Mini App Shop

Production-ready monorepo for Telegram Mini App clothing store.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Runtime**: Node.js 20
- **Backend**: Fastify + Prisma + PostgreSQL
- **Frontend**: Next.js 14+ (Admin + Mini App)
- **Language**: TypeScript

## Structure

```
├── apps/
│   ├── api/          # Fastify backend API
│   ├── admin/        # Next.js admin panel
│   └── miniapp/      # Next.js Telegram Mini App
├── packages/
│   └── shared/       # Shared types and utilities
└── ...
```

## Development

```bash
# Install dependencies
pnpm install

# Run all apps in development
pnpm dev

# Build all apps
pnpm build

# Type check
pnpm typecheck
```

## Environment Variables

### API (apps/api)

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `BOT_TOKEN` - Telegram bot token
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

### Admin & Mini App (apps/admin, apps/miniapp)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (set by Render)

## Render Deployment

### Build Command
```
pnpm install --frozen-lockfile && pnpm build
```

### Start Command

**API:**
```
pnpm migrate:deploy && pnpm start
```

**Admin & Mini App:**
```
pnpm start
```

## Health Check

API provides health check endpoint: `GET /health`



