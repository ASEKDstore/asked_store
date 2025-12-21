import { useAuth } from '../context/AuthContext'
import './NoTgContextScreen.css'

/**
 * Screen shown when Telegram WebApp context is missing or invalid
 * This happens when app is opened via menu button with URL instead of web_app
 */
export function NoTgContextScreen() {
  const { retry } = useAuth()

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="no-tg-context-screen">
      <div className="no-tg-context-content">
        <div className="no-tg-context-icon">📱</div>
        <h1 className="no-tg-context-title">Открой приложение из Telegram</h1>
        <p className="no-tg-context-message">
          Приложение должно быть открыто через кнопку в Telegram боте.
          <br />
          <br />
          Нажми кнопку ниже, чтобы перезагрузить страницу, или открой приложение через команду /start в боте.
        </p>
        <div className="no-tg-context-actions">
          <button 
            className="no-tg-context-button"
            onClick={handleReload}
          >
            🔄 Перезагрузить
          </button>
          <button 
            className="no-tg-context-button no-tg-context-button-secondary"
            onClick={retry}
          >
            🔁 Повторить попытку
          </button>
        </div>
        <div className="no-tg-context-hint">
          <p>💡 Совет: Используй кнопку "🛍 ASKED Store" в меню бота или команду /start</p>
        </div>
      </div>
    </div>
  )
}

