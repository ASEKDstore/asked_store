'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        ready: () => void
        expand: () => void
      }
    }
  }
}

export default function Home() {
  const [adminUrl, setAdminUrl] = useState<string>('')
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    // Определяем URL админ-панели
    if (typeof window === 'undefined') return

    const adminUrlEnv = process.env.NEXT_PUBLIC_ADMIN_URL
    
    if (adminUrlEnv) {
      // Используем URL из переменных окружения (продакшен)
      setAdminUrl(adminUrlEnv.startsWith('http') ? adminUrlEnv : `https://${adminUrlEnv}`)
    } else {
      // Для локальной разработки определяем URL на основе текущего хоста
      const currentHost = window.location.hostname
      const currentProtocol = window.location.protocol
      
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Локальная разработка
        setAdminUrl(`${currentProtocol}//${currentHost}:3001`)
      } else {
        // Продакшен - заменяем miniapp на admin в домене
        const adminHost = currentHost.replace('miniapp', 'admin').replace('telegram-shop-miniapp', 'telegram-shop-admin')
        setAdminUrl(`${currentProtocol}//${adminHost}`)
      }
    }

    // Проверяем, запущено ли в Telegram
    if (window.Telegram?.WebApp) {
      setIsTelegram(true)
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  const handleOpenAdmin = () => {
    if (!adminUrl) {
      console.error('Admin URL not set')
      return
    }

    // Открываем админ-панель в том же окне (внутри приложения)
    window.location.href = adminUrl
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ASKED Mini App</h1>
        <p className="text-gray-600 mb-8">
          Мини-приложение для магазина одежды
        </p>

        {/* Кнопка для перехода в админ-панель (для теста) */}
        <div className="mt-8">
          <button
            onClick={handleOpenAdmin}
            disabled={!adminUrl}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>⚙️</span>
            <span>Админ-панель</span>
          </button>
        </div>
      </div>
    </main>
  )
}




