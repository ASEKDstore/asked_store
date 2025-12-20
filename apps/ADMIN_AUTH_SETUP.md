# Инструкция по настройке авторизации админки

## Backend (Render)

### 1. Переменные окружения

В Render Dashboard → Backend Service → Environment добавьте:

```
TELEGRAM_ADMIN_IDS=930749603
JWT_SECRET=<ваш_секретный_ключ_для_jwt>
BOT_TOKEN=<токен_телеграм_бота>
```

**Важно:**
- `TELEGRAM_ADMIN_IDS` - строка с ID админов через запятую: `"930749603"` или `"930749603,123456789"`
- `JWT_SECRET` - секретный ключ для подписи JWT токенов (можно использовать случайную строку)
- `BOT_TOKEN` - токен Telegram бота

### 2. Проверка после деплоя

После деплоя проверьте логи:
- Должны быть логи `[AUTH] user { tgId: 930749603, role: 'admin' }`
- При доступе к `/api/admin/*` должны быть логи `[ADMIN] Access granted`

## Frontend

### 1. Переменные окружения

В Render Dashboard → Frontend Service → Environment:

```
VITE_BACKEND_URL=https://your-backend.onrender.com
```

## Проверка в Telegram WebApp

### 1. Откройте Mini App через бота

1. Откройте Telegram бота
2. Нажмите кнопку "Open" или используйте команду `/start`
3. Mini App должен открыться

### 2. Проверка авторизации

**В консоли браузера (DevTools → Console) должны быть логи:**

```
[ASKED BOOT] auth_request https://...
[ASKED BOOT] auth_response status 200
[ASKED BOOT] auth_response text {"ok":true,"token":"...","role":"admin",...}
[ASKED BOOT] auth_ok
```

### 3. Проверка доступа к админке

1. Перейдите на `/app/admin` (или используйте кнопку в меню)
2. Должна загрузиться админ-панель
3. В Network tab (DevTools → Network) запросы к `/api/admin/*` должны возвращать `200 OK`

**Если видите 401/403:**
- Проверьте, что `TELEGRAM_ADMIN_IDS=930749603` установлен на backend
- Проверьте, что token сохраняется в localStorage (DevTools → Application → Local Storage → `asked_telegram_token`)
- Проверьте логи backend на наличие `[AUTH] user { tgId: 930749603, role: 'admin' }`

### 4. Проверка экрана "Сессия истекла"

Если токен истек или невалиден:

1. Должен появиться экран "Сессия истекла"
2. Кнопка "Повторить авторизацию" должна:
   - Выполнить POST `/api/auth/telegram`
   - Сохранить новый token
   - Вернуть на предыдущую страницу (или `/app/admin` если был админ)
3. Кнопка "Вернуться на главную" должна перейти на `/app`

**В консоли должны быть логи:**
```
[ASKED SESSION] CLICK_REAUTH
[ASKED SESSION] REAUTH_START
[ASKED SESSION] REAUTH_OK { tokenLength: ..., role: 'admin' }
```

## Диагностика проблем

### Проблема: 401 Missing authorization

**Причины:**
- Token не сохраняется в localStorage
- Token не отправляется в заголовке `Authorization: Bearer <token>`

**Решение:**
- Проверьте, что `apiClient` используется для всех запросов
- Проверьте localStorage: `localStorage.getItem('asked_telegram_token')`

### Проблема: 403 Admin access required

**Причины:**
- `TELEGRAM_ADMIN_IDS` не содержит ваш ID
- Role в JWT токене не равен `'admin'`

**Решение:**
- Проверьте `TELEGRAM_ADMIN_IDS=930749603` на backend
- Переавторизуйтесь (удалите token из localStorage и перезагрузите страницу)

### Проблема: Кнопки не работают

**Причины:**
- Элементы перекрыты другими слоями
- Ошибки JavaScript в консоли

**Решение:**
- Проверьте консоль на ошибки
- Проверьте, что `pointer-events: auto` установлен для кнопок
- Проверьте z-index элементов

## Логи для отладки

### Backend логи:
- `[AUTH] user { tgId, role }` - успешная авторизация
- `[AUTH] Missing authorization` - отсутствует JWT токен
- `[AUTH] Invalid or expired token` - токен невалиден или истек
- `[ADMIN] Access granted { tgId, role }` - доступ к админке разрешен
- `[ADMIN] Access denied { tgId, role }` - доступ к админке запрещен

### Frontend логи:
- `[ASKED BOOT] auth_request` - начало авторизации при загрузке
- `[ASKED BOOT] auth_ok` - успешная авторизация
- `[ASKED API] 401 -> reauth start` - начало повторной авторизации
- `[ASKED API] reauth ok` - успешная повторная авторизация
- `[ASKED API] reauth fail` - ошибка повторной авторизации
- `[ASKED SESSION] CLICK_REAUTH` - клик по кнопке "Повторить авторизацию"
- `[ASKED SESSION] REAUTH_OK` - успешная авторизация через экран "Сессия истекла"

