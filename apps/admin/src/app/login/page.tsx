'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [telegramId, setTelegramId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const trimmedId = telegramId.trim()

      // Проверяем через API
      const response = await fetch(`${apiUrl}/auth/admin/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: trimmedId }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Ошибка от API
        setError(data.error || 'Неверный ID администратора')
        return
      }

      if (data.isAdmin && data.accessToken) {
        // Сохраняем токен и ID
        localStorage.setItem('admin_token', data.accessToken)
        localStorage.setItem('admin_telegram_id', trimmedId)
        router.push('/')
      } else {
        setError('Неверный ID администратора')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Если API недоступен, используем fallback для локальной разработки
      if (telegramId.trim() === '930749603') {
        localStorage.setItem('admin_token', 'dev-token-' + telegramId)
        localStorage.setItem('admin_telegram_id', telegramId.trim())
        router.push('/')
      } else {
        setError('Ошибка подключения к серверу. Проверьте, что API сервер запущен.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Админ панель</h1>
          <p className="text-gray-600">Вход в систему управления</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-2">
              Telegram ID
            </label>
            <input
              id="telegramId"
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Введите ваш Telegram ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Для локальной разработки используйте: 930749603
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

