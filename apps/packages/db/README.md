# @asked-store/db

Prisma schema и клиент для базы данных ASKED Store.

## Генерация Prisma клиента

```bash
npm run generate
```

## Миграции

### Создание новой миграции

```bash
npm run migrate:dev
```

### Применение миграций (production)

```bash
npm run migrate:deploy
```

## Использование в других пакетах

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

**Важно:** Убедитесь, что Prisma клиент был сгенерирован перед использованием (`npm run generate`).
