import { useAuth } from '../context/AuthContext'
import './ErrorScreen.css'

export function ErrorScreen() {
  const { error, phase, requestId, retry } = useAuth()

  return (
    <div className="error-screen">
      <div className="error-screen-content">
        <div className="error-screen-icon">⚠️</div>
        <h1 className="error-screen-title">Ошибка загрузки</h1>
        <div className="error-screen-message">{error || 'Неизвестная ошибка'}</div>
        
        {phase && (
          <div className="error-screen-details">
            <div className="error-screen-detail-row">
              <span className="error-screen-detail-label">Фаза:</span>
              <span className="error-screen-detail-value">{phase}</span>
            </div>
            {requestId && (
              <div className="error-screen-detail-row">
                <span className="error-screen-detail-label">Request ID:</span>
                <span className="error-screen-detail-value">{requestId}</span>
              </div>
            )}
          </div>
        )}

        {retry && (
          <button className="error-screen-retry" onClick={retry}>
            Повторить
          </button>
        )}
      </div>
    </div>
  )
}

