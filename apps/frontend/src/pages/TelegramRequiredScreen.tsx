import { useState, useEffect } from 'react'
import './TelegramRequiredScreen.css'

/**
 * Screen shown when Mini App is opened without Telegram WebApp context
 * (e.g., opened via direct URL in browser)
 * 
 * Shows ONLY if window.Telegram?.WebApp is absent
 * Does NOT depend on user loading state
 */
export function TelegramRequiredScreen() {
  const [hasWebApp, setHasWebApp] = useState<boolean | null>(null)

  useEffect(() => {
    // Check directly for window.Telegram?.WebApp
    // This is the ONLY condition for showing this screen
    const checkWebApp = () => {
      const wa = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
      setHasWebApp(!!wa)
    }

    // Initial check
    checkWebApp()

    // Re-check periodically (in case WebApp loads late)
    const interval = setInterval(checkWebApp, 500)
    
    return () => clearInterval(interval)
  }, [])

  // Show loading state while checking
  if (hasWebApp === null) {
    return (
      <div className="telegram-required-screen">
        <div className="telegram-required-content">
          <div className="telegram-required-icon">⏳</div>
          <h1 className="telegram-required-title">Проверка...</h1>
        </div>
      </div>
    )
  }

  // Show screen ONLY if WebApp is absent
  // If WebApp exists, don't show (even if user is not loaded yet)
  if (hasWebApp) {
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

