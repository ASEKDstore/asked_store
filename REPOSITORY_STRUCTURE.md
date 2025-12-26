# Структура репозитория ASKED Store

## Текущее состояние (после очистки)

```
asked_store/
├── .git/                          # Git репозиторий
├── .github/                       # GitHub конфигурация
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   ├── ci.yml                # CI/CD workflow
│   │   └── deploy-render.yml     # Деплой на Render
│   └── pull_request_template.md
├── .gitignore                     # Игнорируемые файлы
├── .env.example                   # Пример переменных окружения
├── README.md                      # Основная документация
└── render.yaml                    # Конфигурация Render.com
```

## Файлы конфигурации

### `.gitignore`
Игнорирует:
- `node_modules/`, `dist/`, `build/`
- `.env`, `.env.local`
- IDE файлы (`.vscode/`, `.idea/`)
- Логи и временные файлы

### `render.yaml`
Конфигурация для деплоя на Render.com:
- **asked-store-backend** (Web Service)
  - rootDir: `apps/backend`
  - env: Node.js
  - Порты и env vars настроены
- **asked-store-frontend** (Static Site)
  - rootDir: `apps/frontend`
  - Использует Vite
- **asked-store-bot** (Background Worker)
  - rootDir: `apps/bot`
  - Telegram bot worker

### `.github/workflows/`
- `ci.yml` - CI/CD пайплайн
- `deploy-render.yml` - Автоматический деплой на Render

## Ожидаемая структура проекта (для разработки)

Проект должен быть организован как **монорепозиторий**:

```
asked_store/
├── packages/                      # Общие пакеты
│   ├── db/                        # Prisma schema + клиент
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   └── shared/                    # Общие типы и утилиты
│       ├── src/
│       │   ├── types.ts
│       │   └── schemas.ts
│       └── package.json
│
├── apps/                          # Приложения
│   ├── api/                       # Backend API (Express)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── webapp/                    # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── pages/
│   │   │   └── shared/
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── bot/                       # Telegram Bot (Telegraf)
│       ├── src/
│       │   ├── bot.ts
│       │   └── handlers/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                   # Корневой package.json (workspaces)
├── .env.example
├── .gitignore
├── README.md
└── render.yaml
```

## Переменные окружения

Базовые переменные (`.env.example`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/asked_store

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API
PORT=4000
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

# Frontend
VITE_API_URL=http://localhost:4000

# Bot
WEBAPP_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

## Технологии

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Bot**: Telegraf + TypeScript
- **Database**: PostgreSQL + Prisma
- **Deployment**: Render.com
- **Monorepo**: npm workspaces

## Следующие шаги

1. Создать структуру монорепозитория
2. Настроить npm workspaces
3. Настроить Prisma схему
4. Создать базовые приложения (api, webapp, bot)
5. Настроить локальную разработку
6. Настроить деплой на Render
