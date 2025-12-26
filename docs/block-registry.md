# Block Registry - ASKED Store

## Правила версионирования и изменений

### Обязательные правила

1. **Semantic Versioning (Semver)**
   - Любое изменение блока = bump версии
   - MAJOR.MINOR.PATCH формат
   - MAJOR: Breaking changes (изменение API, удаление функциональности)
   - MINOR: Новые функции (backward compatible)
   - PATCH: Исправления багов (backward compatible)

2. **Rollback Strategy**
   - Каждое изменение блока ДОЛЖНО иметь описанную стратегию rollback
   - Rollback должен быть выполним и безопасен
   - При критических изменениях - обязательна проверка rollback перед деплоем

3. **Регистрация изменений**
   - Все изменения блоков регистрируются в этом файле
   - Каждая версия должна иметь запись с описанием изменений
   - Указывается дата изменения и автор (опционально)

---

## Реестр блоков

### RepoStructureAlign / infra/repo / 1.0.0

**Категория**: Infrastructure / Repository  
**Версия**: 1.0.0  
**Статус**: ✅ Completed  
**Дата**: 2025-01-XX

#### Назначение
Фиксация и выравнивание структуры монорепозитория для ASKED Store.

#### Описание
Блок обеспечивает единообразную структуру монорепозитория:
- Определение директорий приложений (`apps/api`, `apps/webapp`, `apps/bot`)
- Определение директорий пакетов (`packages/db`, `packages/shared`)
- Конфигурация npm workspaces
- Документирование ожидаемой структуры

#### Детали реализации
- Корневой `package.json` с workspaces: `packages/*`, `apps/*`
- Команды сборки: `build:api`, `build:webapp`, `build:bot`
- Команды запуска: `start:api`, `start:bot`
- Команды разработки: `dev:api`, `dev:webapp`, `dev:bot`
- Команды БД: `db:generate`, `db:migrate`, `db:migrate:deploy`

#### Зависимости
- Нет (базовый блок инфраструктуры)

#### Изменения
- **v1.0.0** (2025-01-XX): Первоначальная фиксация структуры монорепозитория

#### Rollback Strategy
- **Риск**: Низкий (только структура и конфигурация)
- **Rollback**: Откат к предыдущей структуре через git revert
- **Процедура**:
  ```bash
  git revert <commit-hash>
  npm install  # Переустановка зависимостей
  ```

---

### RenderAutoDeploy / infra/cicd / 1.0.0

**Категория**: Infrastructure / CI/CD  
**Версия**: 1.0.0  
**Статус**: ✅ Completed  
**Дата**: 2025-01-XX

#### Назначение
Настройка автоматического деплоя всех сервисов на Render.com из монорепозитория.

#### Описание
Блок обеспечивает автоматический деплой трех сервисов:
- Backend API (`asked-store-backend`)
- Frontend Static Site (`asked-store-frontend`)
- Telegram Bot Worker (`asked-store-bot`)

#### Детали реализации
- Файл `render.yaml` в корне репозитория
- `rootDir: .` для всех сервисов
- `buildCommand` и `startCommand` используют npm workspaces скрипты из корневого `package.json`
- Автоматическая синхронизация URL между сервисами Render
- Использование `property: url` для web services и `property: host` с `https://${host}` для static_site
- Автоматический запуск миграций БД перед стартом backend (`db:migrate:deploy` в `startCommand`)

#### Зависимости
- RepoStructureAlign v1.0.0

#### Изменения
- **v1.0.0** (2025-01-XX): Первоначальная настройка автодеплоя на Render.com
- **v1.0.1** (2025-01-XX): Добавлен `db:migrate:deploy` в `startCommand` для backend сервиса

#### Rollback Strategy
- **Риск**: Средний (может повлиять на доступность сервисов)
- **Rollback**: Откат к предыдущей версии `render.yaml` через git revert или ручной откат через Render Dashboard.
- **Процедура**:
  ```bash
  git revert <commit-hash>
  # В случае проблем, вручную откатить деплой на Render.com через панель управления
  ```

---

