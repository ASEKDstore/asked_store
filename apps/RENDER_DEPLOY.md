# Деплой на Render - Инструкция

## Структура проекта

Монорепо с тремя сервисами:
- `apps/backend` - Node.js API сервер
- `apps/frontend` - React SPA приложение
- `apps/bot` - Telegram бот (Background Worker)

## Быстрый старт

### Вариант 1: Использование render.yaml (Рекомендуется)

1. **Подключите репозиторий к Render:**
   - Зайдите на [Render Dashboard](https://dashboard.render.com)
   - Нажмите "New" → "Blueprint"
   - Подключите ваш Git репозиторий
   - Render автоматически обнаружит `render.yaml` и создаст все 3 сервиса

2. **Настройте секретные переменные окружения:**
   
   В настройках каждого сервиса добавьте:
   
   **Backend (`asked-store-backend`):**
   - `TELEGRAM_BOT_TOKEN` - токен бота от @BotFather
   - `ALLOWED_ORIGINS` (опционально) - список разрешенных доменов через запятую
   
   **Frontend (`asked-store-frontend`):**
   - `VITE_API_BASE` устанавливается автоматически из Backend сервиса
   
   **Bot (`asked-store-bot`):**
   - `TELEGRAM_BOT_TOKEN` - тот же токен, что и для Backend
   - `BACKEND_URL` устанавливается автоматически из Backend сервиса

3. **Настройте Persistent Disk для Backend:**
   - В настройках Backend сервиса перейдите в "Disks"
   - Убедитесь, что диск `asked-data` подключен к `apps/backend/data`
   - Это необходимо для сохранения данных JSON базы данных

4. **Дождитесь деплоя:**
   - Render автоматически соберет и задеплоит все сервисы
   - Backend: `https://asked-store-backend.onrender.com`
   - Frontend: `https://asked-store-frontend.onrender.com`
   - Bot будет работать как Background Worker

### Вариант 2: Ручной деплой

#### 1. Backend (Web Service)

- **Name:** `asked-store-backend`
- **Root Directory:** `apps/backend`
- **Environment:** `Node`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

**Переменные окружения:**
- `NODE_ENV=production` (устанавливается автоматически)
- `TELEGRAM_BOT_TOKEN` (секрет)
- `ALLOWED_ORIGINS` (опционально)

**Persistent Disk:**
- Создайте диск с именем `asked-data`
- Mount Path: `apps/backend/data`

#### 2. Frontend (Static Site)

- **Name:** `asked-store-frontend`
- **Root Directory:** `apps/frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

**Переменные окружения:**
- `VITE_API_BASE=https://your-backend-service.onrender.com`
  - Замените `your-backend-service` на имя вашего Backend сервиса

#### 3. Bot (Background Worker)

- **Name:** `asked-store-bot`
- **Root Directory:** `apps/bot`
- **Environment:** `Node`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

**Переменные окружения:**
- `TELEGRAM_BOT_TOKEN` (секрет)
- `BACKEND_URL=https://your-backend-service.onrender.com`
- `TELEGRAM_CHANNEL_URL` (опционально, по умолчанию `https://t.me/asked_store`)

## Важные замечания

### Бот должен быть админом канала

Для работы бота с каналом `@asked_store`:
1. Добавьте бота в канал как администратора
2. Дайте боту права на отправку сообщений

### Persistent Storage

Backend использует JSON файлы для хранения данных. На Render это требует Persistent Disk:
- Диск должен быть подключен к `apps/backend/data`
- Без диска данные будут теряться при каждом деплое

### CORS

Если нужно ограничить CORS:
- Установите переменную `ALLOWED_ORIGINS` в Backend
- Формат: `https://frontend1.onrender.com,https://frontend2.vercel.app`

## Проверка деплоя

### Backend
- Health check: `https://your-backend.onrender.com/health`
- API: `https://your-backend.onrender.com/api/health`

### Frontend
- Откройте URL вашего Static Site
- Проверьте консоль браузера (F12) - не должно быть ошибок подключения к API

### Bot
- Проверьте логи в Render Dashboard
- Отправьте `/start` боту в Telegram
- Бот должен ответить

## Обновление

Render автоматически обновляет сервисы при пуше в основную ветку.

Для ручного обновления:
1. Зайдите в Dashboard сервиса
2. Нажмите "Manual Deploy" → "Deploy latest commit"

## Troubleshooting

### Backend не запускается
- Проверьте логи в Render Dashboard
- Убедитесь, что `TELEGRAM_BOT_TOKEN` установлен
- Проверьте, что Persistent Disk подключен

### Frontend не подключается к Backend
- Проверьте переменную `VITE_API_BASE` в настройках Frontend
- Убедитесь, что URL Backend правильный (с `https://`)
- Проверьте CORS настройки в Backend

### Bot не работает
- Проверьте, что `TELEGRAM_BOT_TOKEN` установлен
- Убедитесь, что бот добавлен как администратор канала
- Проверьте логи в Render Dashboard

### Данные теряются
- Убедитесь, что Persistent Disk подключен к Backend
- Проверьте, что mount path правильный: `apps/backend/data`

