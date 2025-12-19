import { type ReactNode } from 'react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const AdminGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser()
  const { role } = useAuth()
  const navigate = useNavigate()

  // Check if user is admin based on role from backend (most reliable)
  const isAdmin = role === 'admin' || user.isAdmin

  if (user.source === 'guest' || !user.tgId) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#f5f5f5',
        padding: '24px',
      }}>
        <h1>403</h1>
        <p>Требуется авторизация</p>
        <button
          onClick={() => navigate('/app')}
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Обычный режим
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#f5f5f5',
        padding: '24px',
      }}>
        <h1>403</h1>
        <p>Доступ запрещён</p>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>Только для администраторов</p>
        <button
          onClick={() => navigate('/app')}
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Обычный режим
        </button>
      </div>
    )
  }

  return <>{children}</>
}