### TelegramInitAuth / core/auth / 1.0.0

**Категория**: Core / Authentication  
**Версия**: 1.0.0  
**Статус**: ✅ Completed  
**Дата**: 2025-01-XX

#### Назначение
Аутентификация пользователей через Telegram WebApp initData с валидацией подписи и выдачей JWT токенов.

#### Описание
Блок реализует полный цикл аутентификации:
- Валидация подписи Telegram WebApp `initData` по Bot Token
- Upsert пользователя в БД по `telegramId`
- Выдача JWT токена с информацией о пользователе
- RBAC заглушка (роли по умолчанию "user", админы через seed/ручную выдачу в БД)
- Health check endpoint

#### Детали реализации

**Endpoints:**
- `GET /health` - Health check (работает даже при недоступности БД)
- `POST /auth/telegram` - Аутентификация через Telegram initData

**Валидация подписи:**
- Использует официальный алгоритм Telegram (HMAC SHA-256)
- Секретный ключ генерируется из Bot Token через `crypto.createHmac('sha256', 'WebAppData')`
- Валидирует hash из initData параметров

**База данных:**
- Модель `TelegramUser` с полями: `id`, `tgId` (BigInt, unique), `username`, `firstName`, `lastName`, `role` (default: "user"), `createdAt`, `updatedAt`
- Индексы на `tgId` и `role`
- Upsert по `tgId` (обновляет только username/firstName/lastName, роль не обновляется автоматически)

**JWT токены:**
- Payload содержит: `tgId`, `userId`, `role`
- Срок действия настраивается через `JWT_EXPIRES_IN` (по умолчанию: 7 дней)
- Секретный ключ из `JWT_SECRET` env variable

**RBAC:**
- Роли хранятся в поле `role` модели `TelegramUser`
- По умолчанию все пользователи получают роль "user"
- Админы назначаются вручную в БД или через seed скрипт
- Middleware `requireAuth` проверяет JWT и добавляет `req.user` с payload токена

**Файлы:**
- `apps/api/src/routes/auth.ts` - POST /auth/telegram endpoint
- `apps/api/src/routes/health.ts` - GET /health endpoint
- `apps/api/src/utils/telegramAuth.ts` - Валидация initData подписи
- `apps/api/src/utils/jwt.ts` - Генерация и верификация JWT
- `apps/api/src/middleware/requireAuth.ts` - JWT authentication middleware
- `apps/api/src/middleware/errorHandler.ts` - Unified error handler
- `packages/db/prisma/schema.prisma` - Prisma schema с моделью TelegramUser
- `packages/shared/src/types.ts` - Shared types (AuthResponse, UserProfile, JWTPayload)
- `packages/shared/src/schemas.ts` - Zod schemas для валидации

#### Зависимости
- RepoStructureAlign v1.0.0
- RenderAutoDeploy v1.0.0

#### Переменные окружения

**Обязательные:**
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Telegram bot token для валидации подписи
- `JWT_SECRET` - Секретный ключ для подписи JWT токенов

**Опциональные:**
- `JWT_EXPIRES_IN` - Срок действия JWT токена (по умолчанию: "7d")
- `CORS_ORIGINS` - Разрешенные CORS origins (через запятую, по умолчанию: "*")
- `PORT` - Порт API сервера (по умолчанию: 4000)

#### Изменения
- **v1.0.0** (2025-01-XX): Первоначальная реализация Telegram аутентификации

#### Rollback Strategy
- **Риск**: Высокий (критичный блок аутентификации)
- **Rollback**: 
  1. Откат изменений через git revert
  2. Откат миграций БД (если были изменения схемы): `prisma migrate resolve --rolled-back <migration-name>`
  3. Перезапуск API сервиса на Render
- **Процедура**:
  ```bash
  git revert <commit-hash>
  # На Render: manual redeploy через Dashboard
  ```
- **Важные замечания**:
  - Откат не повлияет на существующие пользователи в БД
  - Существующие JWT токены останутся валидными до истечения срока действия (если JWT_SECRET не изменился)
  - При изменении JWT_SECRET все существующие токены станут невалидными

---

