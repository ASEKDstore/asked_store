import { useUser } from '../context/UserContext'
import './TelegramRequiredScreen.css'

/**
 * Screen shown when Mini App is opened without Telegram WebApp context
 * (e.g., opened via direct URL in browser)
 */
export function TelegramRequiredScreen() {
  const { telegramStatus } = useUser()

  // Show screen ONLY if status is 'browser'
  // If 'loading' or 'telegram', don't show (will be handled by LoadingScreen)
  if (telegramStatus !== 'browser') {
    return null
  }

  return (
    <div className="telegram-required-screen">
      <div className="telegram-required-content">
        <div className="telegram-required-icon">📱</div>
        <h1 className="telegram-required-title">Открой через бота</h1>
        <p className="telegram-required-text">
          Для работы приложения нужен Telegram WebApp контекст.
        </p>
        <p className="telegram-required-text">
          Откройте приложение через кнопку <strong>🛍 Открыть ASKED Store</strong> в боте.
        </p>
        <div className="telegram-required-steps">
          <div className="telegram-required-step">
            <span className="step-number">1</span>
            <span>Найдите бота @asked_store_bot в Telegram</span>
          </div>
          <div className="telegram-required-step">
            <span className="step-number">2</span>
            <span>Отправьте команду /start</span>
          </div>
          <div className="telegram-required-step">
            <span className="step-number">3</span>
            <span>Нажмите кнопку "🛍 Открыть ASKED Store"</span>
          </div>
        </div>
        {import.meta.env.DEV && (
          <div className="telegram-required-debug">
            <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '24px' }}>
              DEV: window.Telegram?.WebApp = {String(!!window.Telegram?.WebApp)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

