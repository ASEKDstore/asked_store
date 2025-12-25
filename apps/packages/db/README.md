# @asked-store/db

Prisma schema и типы для базы данных ASKED Store.

**Это чистая библиотека без side effects.** Она не создает экземпляров PrismaClient и не читает переменные окружения при импорте.

## Генерация Prisma клиента

⚠️ **Важно:** Генерация Prisma клиента должна выполняться из `apps/api`, а не из этого пакета.

```bash
# Из корня проекта
npm run db:generate

# Или из apps/api
cd apps/api
npm run db:generate
```

## Миграции

Миграции также должны выполняться из `apps/api`:

```bash
# Из корня проекта
npm run db:migrate        # для разработки
npm run db:migrate:deploy # для production
```

## Использование в приложениях

Импортируйте класс `PrismaClient` и создавайте экземпляр в своем приложении:

```typescript
import { PrismaClient } from '@asked-store/db'

// Создайте экземпляр в вашем приложении (например, apps/api/src/prisma.ts)
const prisma = new PrismaClient()
```

**Важно:** 
- Не создавайте экземпляры PrismaClient в `packages/db`
- Все операции с Prisma (generate, migrate) выполняются из `apps/api`
- Этот пакет содержит только schema и типы
