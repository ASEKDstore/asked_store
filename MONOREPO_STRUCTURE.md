# Структура монорепозитория ASKED Store

## Зафиксированная структура

### Директории приложений (apps/)
```
apps/
├── api/          # Backend API (Express + TypeScript)
├── webapp/       # Telegram Mini App (React + Vite + TypeScript)
└── bot/          # Telegram Bot (Telegraf + TypeScript)
```

### Директории пакетов (packages/)
```
packages/
├── db/           # Prisma schema + клиент
└── shared/       # Общие типы, схемы, контракты
```

## Конфигурация Render.com

В `render.yaml` используются следующие пути:

### Backend API Service
- **rootDir**: `.` (корень репозитория)
- **buildCommand**: `npm ci && npm run build:api`
- **startCommand**: `npm run start:api`
- Ожидает workspace: `@asked-store/api`

### Frontend Static Site
- **rootDir**: `.` (корень репозитория)
- **buildCommand**: `npm ci && npm run build:webapp`
- **staticPublishPath**: `apps/webapp/dist`
- Ожидает workspace: `@asked-store/webapp`

### Bot Background Worker
- **rootDir**: `.` (корень репозитория)
- **buildCommand**: `npm ci && npm run build:bot`
- **startCommand**: `npm run start:bot`
- Ожидает workspace: `@asked-store/bot`

## Имена workspace

В `package.json` должны быть зарегистрированы следующие workspace:

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

Имена пакетов (должны быть в соответствующих `package.json`):
- `@asked-store/api` - в `apps/api/package.json`
- `@asked-store/webapp` - в `apps/webapp/package.json`
- `@asked-store/bot` - в `apps/bot/package.json`
- `@asked-store/db` - в `packages/db/package.json`
- `@asked-store/shared` - в `packages/shared/package.json`

## Корневые команды

В корневом `package.json` определены следующие команды:

- `npm run build:api` - сборка backend API
- `npm run build:webapp` - сборка frontend
- `npm run build:bot` - сборка bot
- `npm run start:api` - запуск backend API
- `npm run start:bot` - запуск bot
- `npm run dev:api` - разработка backend API
- `npm run dev:webapp` - разработка frontend
- `npm run dev:bot` - разработка bot
- `npm run db:generate` - генерация Prisma клиента
- `npm run db:migrate` - миграции БД
- `npm run db:migrate:deploy` - деплой миграций (production)

## Важные замечания

1. **Нет директорий `apps/backend` или `apps/frontend`** - используются только `apps/api` и `apps/webapp`
2. **Все пути относительны к корню репозитория** - Render использует `rootDir: .`
3. **Frontend собирается в `apps/webapp/dist`** - это указано в `staticPublishPath`
4. **Все сервисы используют npm workspaces** - зависимости устанавливаются один раз в корне

## Проверка структуры

Для проверки корректности структуры выполните:

```bash
# Проверка директорий
test -d apps/api && echo "✅ apps/api exists" || echo "❌ apps/api missing"
test -d apps/webapp && echo "✅ apps/webapp exists" || echo "❌ apps/webapp missing"
test -d apps/bot && echo "✅ apps/bot exists" || echo "❌ apps/bot missing"
test -d packages/db && echo "✅ packages/db exists" || echo "❌ packages/db missing"
test -d packages/shared && echo "✅ packages/shared exists" || echo "❌ packages/shared missing"

# Проверка package.json имен
grep -q '"name": "@asked-store/api"' apps/api/package.json && echo "✅ api package name correct" || echo "❌ api package name incorrect"
grep -q '"name": "@asked-store/webapp"' apps/webapp/package.json && echo "✅ webapp package name correct" || echo "❌ webapp package name incorrect"
grep -q '"name": "@asked-store/bot"' apps/bot/package.json && echo "✅ bot package name correct" || echo "❌ bot package name incorrect"
```

## История изменений

- **v1.0.0** (2025-01-XX): Изначальная фиксация структуры
  - Определены пути: `apps/api`, `apps/webapp`, `apps/bot`
  - Определены пакеты: `packages/db`, `packages/shared`
  - Зафиксированы команды сборки и деплоя

