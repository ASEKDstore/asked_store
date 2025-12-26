# Workspace Requirements - ASKED Store

## Обязательные требования к workspace

### Структура директорий

```
asked_store/
├── apps/
│   ├── api/
│   │   └── package.json
│   ├── webapp/
│   │   └── package.json
│   └── bot/
│       └── package.json
└── packages/
    ├── db/
    │   └── package.json
    └── shared/
        └── package.json
```

## Требования к package.json

### 1. apps/api/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "...",
    "start": "...",
    "dev": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Скрипты:**
- `build` - **обязательно** (TypeScript compilation)
- `start` - **обязательно** (production start)
- `dev` - **обязательно** (development mode)
- `lint` - рекомендуется
- `typecheck` - рекомендуется

---

### 2. apps/webapp/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/webapp",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "...",
    "dev": "...",
    "preview": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Скрипты:**
- `build` - **обязательно** (Vite build)
- `dev` - **обязательно** (Vite dev server)
- `preview` - рекомендуется (preview production build)
- `lint` - рекомендуется
- `typecheck` - рекомендуется

**Примечание:** `start` не требуется (static_site не нужен start script)

---

### 3. apps/bot/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/bot",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "...",
    "start": "...",
    "dev": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Скрипты:**
- `build` - **обязательно** (TypeScript compilation)
- `start` - **обязательно** (production start)
- `dev` - **обязательно** (development mode with watch)
- `lint` - рекомендуется
- `typecheck` - рекомендуется

---

### 4. packages/db/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/db",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "generate": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "studio": "prisma studio"
  }
}
```

**Скрипты:**
- `generate` - **обязательно** (Prisma client generation)
- `migrate:dev` - **обязательно** (development migrations)
- `migrate:deploy` - **обязательно** (production migrations, non-interactive)
- `studio` - опционально (Prisma Studio GUI)

**Примечание:** `build`, `start`, `dev` не требуются (это пакет, не приложение)

---

### 5. packages/shared/package.json

**Обязательные поля:**
```json
{
  "name": "@asked-store/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "...",
    "lint": "...",
    "typecheck": "..."
  }
}
```

**Скрипты:**
- `build` - рекомендуется (TypeScript compilation, если нужен)
- `lint` - рекомендуется
- `typecheck` - рекомендуется

**Примечание:** `start`, `dev` не требуются (это пакет, не приложение)

---

## Проверка соответствия

### Скрипт проверки (PowerShell)

```powershell
$workspaces = @(
    @{ Path = "apps/api"; Name = "@asked-store/api"; RequiredScripts = @("build", "start", "dev") },
    @{ Path = "apps/webapp"; Name = "@asked-store/webapp"; RequiredScripts = @("build", "dev") },
    @{ Path = "apps/bot"; Name = "@asked-store/bot"; RequiredScripts = @("build", "start", "dev") },
    @{ Path = "packages/db"; Name = "@asked-store/db"; RequiredScripts = @("generate", "migrate:dev", "migrate:deploy") },
    @{ Path = "packages/shared"; Name = "@asked-store/shared"; RequiredScripts = @() }
)

foreach ($ws in $workspaces) {
    $pkgPath = Join-Path $ws.Path "package.json"
    if (Test-Path $pkgPath) {
        $pkg = Get-Content $pkgPath | ConvertFrom-Json
        Write-Host "`n=== $($ws.Path) ==="
        
        # Check name
        if ($pkg.name -eq $ws.Name) {
            Write-Host "✅ Name: $($pkg.name)"
        } else {
            Write-Host "❌ Name mismatch: expected '$($ws.Name)', got '$($pkg.name)'"
        }
        
        # Check scripts
        $scripts = $pkg.scripts.PSObject.Properties.Name
        foreach ($reqScript in $ws.RequiredScripts) {
            if ($scripts -contains $reqScript) {
                Write-Host "✅ Script: $reqScript"
            } else {
                Write-Host "❌ Missing script: $reqScript"
            }
        }
    } else {
        Write-Host "`n❌ $($ws.Path)/package.json NOT FOUND"
    }
}
```

---

## Согласованность с root package.json

Корневой `package.json` использует эти workspace names в командах:

```json
{
  "scripts": {
    "build:api": "npm run build --workspace=@asked-store/api",
    "build:webapp": "npm run build --workspace=@asked-store/webapp",
    "build:bot": "npm run build --workspace=@asked-store/bot",
    "start:api": "npm run start --workspace=@asked-store/api",
    "start:bot": "npm run start --workspace=@asked-store/bot",
    "dev:api": "npm run dev --workspace=@asked-store/api",
    "dev:webapp": "npm run dev --workspace=@asked-store/webapp",
    "dev:bot": "npm run dev --workspace=@asked-store/bot",
    "db:generate": "npm run generate --workspace=@asked-store/db",
    "db:migrate:dev": "npm run migrate:dev --workspace=@asked-store/db",
    "db:migrate:deploy": "npm run migrate:deploy --workspace=@asked-store/db",
    "db:studio": "npm run studio --workspace=@asked-store/db"
  }
}
```

**Важно:** Имена workspace в `package.json` каждого workspace ДОЛЖНЫ точно совпадать с теми, что используются в корневых скриптах.

---

## История изменений

- **2025-01-XX**: Создан документ с требованиями к workspace names и scripts

