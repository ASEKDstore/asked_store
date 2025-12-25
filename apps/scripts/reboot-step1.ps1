# ASKED Store Reboot Step 1 - Legacy Migration & Setup
# Идемпотентный скрипт для переноса старых проектов в legacy и настройки окружения

$ErrorActionPreference = "Stop"

Write-Host "=== ASKED Store Reboot Step 1 ===" -ForegroundColor Cyan
Write-Host ""

# Определяем корень репозитория
# Если скрипт запущен напрямую из scripts/, берем родителя
# Если скрипт запущен с параметром пути, используем его
if ($PSScriptRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
} else {
    $RepoRoot = Get-Location
}

# Проверяем что это корень репозитория (есть package.json с workspaces)
$PackageJson = Join-Path $RepoRoot "package.json"
if (-not (Test-Path $PackageJson)) {
    Write-Host "[ERROR] Не найден package.json в $RepoRoot" -ForegroundColor Red
    Write-Host "Запустите скрипт из корня репозитория или из папки scripts/" -ForegroundColor Yellow
    exit 1
}

Set-Location $RepoRoot

Write-Host "[INFO] Рабочая директория: $RepoRoot" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# ШАГ 1: Перенос старых проектов в legacy
# ============================================================================
Write-Host "--- ШАГ 1: Перенос в legacy ---" -ForegroundColor Yellow

# 1.1. Создаем папку legacy
$LegacyPath = Join-Path $RepoRoot "legacy"
if (-not (Test-Path $LegacyPath)) {
    Write-Host "[1.1] Создаю папку legacy..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $LegacyPath -Force | Out-Null
    Write-Host "[1.1] ✓ Папка legacy создана" -ForegroundColor Green
} else {
    Write-Host "[1.1] ✓ Папка legacy уже существует" -ForegroundColor Gray
}

# 1.2. Определяем где лежат старые папки
$BackendSource = $null
$FrontendSource = $null

# Проверяем ./backend и ./frontend
$BackendRoot = Join-Path $RepoRoot "backend"
$FrontendRoot = Join-Path $RepoRoot "frontend"

if (Test-Path $BackendRoot) {
    $BackendSource = $BackendRoot
    Write-Host "[1.2] Найден ./backend" -ForegroundColor Green
}

if (Test-Path $FrontendRoot) {
    $FrontendSource = $FrontendRoot
    Write-Host "[1.2] Найден ./frontend" -ForegroundColor Green
}

# Если не найдены в корне, проверяем ./apps/backend и ./apps/frontend
if (-not $BackendSource -or -not $FrontendSource) {
    $BackendApps = Join-Path $RepoRoot "apps\backend"
    $FrontendApps = Join-Path $RepoRoot "apps\frontend"
    
    if (-not $BackendSource -and (Test-Path $BackendApps)) {
        $BackendSource = $BackendApps
        Write-Host "[1.2] Найден ./apps/backend" -ForegroundColor Green
    }
    
    if (-not $FrontendSource -and (Test-Path $FrontendApps)) {
        $FrontendSource = $FrontendApps
        Write-Host "[1.2] Найден ./apps/frontend" -ForegroundColor Green
    }
}

# Если всё ещё не найдены, выводим ошибку
if (-not $BackendSource -or -not $FrontendSource) {
    Write-Host "[ERROR] Не удалось найти старые проекты!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Папки в корне репозитория:" -ForegroundColor Yellow
    Get-ChildItem -Path $RepoRoot -Directory | Select-Object Name | Format-Table -AutoSize
    
    if (Test-Path (Join-Path $RepoRoot "apps")) {
        Write-Host ""
        Write-Host "Папки в ./apps:" -ForegroundColor Yellow
        Get-ChildItem -Path (Join-Path $RepoRoot "apps") -Directory | Select-Object Name | Format-Table -AutoSize
    }
    
    Write-Host ""
    Write-Host "Пожалуйста, укажите вручную пути к старым backend и frontend." -ForegroundColor Red
    exit 1
}

# 1.3. Перемещаем в legacy
$BackendDest = Join-Path $LegacyPath "backend"
$FrontendDest = Join-Path $LegacyPath "frontend"

if ($BackendSource -and (Test-Path $BackendSource)) {
    if (-not (Test-Path $BackendDest)) {
        Write-Host "[1.3] Перемещаю backend в legacy..." -ForegroundColor Green
        Move-Item -Path $BackendSource -Destination $BackendDest -Force
        Write-Host "[1.3] ✓ backend перемещен в legacy/backend" -ForegroundColor Green
    } else {
        Write-Host "[1.3] ⚠ legacy/backend уже существует, пропускаю" -ForegroundColor Yellow
    }
}

