# ASKED Store v2

Монорепозиторий для ASKED Store с новой архитектурой.

## Структура проекта

```
.
├── packages/
│   ├── db/          # Prisma schema и клиент
│   └── shared/      # Общие типы и Zod схемы
├── apps/
│   ├── api/         # Express API сервер
│   ├── webapp/      # React WebApp (Vite)
│   └── bot/         # Telegram бот (Telegraf)
└── legacy/          # Старые версии приложений (архив)
```

## Требования

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (для базы данных)

## Настройка окружения

### 1. Переменные окружения

Создайте файл `.env` в корне проекта или установите переменные окружения:

```env
# База данных (обязательно)
DATABASE_URL=postgresql://user:password@localhost:5432/asked_store

# Telegram Bot Token (обязательно)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API сервер
PORT=4000
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
JWT_SECRET=your_jwt_secret_here  # Опционально, по умолчанию используется TELEGRAM_BOT_TOKEN
JWT_EXPIRES_IN=30d

# WebApp
VITE_API_URL=http://localhost:4000

# Bot
WEBAPP_URL=http://localhost:5173  # URL вашего WebApp
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

Генерация Prisma клиента:

```bash
npm run db:generate
```

Создание миграций:

```bash
npm run db:migrate
```

Для продакшена (Render, etc.):

```bash
npm run db:migrate:deploy
```

## Запуск в режиме разработки

### API сервер

```bash
npm run dev:api
```

Сервер будет доступен на `http://localhost:4000`

### WebApp

```bash
npm run dev:webapp
```

Приложение будет доступно на `http://localhost:5173`

### Bot

```bash
npm run dev:bot
```

## Сборка для продакшена

```bash
npm run build:api
npm run build:webapp
npm run build:bot
```

## API Endpoints

### GET /health

Проверка работоспособности сервера.

**Ответ:**
```json
{
  "ok": true
}
```

### POST /auth/telegram

Авторизация через Telegram WebApp initData.

**Тело запроса:**
```json
{
  "initData": "query=string&hash=..."
}
```

**Ответ:**
```json
{
  "ok": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "tgId": "123456789",
    "username": "username",
    "firstName": "First",
    "lastName": "Last"
  }
}
```

### GET /me

Получение информации о текущем пользователе (требует авторизации).

**Заголовки:**
```
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "tgId": "123456789",
    "username": "username",
    "firstName": "First",
    "lastName": "Last",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Структура базы данных

### TelegramUser

```prisma
model TelegramUser {
  id         String   @id @default(uuid())
  tgId       BigInt   @unique
  username   String?
  firstName  String?
  lastName   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Миграции

### Создание новой миграции

```bash
cd packages/db
npm run migrate:dev
```

### Применение миграций в продакшене

```bash
npm run db:migrate:deploy
```

### Prisma Studio (GUI для БД)

```bash
npm run db:studio
```

## Разработка

### Workspaces

Проект использует npm workspaces для управления зависимостями:

- `packages/db` - Prisma schema и клиент
- `packages/shared` - Общие типы и схемы
- `apps/api` - Express API
- `apps/webapp` - React приложение
- `apps/bot` - Telegram бот

### Добавление нового workspace

1. Создайте директорию в `packages/` или `apps/`
2. Добавьте `package.json` с уникальным именем
3. Запустите `npm install` для обновления workspaces

## Тестирование Telegram WebApp локально

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Установите `TELEGRAM_BOT_TOKEN` в переменные окружения
4. Запустите API сервер и WebApp
5. Используйте [@BotFather](https://t.me/BotFather) для установки WebApp URL
6. Откройте бота в Telegram и используйте команду /start

## Деплой

### Render.com

Конфигурация для Render находится в `render.yaml`. Обновите пути:

- `apps/api` → API сервер
- `apps/webapp` → Static Site
- `apps/bot` → Background Worker

Не забудьте установить все необходимые переменные окружения в настройках каждого сервиса.

## Легаси код

Старые версии приложений находятся в `legacy/`:

- `legacy/backend/` - старая версия backend
- `legacy/frontend/` - старая версия frontend

Они сохранены для справки и не используются в новой архитектуре.
