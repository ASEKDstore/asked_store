'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем наличие токена
    const token = localStorage.getItem('admin_token')
    const telegramId = localStorage.getItem('admin_telegram_id')

    if (token && telegramId === '930749603') {
      setIsAuthenticated(true)
    } else if (pathname !== '/login') {
      router.push('/login')
    } else {
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null
  }

  return <>{children}</>
}

