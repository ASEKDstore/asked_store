import { useAuth } from '../context/AuthContext'
import './ErrorScreen.css'

export function ErrorScreen() {
  const { error, errorStatus, errorDetails, phase, requestId, retry } = useAuth()

  // Ensure all values are strings (no object rendering)
  const errorMessage = error ? String(error) : 'Неизвестная ошибка'
  const phaseString = phase ? String(phase) : null
  const requestIdString = requestId ? String(requestId) : null
  const statusString = errorStatus ? String(errorStatus) : null
  const detailsString = errorDetails ? String(errorDetails) : null

  // Build details text: status + details
  let detailsText = ''
  if (statusString) {
    detailsText = `Статус: ${statusString}`
  }
  if (detailsString) {
    detailsText = detailsText 
      ? `${detailsText}\n\nОтвет сервера:\n${detailsString}`
      : `Ответ сервера:\n${detailsString}`
  }

  return (
    <div className="error-screen">
      <div className="error-screen-content">
        <div className="error-screen-icon">⚠️</div>
        <h1 className="error-screen-title">Ошибка авторизации</h1>
        <div className="error-screen-message">{errorMessage}</div>
        
        {(phaseString || requestIdString || detailsText) && (
          <div className="error-screen-details">
            {phaseString && (
              <div className="error-screen-detail-row">
                <span className="error-screen-detail-label">Фаза:</span>
                <span className="error-screen-detail-value">{phaseString}</span>
              </div>
            )}
            {requestIdString && (
              <div className="error-screen-detail-row">
                <span className="error-screen-detail-label">Request ID:</span>
                <span className="error-screen-detail-value">{requestIdString}</span>
              </div>
            )}
            {detailsText && (
              <div className="error-screen-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="error-screen-detail-label" style={{ marginBottom: '8px' }}>Детали:</span>
                <span className="error-screen-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {detailsText}
                </span>
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

