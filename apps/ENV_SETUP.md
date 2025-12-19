# Настройка переменных окружения

## Токен Telegram бота

**Токен:** `8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M`

### Где нужно добавить токен:

#### 1. Локальная разработка

**Создайте файл `apps/backend/.env`:**
```env
BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
DATABASE_URL=postgresql://user:password@localhost:5432/asked_store
FRONTEND_URL=http://localhost:5173
```

**Создайте файл `apps/bot/.env`:**
```env
BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
BACKEND_URL=http://localhost:4000
WEBAPP_URL=http://localhost:5173
```

#### 2. На Render (продакшн)

**Backend Service (`asked-store-backend`):**
1. Откройте сервис в Render Dashboard
2. Environment → Add Environment Variable
3. Key: `TELEGRAM_BOT_TOKEN` (или `BOT_TOKEN`)
4. Value: `8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M`
5. Type: Secret

**Bot Worker (`asked-store-bot`):**
1. Откройте сервис в Render Dashboard
2. Environment → Add Environment Variable
3. Key: `TELEGRAM_BOT_TOKEN` (или `BOT_TOKEN`)
4. Value: `8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M`
5. Type: Secret

### Файлы, где используется токен:

**Backend:**
- `src/routes/auth.ts` - валидация initData
- `src/routes/admin/telegram.ts` - отправка постов
- `src/services/telegramNotify.ts` - уведомления
- `src/routes/telegram.ts` - обработка callback

**Bot:**
- `src/config.ts` - основная конфигурация
- `src/bot.ts` - создание экземпляра бота

### Быстрая настройка (Windows PowerShell):

```powershell
# Backend
@"
BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
DATABASE_URL=postgresql://user:password@localhost:5432/asked_store
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath "apps\backend\.env" -Encoding utf8

# Bot
@"
BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
BACKEND_URL=http://localhost:4000
WEBAPP_URL=http://localhost:5173
"@ | Out-File -FilePath "apps\bot\.env" -Encoding utf8
```

