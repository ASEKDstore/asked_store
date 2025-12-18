# ASKED Store Bot

Telegram-бот для ASKED Store на Telegraf + TypeScript.

## Версия

**v0.2.1** — Bot: custom emoji support (capture IDs + templates)

**v0.2.0** — Telegram bot: /start + стартовое меню

## Установка и запуск

```bash
cd apps/bot
npm install
npm run dev
```

## Переменные окружения

Создайте файл `.env` в директории `apps/bot/` или установите переменные окружения в Render:

```env
BOT_TOKEN=8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M
WELCOME_VIDEO_URL=https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
TELEGRAM_CHANNEL_URL=https://t.me/asked_store
```

### Обязательные переменные:
- `BOT_TOKEN` — токен Telegram-бота (обязательно)

### Опциональные переменные:
- `WELCOME_VIDEO_URL` — URL видео для приветственного сообщения (по умолчанию используется тестовое видео)
- `TELEGRAM_CHANNEL_URL` — ссылка на телеграм-канал (по умолчанию: `https://t.me/asked_store`)

## Структура проекта

```
apps/bot/
  src/
    bot.ts              # Точка входа, создание и запуск бота
    config.ts           # Чтение переменных окружения
    handlers/
      start.ts          # Обработчик команды /start
      menu.ts           # Обработчики кнопок меню
    tools/
      emojiCapture.ts   # Инструмент для захвата ID кастомных эмодзи
    ui/
      emojiMap.ts       # Словарь custom_emoji_id
      sendWithCustomEmoji.ts  # Утилита для отправки сообщений с эмодзи
      statusMessages.ts # Шаблоны статусных сообщений
  package.json
  tsconfig.json
```

## Функциональность

### Команда /start

При получении команды `/start` бот:
1. Регистрирует/обновляет пользователя (пока только логирование, TODO: интеграция с backend)
2. Отправляет приветственное сообщение с:
3. Демонстрирует статусные сообщения с кастомными эмодзи (если настроены)

### Кастомные эмодзи

Бот поддерживает анимированные пользовательские смайлы Telegram Premium.

#### Как настроить:

1. **Включите режим захвата ID:**
   ```bash
   EMOJI_CAPTURE=1 npm run dev
   ```

2. **Отправьте боту сообщение с нужными анимированными эмодзи:**
   - Откройте Telegram
   - Выберите анимированный эмодзи из Premium-набора
   - Отправьте боту сообщение с этим эмодзи

3. **Скопируйте `custom_emoji_id` из консоли:**
   ```
   [EMOJI] id=5432109876543210123 offset=0 length=1 text="Запускаю ASKED LAB 🟢"
   💡 Сохрани этот ID в emojiMap.ts
   ```

4. **Вставьте ID в `src/ui/emojiMap.ts`:**
   ```typescript
   export const EMOJI = {
     gear: '5432109876543210123',  // ← вставьте сюда
     green: '1234567890123456789', // ← и сюда
     // ...
   }
   ```

5. **Перезапустите бота без флага `EMOJI_CAPTURE`:**
   ```bash
   npm run dev
   ```

6. **Проверьте работу:**
   - Отправьте `/start`
   - Бот отправит демо-сообщения с кастомными эмодзи

#### Использование в коде:

```typescript
import { status } from './ui/statusMessages.js'

// Отправка статусного сообщения
await status.appStarting(ctx.telegram, ctx.chat.id)
// Результат: "Приложение запускается {gear}" → с анимированным эмодзи

// Или напрямую через утилиту
import { sendWithEmoji } from './ui/sendWithCustomEmoji.js'
await sendWithEmoji(ctx.telegram, ctx.chat.id, 'Запускаю ASKED LAB {green}')
```

#### Fallback:

Если `custom_emoji_id` не заполнен в `emojiMap.ts`, бот автоматически использует обычные юникод-эмодзи:
- `{gear}` → ⚙️
- `{green}` → 🟢
- `{dots}` → ⏳
- `{ok}` → ✅
- `{heart}` → ❤️

## Функциональность

### Команда /start

При получении команды `/start` бот:
1. Регистрирует/обновляет пользователя (пока только логирование, TODO: интеграция с backend)
2. Отправляет приветственное сообщение с:
   - Видео сверху (из `WELCOME_VIDEO_URL` или локального файла)
   - Текстовым описанием (приветствие + информация о сервисе)
   - Inline-клавиатурой с кнопками меню

### Меню

- **🛒 Запустить приложение** — открывает веб-приложение (в разработке)
- **📦 Мои заказы** — отображает заказы пользователя (в разработке)
- **🧪 ASKED LAB** — управление кастомами и проектами (в разработке)
- **📢 Наш телеграм-канал** — ссылка на телеграм-канал

## Скрипты

- `npm run dev` — запуск в режиме разработки с hot-reload (tsx watch)
- `npm run build` — сборка TypeScript в JavaScript
- `npm start` — запуск собранного бота (требует предварительной сборки)

## TODO

- [ ] Интеграция с backend API для сохранения пользователей
- [ ] Реализация функционала "Мои заказы"
- [ ] Реализация функционала "ASKED LAB"
- [ ] Подключение веб-приложения через Web App
- [ ] Добавление локального видео-файла в `assets/welcome.mp4`

