'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Проверяем наличие токена только в браузере
    if (typeof window === 'undefined') {
      return
    }

    const token = localStorage.getItem('admin_token')
    const telegramId = localStorage.getItem('admin_telegram_id')

    if (token && telegramId === '930749603') {
      setIsAuthenticated(true)
    } else if (pathname !== '/login') {
      setIsAuthenticated(false)
      router.replace('/login')
    } else {
      setIsAuthenticated(true) // Разрешаем показ страницы логина
    }
  }, [pathname, router])

  // Показываем контент только после проверки или если это страница логина
  if (isAuthenticated === null) {
    // Показываем минимальный лоадер только на защищенных страницах
    if (pathname !== '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-gray-600">Загрузка...</div>
          </div>
        </div>
      )
    }
    return <>{children}</>
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null
  }

  return <>{children}</>
}

