# Деплой на Render

Инструкция по деплою ASKED Store на Render.

## Структура проекта

Проект состоит из двух основных сервисов:
- **Backend** (`backend/`) - Node.js API сервер
- **Frontend** (`frontend/`) - React SPA приложение

## Быстрый старт

### Вариант 1: Использование render.yaml (Рекомендуется)

1. **Подключите репозиторий к Render:**
   - Зайдите на [Render Dashboard](https://dashboard.render.com)
   - Нажмите "New" → "Blueprint"
   - Подключите ваш Git репозиторий
   - Render автоматически обнаружит `render.yaml` и создаст оба сервиса

2. **Настройте переменные окружения:**
   - Backend автоматически получит `PORT` от Render
   - Frontend автоматически получит `VITE_API_URL` от Backend сервиса

3. **Дождитесь деплоя:**
   - Render автоматически соберет и задеплоит оба сервиса
   - Backend будет доступен по адресу: `https://asked-store-backend.onrender.com`
   - Frontend будет доступен по адресу: `https://asked-store-frontend.onrender.com`

### Вариант 2: Ручной деплой

#### Backend

1. **Создайте Web Service:**
   - Нажмите "New" → "Web Service"
   - Подключите репозиторий
   - Настройки:
     - **Name:** `asked-store-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`

2. **Переменные окружения:**
   - `NODE_ENV=production`
   - `PORT` устанавливается автоматически Render

#### Frontend

1. **Создайте Static Site:**
   - Нажмите "New" → "Static Site"
   - Подключите репозиторий
   - Настройки:
     - **Name:** `asked-store-frontend`
     - **Root Directory:** `frontend`
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`

2. **Переменные окружения:**
   - `VITE_API_URL=https://your-backend-service.onrender.com`
     - Замените `your-backend-service` на имя вашего Backend сервиса

## Переменные окружения

### Backend

| Переменная | Описание | Обязательно | По умолчанию |
|------------|----------|-------------|--------------|
| `PORT` | Порт сервера | Нет | `4000` (Render устанавливает автоматически) |
| `NODE_ENV` | Окружение | Нет | `production` |

### Frontend

| Переменная | Описание | Обязательно | По умолчанию |
|------------|----------|-------------|--------------|
| `VITE_API_URL` | URL Backend API | Нет | `http://localhost:4000` |

## Проверка деплоя

### Backend

После деплоя проверьте:
- Health check: `https://your-backend.onrender.com/health`
- API: `https://your-backend.onrender.com/api/health`

### Frontend

После деплоя:
- Откройте URL вашего Static Site
- Проверьте, что приложение загружается
- Откройте консоль браузера (F12) и убедитесь, что нет ошибок подключения к API

## Обновление деплоя

Render автоматически обновляет сервисы при пуше в основную ветку (обычно `main` или `master`).

Для ручного обновления:
1. Зайдите в Dashboard сервиса
2. Нажмите "Manual Deploy" → "Deploy latest commit"

## Troubleshooting

### Backend не запускается

1. Проверьте логи в Render Dashboard
2. Убедитесь, что `build` команда выполняется успешно
3. Проверьте, что `start` команда правильная

### Frontend не подключается к Backend

1. Проверьте переменную `VITE_API_URL` в настройках Frontend сервиса
2. Убедитесь, что URL Backend правильный (с `https://`)
3. Проверьте CORS настройки в Backend (должен быть включен)

### Ошибки сборки

1. Проверьте, что все зависимости установлены
2. Убедитесь, что Node.js версия совместима (рекомендуется 18+)
3. Проверьте логи сборки в Render Dashboard

## Дополнительные настройки

### Custom Domain

Для подключения собственного домена:
1. Зайдите в настройки сервиса
2. Перейдите в "Custom Domains"
3. Добавьте ваш домен
4. Настройте DNS записи согласно инструкциям Render

### Environment Variables

Для добавления дополнительных переменных окружения:
1. Зайдите в настройки сервиса
2. Перейдите в "Environment"
3. Добавьте нужные переменные
4. Перезапустите сервис

## Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что сервисы запущены и доступны

