# ASKED Store

**Version:** v0.2.0  
**Step 0:** Reset + каркас проекта  
**Step 1:** Telegram bot: /start + стартовое меню

---

## 📦 Монорепозиторий

ASKED Store — монорепозиторий для магазина ASKED, состоящий из трёх основных приложений:

- **Frontend** — веб-интерфейс (Vite + React + TypeScript)
- **Backend** — API сервер (Express + TypeScript)
- **Bot** — Telegram бот (Telegraf + TypeScript)

Общие типы и утилиты находятся в папке `shared`.

---

## 🚀 Быстрый старт

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

### Backend

```bash
cd apps/backend
npm install
npm run dev
```

Backend будет доступен на `http://localhost:4000`

Health check: `http://localhost:4000/health`

### Bot

```bash
cd apps/bot
npm install
```

Создайте файл `.env` в папке `apps/bot` или установите переменные окружения:

```env
BOT_TOKEN=your_bot_token_here
# Опционально:
WEB_APP_URL=https://your-web-app-url.com
TELEGRAM_CHANNEL_URL=https://t.me/your_channel
WELCOME_VIDEO_URL=https://your-video-url.mp4
```

Запустите бота:

```bash
npm run dev
```

Бот ответит на команду `/start` красивым сообщением с видео, приветствием и меню кнопок.

**Обработчики меню:**
- 🛒 Запустить приложение — открывает веб-приложение
- 📦 Мои заказы — раздел заказов (в разработке)
- 🧪 ASKED LAB — управление кастомами (в разработке)
- 📢 Наш телеграм-канал — ссылка на канал

---

## 📁 Структура проекта

```
ASKEDS/
├── apps/
│   ├── frontend/     # Vite + React + TypeScript
│   ├── backend/      # Express + TypeScript
│   └── bot/          # Telegraf + TypeScript
├── shared/           # Общие типы и утилиты
│   ├── types/
│   └── utils/
├── .env.example      # Пример переменных окружения
├── .gitignore
├── README.md
└── render.yaml       # Конфигурация Render для деплоя
```

---

## 🔧 Технологии

- **Frontend:** Vite, React, TypeScript
- **Backend:** Express, TypeScript, CORS
- **Bot:** Telegraf, TypeScript
- **Language:** TypeScript

---

## 📝 Версионирование

Проект использует семантическое версионирование (vX.Y.Z):

- **v0.1.0** — Step 0: Reset + каркас проекта
- **v0.2.0** — Step 1: Telegram bot: /start + стартовое меню

---

## 🌐 Деплой

Конфигурация для Render находится в `render.yaml`.

---

## 📄 Лицензия

Проект закрытый; лицензия не выбрана.
