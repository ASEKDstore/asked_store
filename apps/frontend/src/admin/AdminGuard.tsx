import { type ReactNode } from 'react'
import { useUser } from '../context/UserContext'
import { isAdminId } from '../config/admins'

export const AdminGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser()

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#f5f5f5',
      }}>
        <h1>403</h1>
        <p>Требуется авторизация</p>
      </div>
    )
  }

  if (!isAdminId(user.id)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#f5f5f5',
      }}>
        <h1>403</h1>
        <p>Доступ запрещён</p>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>Только для администраторов</p>
      </div>
    )
  }

  return <>{children}</>
}



