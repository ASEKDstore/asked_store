# ASKED Store - Архитектурная спецификация

## Принципы архитектуры

### Блочная архитектура
- Каждый функциональный элемент = отдельный блок
- Блок имеет: имя, категорию, версию, ответственность
- Изменение блока = bump версии + стратегия rollback

### Единый источник правды
- Конфигурация бота, канала, шаблонов, кнопок, расписаний — ТОЛЬКО из backend/admin-config
- Запрещены хардкоды и ручные правки в коде
- Все конфигурации управляются через админ-панель

### Безопасность
- Проверка подписи Telegram initData обязательна
- Проверка ролей и прав — на каждом защищённом уровне
- Audit log для админ-действий
- RBAC обязателен (roles, permissions)

### Версионирование
- Любое изменение блока = bump версии (semver)
- Всегда указывать стратегию rollback
- Версии в package.json, документации, миграциях

## Структура монорепозитория

```
asked_store/
├── packages/
│   ├── db/                        # Prisma schema + клиент
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── shared/                    # Общие типы, схемы, контракты
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── schemas/          # Zod схемы
│   │   │   └── contracts/        # API контракты
│   │   └── package.json
│   └── config/                    # Конфигурация бота/канала (admin-config)
│       └── src/
│
├── apps/
│   ├── api/                       # Backend API
│   │   ├── src/
│   │   │   ├── blocks/           # Функциональные блоки
│   │   │   ├── core/             # Ядро (auth, rbac, audit)
│   │   │   ├── admin-config/     # Управление конфигурацией
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   ├── webapp/                    # Telegram Mini App
│   │   ├── src/
│   │   │   ├── blocks/           # UI блоки
│   │   │   ├── core/             # Ядро (auth, routing, state)
│   │   │   ├── admin/            # Админ-панель
│   │   │   └── storefront/       # Витрина
│   │   └── package.json
│   │
│   └── bot/                       # Telegram Bot
│       ├── src/
│       │   ├── handlers/         # Обработчики команд
│       │   ├── services/         # Сервисы (читают из admin-config)
│       │   └── bot.ts
│       └── package.json
│
├── package.json                   # Корневой (workspaces)
├── .env.example
├── .gitignore
├── README.md
└── render.yaml
```

## Формат блоков

### Frontend Block

```typescript
/**
 * Block: BlockName / Category / Version
 * 
 * Purpose: Описание назначения блока
 * 
 * Public API:
 * - Props: { prop1: Type, prop2: Type }
 * - Events: { onEvent1: (data: Type) => void }
 * - Routes: /path/to/route
 * 
 * Dependencies:
 * - @asked-store/shared: ^1.0.0
 * - Other blocks
 * 
 * Acceptance Criteria:
 * - [ ] Критерий 1
 * - [ ] Критерий 2
 * 
 * Risks + Rollback:
 * - Risk: Описание риска
 * - Rollback: Стратегия отката
 */
```

### Backend Block

```typescript
/**
 * Block: BlockName / Category / Version
 * 
 * Endpoints:
 * - GET /api/v1/resource - Public/Protected/Admin
 * - POST /api/v1/resource - Protected/Admin
 * 
 * Schemas / DTO:
 * - CreateResourceDto: { field1: string, field2: number }
 * - ResourceResponse: { id: string, ... }
 * 
 * Data Model:
 * - Prisma model: Resource
 * - Relations: Resource -> User, Resource -> Category
 * 
 * Validation & Security:
 * - Zod schema validation
 * - RBAC: permission:resource:create
 * - Audit log: action:resource:created
 * 
 * Acceptance Criteria:
 * - [ ] Критерий 1
 * - [ ] Критерий 2
 * 
 * Migration / Rollback:
 * - Migration: 20240101000000_create_resource_table
 * - Rollback: DROP TABLE resources;
 */
```

### Bot / Channel Block

```typescript
/**
 * Block: BlockName / Category / Version
 * 
 * Commands / Handlers:
 * - /command - Handler description
 * 
 * Admin-config inputs:
 * - configKey: type - Description
 * 
 * Channel operations:
 * - Operation: Description
 * 
 * Failure modes + retries:
 * - Failure: Description
 * - Retry: Strategy
 * 
 * Acceptance Criteria:
 * - [ ] Критерий 1
 * - [ ] Критерий 2
 */
```

## Категории блоков

### Core (Ядро системы)
- `auth` - Авторизация и аутентификация
- `rbac` - Роли и права доступа
- `audit` - Аудит действий
- `config` - Управление конфигурацией

### Admin (Админ-панель)
- `admin-users` - Управление пользователями
- `admin-products` - Управление товарами
- `admin-orders` - Управление заказами
- `admin-bot-config` - Конфигурация бота
- `admin-channel-config` - Конфигурация канала

### Storefront (Витрина)
- `catalog` - Каталог товаров
- `product-details` - Детали товара
- `cart` - Корзина
- `checkout` - Оформление заказа

### Bot (Telegram Bot)
- `bot-commands` - Команды бота
- `bot-handlers` - Обработчики
- `bot-scheduling` - Расписание

### Channel (Автоматизация канала)
- `channel-posting` - Публикация постов
- `channel-automation` - Автоматизация

## Workflow разработки

1. **Планирование блока**
   - Определить категорию, версию, зависимости
   - Описать Public API / Endpoints / Commands
   - Определить риски и rollback стратегию

2. **Реализация**
   - Обновить shared типы/схемы/контракты
   - Реализовать блок
   - Добавить валидацию и безопасность
   - Добавить audit log (для админ-действий)

3. **Миграции (если нужно)**
   - Создать миграцию Prisma
   - Описать rollback стратегию

4. **Тестирование**
   - Проверить Acceptance Criteria
   - Проверить безопасность (RBAC)
   - Проверить rollback

5. **Документация**
   - Обновить блок-спецификацию
   - Обновить API документацию (если меняется)

## Запрещённые практики

❌ Хардкод конфигурации в коде
❌ Пропуск версионирования
❌ Изменения без обновления shared типов
❌ Отсутствие проверки прав доступа
❌ "Временно" решения
❌ Техдолг без плана устранения
❌ Изменения без стратегии rollback

