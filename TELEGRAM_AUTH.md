# Telegram WebApp Authentication

## Как проверить, что Telegram user.id приходит

### 1. Через Dev Tools (в браузере)

1. Откройте Mini App через кнопку в боте
2. Откройте DevTools (F12)
3. В консоли выполните:
   ```javascript
   console.log('TG WebApp:', window.Telegram?.WebApp)
   console.log('TG User:', window.Telegram?.WebApp?.initDataUnsafe?.user)
   console.log('TG initData:', window.Telegram?.WebApp?.initData)
   ```

4. Должны увидеть:
   - `window.Telegram.WebApp` - объект WebApp
   - `initDataUnsafe.user.id` - ваш Telegram ID (число)
   - `initData` - строка с данными для валидации

### 2. Через Dev Overlay (в приложении)

1. В dev режиме (`import.meta.env.DEV === true`) или при `?debug=1` в URL
2. В правом нижнем углу появится кнопка "🔍 Диагностика"
3. Нажмите на неё - увидите:
   - `hasTelegram` - есть ли объект `window.Telegram`
   - `hasWebApp` - есть ли `window.Telegram.WebApp`
   - `initDataLen` - длина initData строки
   - `hasUser` - есть ли `initDataUnsafe.user`
   - `tgId` - ваш Telegram ID

### 3. Через консоль UserContext

В dev режиме в консоли браузера будут логи:
```
[UserContext] TG initDataUnsafe: {...}
[UserContext] TG initData: user=...&hash=...
[UserContext] User authenticated via backend: {...}
```

## Почему по прямой ссылке будет Guest screen

Если открыть Mini App по прямой ссылке (например, `https://asked-store-frontend.onrender.com/` в браузере), то:

1. **Нет Telegram WebApp контекста** - `window.Telegram?.WebApp` будет `undefined`
2. **Нет initData** - Telegram не передаёт данные авторизации
3. **Приложение покажет экран "Открой через бота"** (`/telegram-required`)

Это **нормальное поведение** - Mini App должен открываться только через кнопку в боте, чтобы Telegram передал WebApp контекст.

## Как работает авторизация

### Frontend (UserContext)

1. При загрузке приложения `UserContext` проверяет наличие `window.Telegram?.WebApp`
2. Если есть - вызывает `wa.ready()` и `wa.expand()`
3. Читает `initDataUnsafe.user` и `initData`
4. **Отправляет `initData` на backend** (`POST /api/auth/telegram`) для валидации
5. Backend проверяет hash и возвращает валидированные данные пользователя
6. Frontend сохраняет пользователя в контексте

### Backend (/api/auth/telegram)

1. Принимает `initData` (строка из `tg.initData`)
2. **Валидирует hash**:
   - Создаёт `data_check_string` из параметров (без hash)
   - Вычисляет `HMAC-SHA256` с секретом `SHA256(botToken)`
   - Сравнивает с hash из initData
3. **Проверяет auth_date** (не старше 24 часов)
4. Парсит `user` из initData
5. Сохраняет/обновляет пользователя в БД (`telegramSubscriber`)
6. Возвращает данные пользователя

### Безопасность

- **Никогда не доверяем `initDataUnsafe` на бэке** - только `initData` + проверка hash
- **Hash валидация обязательна** - без неё любой может подделать данные
- **auth_date проверка** - защита от устаревших токенов
- При невалидном initData возвращается `401` - на фронте показывается fallback на `initDataUnsafe` (только в dev)

## Troubleshooting

### Проблема: "Гость" и Telegram ID = 0

**Причины:**
1. Mini App открыт не через кнопку в боте (прямая ссылка)
2. Бот не использует `web_app` кнопку (использует `url`)
3. Telegram WebApp не инициализирован

**Решение:**
1. Убедитесь, что бот использует `Markup.button.webApp()` (не `url`)
2. Откройте через команду `/start` в боте
3. Проверьте в DevTools: `window.Telegram?.WebApp` должен существовать

### Проблема: Backend возвращает 401

**Причины:**
1. Неверный hash (initData подделан)
2. Устаревший auth_date (> 24 часов)
3. Неверный BOT_TOKEN в env

**Решение:**
1. Проверьте `BOT_TOKEN` в env переменных backend
2. Перезапустите Mini App через кнопку в боте (получите свежий initData)
3. Проверьте логи backend для деталей ошибки

### Проблема: initData пустой

**Причина:** Mini App открыт через "Open with URL" вместо Web App кнопки

**Решение:** Используйте только кнопку `web_app` в боте, не обычные ссылки

## Структура файлов

- `backend/src/routes/auth.ts` - эндпоинт валидации initData
- `frontend/src/context/UserContext.tsx` - инициализация Telegram и отправка на backend
- `frontend/src/pages/TelegramRequiredScreen.tsx` - экран "Открой через бота"
- `frontend/src/pages/LoadingScreen.tsx` - проверка Telegram контекста
- `bot/src/bot.ts` - кнопка `web_app` для открытия Mini App

