# Инструкция по исправлению failed миграции на Render

## Проблема
Миграция `20241220000000_extend_bot_flows` упала и помечена как failed. Prisma не будет применять новые миграции пока эта не будет исправлена.

## Решение

### Вариант 1: Через Render Shell (рекомендуется)

1. Откройте Render Dashboard → ваш backend service → Shell
2. Выполните:

```bash
cd apps/backend
npm run migrate:resolve -- --rolled-back 20241220000000_extend_bot_flows
npm run migrate:deploy
```

### Вариант 2: Через SQL напрямую

1. Подключитесь к PostgreSQL через Render Dashboard → Database → Connect
2. Выполните SQL:

```sql
-- Удалить запись о failed миграции
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20241220000000_extend_bot_flows' 
AND finished_at IS NULL;
```

3. Затем в Render Shell:

```bash
cd apps/backend
npm run migrate:deploy
```

### Вариант 3: Временный workaround в start script

Если нет доступа к Shell, можно временно изменить `package.json` start script:

```json
"start": "prisma generate && prisma migrate resolve --rolled-back 20241220000000_extend_bot_flows || true && prisma migrate deploy && node dist/server.js"
```

Но лучше использовать Вариант 1 или 2.

## Проверка

После исправления проверьте:

```sql
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations" 
WHERE migration_name = '20241220000000_extend_bot_flows';
```

Должно быть `finished_at IS NOT NULL` и `rolled_back_at IS NULL`.

## Примечание

Миграция теперь полностью идемпотентна - она безопасна для повторного применения и проверит существование всех объектов перед созданием/изменением.

