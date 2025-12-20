# Fix Failed Migration

Миграция `20241220000000_extend_bot_flows` упала из-за проблемы с enum типом.

## Вариант 1: Пометить миграцию как применённую (если частично применилась)

Если миграция частично применилась (создала enum, но не смогла изменить колонку status):

```bash
cd apps/backend
npm run migrate:resolve -- --applied 20241220000000_extend_bot_flows
```

Затем вручную выполните SQL из `scripts/fix-bot-flow-status.sql` в вашей БД.

## Вариант 2: Откатить миграцию и применить заново

Если миграция ничего не создала:

```bash
cd apps/backend
npm run migrate:resolve -- --rolled-back 20241220000000_extend_bot_flows
```

Затем примените миграцию заново:

```bash
npm run migrate:deploy
```

## Вариант 3: Ручное исправление через SQL

1. Подключитесь к БД
2. Выполните `scripts/fix-bot-flow-status.sql`
3. Пометите миграцию как применённую:

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

