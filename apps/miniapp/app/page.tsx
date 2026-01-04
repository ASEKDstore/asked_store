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
    
    let finalUrl = ''
    
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    
    if (adminUrlEnv) {
      // Используем URL из переменных окружения (продакшен)
      // Render может вернуть внутренний хост (service-name-xxxxx) или публичный (service-name.onrender.com)
      if (adminUrlEnv.startsWith('http://') || adminUrlEnv.startsWith('https://')) {
        finalUrl = adminUrlEnv
      } else {
        // Проверяем, что это публичный хост Render
        if (adminUrlEnv.includes('.onrender.com')) {
          finalUrl = `https://${adminUrlEnv}`
        } else if (adminUrlEnv.includes('-') && !adminUrlEnv.includes('.')) {
          // Внутренний хост Render (telegram-shop-admin-4haz)
          // Конвертируем в публичный: telegram-shop-admin.onrender.com
          // Убираем последний сегмент с хешем и добавляем .onrender.com
          const parts = adminUrlEnv.split('-')
          // Находим индекс начала хеша (обычно последние части)
          // Для telegram-shop-admin-4haz -> telegram-shop-admin
          let serviceName = ''
          if (parts.length >= 3) {
            // Берем все части кроме последней (которая обычно хеш)
            serviceName = parts.slice(0, -1).join('-')
          } else {
            serviceName = adminUrlEnv
          }
          finalUrl = `https://${serviceName}.onrender.com`
        } else {
          // Неизвестный формат, пробуем как есть с https
          finalUrl = `https://${adminUrlEnv}`
        }
      }
    } else {
      // Fallback: определяем URL на основе текущего хоста
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Локальная разработка
        finalUrl = `${currentProtocol}//${currentHost}:3001`
      } else if (currentHost.includes('.onrender.com')) {
        // Продакшен Render - заменяем miniapp на admin в домене
        const adminHost = currentHost
          .replace('telegram-shop-miniapp', 'telegram-shop-admin')
          .replace('miniapp', 'admin')
        finalUrl = `https://${adminHost}`
      } else {
        // Другой хостинг - пробуем заменить miniapp на admin
        const adminHost = currentHost.replace('miniapp', 'admin')
        finalUrl = `${currentProtocol}//${adminHost}`
      }
    }

    console.log('Admin URL determined:', finalUrl, 'from env:', adminUrlEnv)
    setAdminUrl(finalUrl)

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
      alert('URL админ-панели не определен')
      return
    }

    console.log('Opening admin panel:', adminUrl)
    
    // Открываем админ-панель в том же окне (внутри приложения)
    try {
      window.location.href = adminUrl
    } catch (error) {
      console.error('Error opening admin panel:', error)
      alert(`Ошибка открытия админ-панели: ${error}`)
    }
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




