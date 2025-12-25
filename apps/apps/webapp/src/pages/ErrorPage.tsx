import { useNavigate } from 'react-router-dom'
import { useTgTheme } from '../features/telegram/useTgTheme'
import { Page } from '../shared/ui/Page'
import { Button } from '../shared/ui/Button'

interface ErrorPageProps {
  message?: string
}

export function ErrorPage({ message = 'Произошла ошибка' }: ErrorPageProps) {
  const navigate = useNavigate()

  // Применяем тему Telegram
  useTgTheme()

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#d32f2f' }}>
          Ошибка
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--tg-text)', marginBottom: '24px' }}>
          {message}
        </p>
        <Button onClick={() => navigate('/')} style={{ width: '100%', maxWidth: '300px' }}>
          На главную
        </Button>
      </div>
    </Page>
  )
}