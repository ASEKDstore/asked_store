import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../features/telegram/useTelegram'
import { useAuth } from '../shared/auth/useAuth'
import { useTgTheme } from '../features/telegram/useTgTheme'
import { useBootProgress } from '../shared/hooks/useBootProgress'
import { BootLayout } from '../shared/ui/BootLayout'
import { Glass } from '../shared/ui/Glass'
import { LoaderBar } from '../shared/ui/LoaderBar'
import { VersionInfo } from '../shared/ui/VersionInfo'
import { ErrorPage } from './ErrorPage'

export function BootPage() {
  const navigate = useNavigate()
  const { isAvailable, initData, user, tg } = useTelegram()
  const { login, isAuthenticated } = useAuth()
  const { progress, setStage } = useBootProgress()
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Применяем тему Telegram
  useTgTheme()

  // Если уже авторизован, редирект на home
  useEffect(() => {
    if (isAuthenticated() && isInitialized) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isInitialized, navigate])

  // Если не Telegram, показываем сообщение
  if (!isAvailable) {
    return (
      <BootLayout>
        <Glass>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '2px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
              }}
            >
              ASKED STORE
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
              Открой приложение через Telegram
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
              Открой Telegram и найди бота ASKED Store
            </p>
          </div>
        </Glass>
      </BootLayout>
    )
  }

  // Основная логика инициализации
  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        // Этап 1: Telegram init
        if (tg) {
          tg.ready?.()
          tg.expand?.()
        }
        setStage('telegram')

        // Небольшая задержка для плавности
        await new Promise((resolve) => setTimeout(resolve, 200))

        if (!isMounted) return

        // Этап 2: Авторизация
        if (!initData) {
          throw new Error('initData не найден')
        }

        // Если уже авторизован, пропускаем
        if (!isAuthenticated()) {
          const response = await login(initData)

          if (!response || !response.token) {
            throw new Error('Ошибка авторизации')
          }
        }

        setStage('auth')

        // Небольшая задержка для плавности
        await new Promise((resolve) => setTimeout(resolve, 200))

        if (!isMounted) return

        // Этап 3: Конфигурация (симуляция)
        await new Promise((resolve) => setTimeout(resolve, 400))

        if (!isMounted) return

        setStage('config')

        // Небольшая задержка для плавности
        await new Promise((resolve) => setTimeout(resolve, 200))

        if (!isMounted) return

        // Этап 4: Завершение
        setStage('ready')

        // Задержка перед редиректом
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (!isMounted) return

        setIsInitialized(true)
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Ошибка инициализации')
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [initData, tg, login, isAuthenticated, setStage])

  // Если ошибка, показываем ErrorPage
  if (error) {
    return <ErrorPage message={error} />
  }

  // Получаем имя пользователя
  const firstName = user?.first_name || 'друг'
  const greeting = `Привет, ${firstName} 👋`

  return (
    <BootLayout>
      <Glass>
        <div style={{ textAlign: 'center' }}>
          {/* Бейдж */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '2px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '32px',
            }}
          >
            ASKED STORE
          </div>

          {/* Приветствие */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#ffffff',
            }}
          >
            {greeting}
          </h1>

          {/* Подзаголовок */}
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '32px',
            }}
          >
            Внутри — дропы, кастомы и мерч.
          </p>

          {/* Прогресс-бар */}
          <LoaderBar progress={progress} />

          {/* Версия */}
          <VersionInfo />
        </div>
      </Glass>
    </BootLayout>
  )
}