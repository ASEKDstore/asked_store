# PowerShell скрипт для создания .env файлов с токеном бота

$BOT_TOKEN = "8502780617:AAGir8NDDJuUqm1GTXiXpcH1tQUhJj2qT3M"

Write-Host "Создание .env файлов с токеном бота..." -ForegroundColor Cyan

# Backend .env
$backendEnv = @"
# Telegram Bot Token (обязательно)
BOT_TOKEN=$BOT_TOKEN

# Database URL (обязательно - замените на свой)
DATABASE_URL=postgresql://user:password@localhost:5432/asked_store

# Frontend URL (для CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secret (опционально, по умолчанию используется BOT_TOKEN)
# JWT_SECRET=your_jwt_secret_here

# Root Admin Telegram ID (опционально)
# ROOT_ADMIN_ID=123456789
"@

$backendEnv | Out-File -FilePath "apps\backend\.env" -Encoding utf8
Write-Host "✅ Создан apps\backend\.env" -ForegroundColor Green

# Bot .env
$botEnv = @"
# Telegram Bot Token (обязательно)
BOT_TOKEN=$BOT_TOKEN

# Backend URL
BACKEND_URL=http://localhost:4000

# WebApp URL
WEBAPP_URL=http://localhost:5173

# Опциональные переменные:
# WELCOME_VIDEO_URL=https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
# TELEGRAM_CHANNEL_URL=https://t.me/asked_store
"@

$botEnv | Out-File -FilePath "apps\bot\.env" -Encoding utf8
Write-Host "✅ Создан apps\bot\.env" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  ВАЖНО: Обновите DATABASE_URL в apps\backend\.env на ваш реальный URL базы данных!" -ForegroundColor Yellow