if ($FrontendSource -and (Test-Path $FrontendSource)) {
    if (-not (Test-Path $FrontendDest)) {
        Write-Host "[1.3] Перемещаю frontend в legacy..." -ForegroundColor Green
        Move-Item -Path $FrontendSource -Destination $FrontendDest -Force
        Write-Host "[1.3] ✓ frontend перемещен в legacy/frontend" -ForegroundColor Green
    } else {
        Write-Host "[1.3] ⚠ legacy/frontend уже существует, пропускаю" -ForegroundColor Yellow
    }
}

# 1.4. Выводим содержимое legacy
Write-Host ""
Write-Host "[1.4] Содержимое ./legacy:" -ForegroundColor Cyan
if (Test-Path $LegacyPath) {
    Get-ChildItem -Path $LegacyPath -Directory | Select-Object Name | Format-Table -AutoSize
} else {
    Write-Host "  (пусто)" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# ШАГ 2: Настройка .env
# ============================================================================
Write-Host "--- ШАГ 2: Настройка .env ---" -ForegroundColor Yellow

$EnvPath = Join-Path $RepoRoot ".env"
$EnvExists = Test-Path $EnvPath

# 2.1. Создаем .env если нет
if (-not $EnvExists) {
    Write-Host "[2.1] Создаю файл .env..." -ForegroundColor Green
    New-Item -ItemType File -Path $EnvPath -Force | Out-Null
    Write-Host "[2.1] ✓ Файл .env создан" -ForegroundColor Green
} else {
    Write-Host "[2.1] ✓ Файл .env уже существует" -ForegroundColor Gray
}

# 2.2. Проверяем наличие DATABASE_URL
$EnvContent = ""
if ($EnvExists) {
    $EnvContent = Get-Content -Path $EnvPath -Raw
}

# Проверяем наличие DATABASE_URL (может быть в любой строке с разными пробелами)
$HasDatabaseUrl = $false
if ($EnvContent) {
    $EnvLines = Get-Content -Path $EnvPath
    foreach ($line in $EnvLines) {
        if ($line -match "^\s*DATABASE_URL\s*=") {
            $HasDatabaseUrl = $true
            break
        }
    }
}

if (-not $HasDatabaseUrl) {
    Write-Host "[2.2] Добавляю DATABASE_URL в .env..." -ForegroundColor Green
    
    $TemplateLine = 'DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"'
    
    if ($EnvContent -and $EnvContent.Trim().Length -gt 0) {
        # Добавляем новую строку если файл не пустой
        Add-Content -Path $EnvPath -Value ""
        Add-Content -Path $EnvPath -Value $TemplateLine
    } else {
        # Записываем если файл пустой
        Set-Content -Path $EnvPath -Value $TemplateLine
    }
    
    Write-Host "[2.2] ✓ DATABASE_URL добавлен (шаблон)" -ForegroundColor Green
} else {
    Write-Host "[2.2] ✓ DATABASE_URL уже присутствует в .env" -ForegroundColor Gray
}

# 2.3. Выводим первые строки .env (без секретов)
Write-Host ""
Write-Host "[2.3] Первые строки .env (первые 5 строк с ключами):" -ForegroundColor Cyan
if (Test-Path $EnvPath) {
    $EnvLines = Get-Content -Path $EnvPath | Where-Object { $_ -match "^\s*[A-Z_]+" } | Select-Object -First 5
    foreach ($line in $EnvLines) {
        # Маскируем значения после = если это не шаблон
        if ($line -match '^([^=]+=)"?([^"]+)"?$') {
            $key = $matches[1]
            $value = $matches[2]
            if ($value -match "USER|PASSWORD|HOST|DBNAME") {
                Write-Host "  $line" -ForegroundColor Gray
            } else {
                Write-Host "  ${key}***" -ForegroundColor Gray
            }
        } else {
            Write-Host "  $line" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# ============================================================================
# ШАГ 3: Prisma миграция
# ============================================================================
Write-Host "--- ШАГ 3: Prisma миграция ---" -ForegroundColor Yellow

# 3.1. Находим schema.prisma
$SchemaPath = $null
$SchemaDir = $null

$PossiblePaths = @(
    (Join-Path $RepoRoot "packages\db\prisma\schema.prisma"),
    (Join-Path $RepoRoot "apps\api\prisma\schema.prisma"),
    (Join-Path $RepoRoot "packages\db\schema.prisma"),
    (Join-Path $RepoRoot "apps\api\schema.prisma")
)

Write-Host "[3.1] Ищу schema.prisma..." -ForegroundColor Green

foreach ($path in $PossiblePaths) {
    if (Test-Path $path) {
        $SchemaPath = $path
        $SchemaDir = Split-Path -Parent $path
        Write-Host "[3.1] ✓ Найден: $SchemaPath" -ForegroundColor Green
        break
    }
}

# Если не найден, делаем рекурсивный поиск
if (-not $SchemaPath) {
    Write-Host "[3.1] Не найден в стандартных местах, ищу рекурсивно..." -ForegroundColor Yellow
    $FoundSchemas = Get-ChildItem -Path $RepoRoot -Filter "schema.prisma" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|legacy" }
    
    if ($FoundSchemas.Count -gt 0) {
        $SchemaPath = $FoundSchemas[0].FullName
        $SchemaDir = $FoundSchemas[0].DirectoryName
        Write-Host "[3.1] ✓ Найден: $SchemaPath" -ForegroundColor Green
    }
}

if (-not $SchemaPath) {
    Write-Host "[ERROR] schema.prisma не найден!" -ForegroundColor Red
    Write-Host "Искал в:" -ForegroundColor Yellow
    foreach ($path in $PossiblePaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "[3.1] ✓ schema.prisma найден в: $SchemaDir" -ForegroundColor Green

# Сохраняем текущую директорию
$PreviousLocation = Get-Location

# 3.2. Переходим в директорию и запускаем migrate dev
Write-Host ""
Write-Host "[3.2] Запускаю prisma migrate dev..." -ForegroundColor Green
Write-Host "      (рабочая директория: $SchemaDir)" -ForegroundColor Gray
Set-Location $SchemaDir

try {
    $MigrateOutput = & npx prisma migrate dev --name init 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[3.2] ✓ Миграция создана успешно" -ForegroundColor Green
    } else {
        # Проверяем если миграция уже существует
        if ($MigrateOutput -match "already exists|migration.*exists") {
            Write-Host "[3.2] ✓ Миграция уже существует (это нормально)" -ForegroundColor Green
        } else {
            Write-Host "[3.2] ⚠ Возможна ошибка при создании миграции" -ForegroundColor Yellow
            Write-Host $MigrateOutput -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[3.2] ⚠ Ошибка при создании миграции: $_" -ForegroundColor Yellow
} finally {
    Set-Location $PreviousLocation
}

# 3.3. Генерируем Prisma client
Write-Host ""
Write-Host "[3.3] Генерирую Prisma client..." -ForegroundColor Green
Write-Host "      (рабочая директория: $SchemaDir)" -ForegroundColor Gray
Set-Location $SchemaDir

try {
    $GenerateOutput = & npx prisma generate 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[3.3] ✓ Prisma client сгенерирован" -ForegroundColor Green
    } else {
        Write-Host "[3.3] ⚠ Возможна ошибка при генерации" -ForegroundColor Yellow
        Write-Host $GenerateOutput -ForegroundColor Gray
    }
} catch {
    Write-Host "[3.3] ⚠ Ошибка при генерации: $_" -ForegroundColor Yellow
} finally {
    Set-Location $PreviousLocation
}

# Возвращаемся в корень для итогового вывода
Set-Location $RepoRoot

# 3.4. Итоговый вывод
Write-Host ""
Write-Host "=== ИТОГИ ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ schema.prisma: $SchemaPath" -ForegroundColor Green

$MigrationsDir = Join-Path $SchemaDir "migrations"
if (Test-Path $MigrationsDir) {
    $MigrationCount = (Get-ChildItem -Path $MigrationsDir -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "✓ Миграции: $MigrationsDir ($MigrationCount миграций)" -ForegroundColor Green
} else {
    Write-Host "⚠ Миграции: папка не найдена (возможно миграция еще не создана)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Содержимое ./legacy:" -ForegroundColor Cyan
if (Test-Path $LegacyPath) {
    Get-ChildItem -Path $LegacyPath -Directory | Select-Object Name | Format-Table -AutoSize
} else {
    Write-Host "  (пусто)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Готово! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Отредактируйте .env и установите правильный DATABASE_URL" -ForegroundColor Gray
Write-Host "2. Убедитесь что база данных доступна" -ForegroundColor Gray
Write-Host "3. Запустите 'npm install' в корне проекта" -ForegroundColor Gray
Write-Host ""
