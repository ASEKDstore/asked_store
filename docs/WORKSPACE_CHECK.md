# Workspace Names & Scripts Verification Report

## Проверка соответствия workspace names и scripts

### ✅ Root package.json Configuration

**Workspaces определены:**
```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

**Скрипты ссылаются на workspace names:**
- `@asked-store/api` → build:api, start:api, dev:api
- `@asked-store/webapp` → build:webapp, dev:webapp
- `@asked-store/bot` → build:bot, start:bot, dev:bot
- `@asked-store/db` → db:generate, db:migrate:dev, db:migrate:deploy, db:studio

---

## ❌ Текущий статус workspace

**Директории workspace не существуют:**
- ❌ `apps/api/package.json` - NOT FOUND
- ❌ `apps/webapp/package.json` - NOT FOUND
- ❌ `apps/bot/package.json` - NOT FOUND
- ❌ `packages/db/package.json` - NOT FOUND
- ❌ `packages/shared/package.json` - NOT FOUND

---

## ✅ Требования к workspace (для реализации)

### apps/api/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/api",
  "scripts": {
    "build": "...",
    "start": "...",
    "dev": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

### apps/webapp/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/webapp",
  "scripts": {
    "build": "...",
    "dev": "...",
    "preview": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Примечание:** `start` не требуется (static_site)

### apps/bot/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/bot",
  "scripts": {
    "build": "...",
    "start": "...",
    "dev": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

### packages/db/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/db",
  "scripts": {
    "generate": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "studio": "prisma studio"
  }
}
```

**Примечание:** `build`, `start`, `dev` не требуются (это пакет)

### packages/shared/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/shared",
  "scripts": {
    "build": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Примечание:** `start`, `dev` не требуются (это пакет)

---

## 📋 Полные требования

Подробные требования с примерами и скриптами проверки см. в: `docs/WORKSPACE_REQUIREMENTS.md`

---

## ⚠️ Критические замечания

1. **Имена workspace ДОЛЖНЫ точно совпадать** с теми, что используются в корневых скриптах
2. **Обязательные scripts ДОЛЖНЫ присутствовать** в каждом workspace
3. **При создании workspace** обязательно проверять соответствие имен и scripts

---

## Дата проверки

2025-01-XX

