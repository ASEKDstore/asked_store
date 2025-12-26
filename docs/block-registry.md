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
- Backend API Service (web)
- Frontend Static Site (static_site)
- Bot Background Worker (worker)

Все сервисы деплоятся из одного репозитория с использованием npm workspaces.

#### Детали реализации
- Файл `render.yaml` в корне репозитория
- Конфигурация трех сервисов:
  - `asked-store-backend`: rootDir `.`, buildCommand `npm ci && npm run build:api`
  - `asked-store-frontend`: rootDir `.`, buildCommand `npm ci && npm run build:webapp`, staticPublishPath `apps/webapp/dist`
  - `asked-store-bot`: rootDir `.`, buildCommand `npm ci && npm run build:bot`
- Синхронизация переменных окружения между сервисами
- Использование `property: url` для web services
- Использование `property: host` для static_site

#### Зависимости
- **RepoStructureAlign v1.0.0** - требует правильной структуры репозитория

#### Переменные окружения
- Backend: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, `CORS_ORIGINS`, `PORT`
- Frontend: `VITE_API_URL` (синхронизируется из backend)
- Bot: `TELEGRAM_BOT_TOKEN`, `BACKEND_URL`, `WEBAPP_URL` (синхронизируются)

#### Изменения
- **v1.0.0** (2025-01-XX): Первоначальная настройка автодеплоя на Render.com

#### Rollback Strategy
- **Риск**: Средний (может нарушить деплой)
- **Rollback**: Откат изменений `render.yaml` через git revert
- **Процедура**: 
  ```bash
  git revert <commit-hash>
  # Render автоматически подхватит изменения при следующем деплое
  ```
- **Альтернатива**: Ручной откат через Render Dashboard (изменить buildCommand/startCommand)

#### Известные проблемы
- `npm ci` выполняется 3 раза (для каждого сервиса), что замедляет деплой
- Решение отложено (см. `DEPLOYMENT_OPTIMIZATION.md`)

---

## Формат записи блока

```markdown
### BlockName / Category / Version

**Категория**: Category / Subcategory  
**Версия**: X.Y.Z  
**Статус**: ✅ Completed / 🚧 In Progress / 📋 Planned  
**Дата**: YYYY-MM-DD

#### Назначение
Краткое описание назначения блока

#### Описание
Подробное описание функциональности

#### Детали реализации
- Технические детали
- Используемые технологии
- Конфигурация

#### Зависимости
- Список зависимых блоков с версиями

#### Изменения
- **vX.Y.Z** (дата): Описание изменений

#### Rollback Strategy
- **Риск**: Низкий/Средний/Высокий
- **Rollback**: Описание процедуры отката
- **Процедура**: Команды/шаги для rollback
```

## Категории блоков

### Infrastructure (infra/)
- `repo` - Структура репозитория
- `cicd` - CI/CD конфигурация
- `db` - База данных и миграции

### Core (core/)
- `auth` - Авторизация и аутентификация
- `rbac` - Роли и права доступа
- `audit` - Аудит действий
- `config` - Управление конфигурацией

### Admin (admin/)
- `users` - Управление пользователями
- `products` - Управление товарами
- `orders` - Управление заказами
- `bot-config` - Конфигурация бота
- `channel-config` - Конфигурация канала

### Storefront (storefront/)
- `catalog` - Каталог товаров
- `product-details` - Детали товара
- `cart` - Корзина
- `checkout` - Оформление заказа

### Bot (bot/)
- `commands` - Команды бота
- `handlers` - Обработчики
- `scheduling` - Расписание

### Channel (channel/)
- `posting` - Публикация постов
- `automation` - Автоматизация

## История изменений реестра

- **2025-01-XX**: Создан реестр блоков, добавлены первые 2 блока (RepoStructureAlign, RenderAutoDeploy)

