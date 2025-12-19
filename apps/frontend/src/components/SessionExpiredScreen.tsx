import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './SessionExpiredScreen.css'

/**
 * Screen shown when session expires (401 error)
 */
export function SessionExpiredScreen() {
  const navigate = useNavigate()
  const { retry } = useAuth()

  const handleRetry = () => {
    if (retry) {
      retry()
    } else {
      // Fallback: reload page
      window.location.reload()
    }
  }

  return (
    <div className="session-expired-screen">
      <div className="session-expired-content">
        <div className="session-expired-icon">🔒</div>
        <h1 className="session-expired-title">Сессия истекла</h1>
        <p className="session-expired-message">
          Ваша сессия авторизации истекла. Пожалуйста, авторизуйтесь снова.
        </p>
        <div className="session-expired-actions">
          <button className="session-expired-retry" onClick={handleRetry}>
            Повторить авторизацию
          </button>
          <button 
            className="session-expired-back" 
            onClick={() => navigate('/app')}
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  )
}

