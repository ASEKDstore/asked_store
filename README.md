# ASKED - Telegram Mini App Shop

Production-ready monorepo for Telegram Mini App clothing store.

## Tech Stack

* **Monorepo**: pnpm workspaces + Turborepo
* **Runtime**: Node.js 20
* **Backend**: Fastify + Prisma + PostgreSQL
* **Frontend**: Next.js 14+ (Admin + Mini App)
* **Language**: TypeScript
* **Deployment**: Render + GitHub

## Structure

```
├── apps/
│   ├── api/          # Fastify backend API
│   ├── admin/        # Next.js admin panel
│   ├── miniapp/      # Next.js Telegram Mini App
│   └── bot/          # Telegram bot
├── packages/
│   └── shared/       # Shared types and utilities
└── render.yaml       # Render deployment configuration
```

## Development

```bash
# Install dependencies
pnpm install

# Run all apps in development
pnpm dev

# Run specific app
pnpm dev:admin
pnpm dev:miniapp
pnpm dev:api
pnpm dev:bot

# Build all apps
pnpm build

# Database commands
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Environment Variables

### API (apps/api)

* `DATABASE_URL` - PostgreSQL connection string
* `JWT_SECRET` - Secret for JWT tokens
* `TELEGRAM_BOT_TOKEN` - Telegram bot token
* `NODE_ENV` - Environment (development/production)
* `PORT` - Server port (default: 3000)

### Admin & Mini App (apps/admin, apps/miniapp)

* `NEXT_PUBLIC_API_URL` - Backend API URL
* `NODE_ENV` - Environment (development/production)
* `PORT` - Server port (set by Render)

### Bot (apps/bot)

* `TELEGRAM_BOT_TOKEN` - Telegram bot token
* `MINI_APP_URL` - URL of the mini app
* `NODE_ENV` - Environment (development/production)

## Render Deployment

Проект настроен для автоматического деплоя на Render через GitHub.

### 🚀 Быстрый старт (Blueprint)

1. В Render Dashboard: **New +** → **Blueprint**
2. Подключите GitHub репозиторий
3. Все сервисы создадутся автоматически из `render.yaml`
4. Настройте переменные окружения:
   - `TELEGRAM_BOT_TOKEN` (во всех сервисах)
   - `JWT_SECRET` (в API)

### Build Commands

**API:**
```bash
corepack enable && corepack prepare pnpm@8 --activate && pnpm install && cd apps/api && pnpm build
```

**Admin & Mini App:**
```bash
corepack enable && corepack prepare pnpm@8 --activate && pnpm install && cd apps/[admin|miniapp] && pnpm build
```

**Bot:**
```bash
corepack enable && corepack prepare pnpm@8 --activate && pnpm install && cd apps/bot && pnpm build
```

### Start Commands

**API:**
```bash
cd apps/api && pnpm db:migrate:deploy && pnpm start
```

**Admin & Mini App:**
```bash
cd apps/[admin|miniapp] && pnpm start
```

**Bot:**
```bash
cd apps/bot && pnpm start
```

### Health Check

API provides health check endpoint: `GET /health`

## Documentation

* [DEPLOY.md](./DEPLOY.md) - Detailed deployment guide
* [RENDER_SETUP.md](./RENDER_SETUP.md) - Quick Render setup
* [PLAN.md](./PLAN.md) - Development plan
* [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
* [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

## Features

### Admin Panel
- Product management (CRUD)
- Order management
- Banner management
- Page management
- Inventory tracking
- Sales statistics

### Mini App
- Telegram user integration
- Product catalog
- Shopping cart
- Order placement
- User profile

### Bot
- Commands (/start, /help, /catalog)
- Mini app integration
- Order notifications

## License

Private
