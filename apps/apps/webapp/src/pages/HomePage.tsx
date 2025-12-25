import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/useAuth'
import { useTgTheme } from '../features/telegram/useTgTheme'
import { useTgBackButton } from '../features/telegram/useTgBackButton'
import { useTgMainButton } from '../features/telegram/useTgMainButton'
import { getTelegramWebApp } from '../features/telegram/tg'
import { Page } from '../shared/ui/Page'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { apiClient } from '../shared/api/apiClient'

export function HomePage() {
  const navigate = useNavigate()
  const { logout, isAuthenticated } = useAuth()
  const [meData, setMeData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Применяем тему Telegram
  useTgTheme()

  // BackButton скрыт на главной странице
  useTgBackButton()

  // MainButton
  const { setProgress } = useTgMainButton({
    text: 'Продолжить',
    onClick: () => {
      const tg = getTelegramWebApp()
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success')
      }
      // Показываем уведомление (в будущем можно заменить на toast)
      alert('Скоро будет витрина')
    },
  })

  // Если не авторизован, редирект на BootPage
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handlePingMe = async () => {
    setLoading(true)
    setProgress(true)

    try {
      const response = await apiClient.get('/me')
      if (response.ok && response.data) {
        setMeData(response.data)
      } else {
        setMeData({ error: response.error || 'Ошибка запроса' })
      }
    } catch (err) {
      setMeData({ error: err instanceof Error ? err.message : 'Ошибка' })
    } finally {
      setLoading(false)
      setProgress(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  // Если не авторизован, показываем пустой экран (редирект в процессе)
  if (!isAuthenticated()) {
    return null
  }

  return (
    <Page>
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          ASKED Store
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--tg-hint)',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          Frontend v2 (Telegram-first)
        </p>

        <Card>
          <p style={{ fontSize: '14px', color: 'var(--tg-hint)', marginBottom: '12px' }}>
            Тестовый запрос к API:
          </p>
          <Button onClick={handlePingMe} disabled={loading} style={{ width: '100%', marginBottom: '12px' }}>
            {loading ? 'Загрузка...' : 'Ping /me'}
          </Button>
          {meData && (
            <pre
              style={{
                fontSize: '12px',
                background: 'var(--tg-bg)',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
              }}
            >
              {JSON.stringify(meData, null, 2)}
            </pre>
          )}
        </Card>

        <Button onClick={handleLogout} variant="secondary" style={{ width: '100%' }}>
          Выйти
        </Button>
      </div>
    </Page>
  )
}