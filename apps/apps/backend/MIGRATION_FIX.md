# Fix Failed Migration

Миграция `20241220000000_extend_bot_flows` упала из-за проблемы с enum типом.

## Решение: Пометить миграцию как откаченную и применить заново

Миграция теперь полностью идемпотентна и безопасна для повторного применения.

### Шаг 1: Откатить failed миграцию

Выполните в Render Shell или через подключение к БД:

```bash
cd apps/backend
npm run migrate:resolve -- --rolled-back 20241220000000_extend_bot_flows
```

Или через SQL напрямую:

```sql
-- Удалить запись о failed миграции
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20241220000000_extend_bot_flows' 
AND finished_at IS NULL;
```

### Шаг 2: Применить миграцию заново

```bash
npm run migrate:deploy
```

Миграция теперь полностью идемпотентна - она проверит существование всех объектов перед созданием/изменением.

## Альтернатива: Ручное исправление

Если нужно исправить вручную:

1. Выполните `scripts/fix-bot-flow-status.sql` в БД
2. Пометите миграцию как применённую:

```bash
npm run migrate:resolve -- --applied 20241220000000_extend_bot_flows
```

## Проверка состояния

Проверьте состояние миграций:

```sql
SELECT migration_name, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20241220000000_extend_bot_flows';
```

