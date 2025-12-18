import { useTelegramWebApp } from '../hooks/useTelegramWebApp'
import './TelegramWebAppDebug.css'

/**
 * Dev-only debug overlay for Telegram WebApp detection
 * Shows status, user data, and initData info
 * Only visible in DEV mode
 */
export function TelegramWebAppDebug() {
  const { status, user, telegramId, initData, initDataUnsafe } = useTelegramWebApp()

  // Only show in dev mode
  if (!import.meta.env.DEV) {
    return null
  }

  const debugInfo = {
    hasTelegram: typeof window !== 'undefined' && !!window.Telegram,
    hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
    initDataLen: initData.length,
    userId: telegramId,
    status,
  }

  return (
    <div className="tg-webapp-debug">
      <div className="tg-webapp-debug-header">🔍 Telegram WebApp Debug</div>
      <div className="tg-webapp-debug-content">
        <div className="tg-webapp-debug-row">
          <span className="tg-webapp-debug-label">Status:</span>
          <span className={`tg-webapp-debug-value tg-webapp-debug-status-${status}`}>
            {status}
          </span>
        </div>
        <div className="tg-webapp-debug-row">
          <span className="tg-webapp-debug-label">hasTelegram:</span>
          <span className="tg-webapp-debug-value">{String(debugInfo.hasTelegram)}</span>
        </div>
        <div className="tg-webapp-debug-row">
          <span className="tg-webapp-debug-label">hasWebApp:</span>
          <span className="tg-webapp-debug-value">{String(debugInfo.hasWebApp)}</span>
        </div>
        <div className="tg-webapp-debug-row">
          <span className="tg-webapp-debug-label">initDataLen:</span>
          <span className="tg-webapp-debug-value">{debugInfo.initDataLen}</span>
        </div>
        <div className="tg-webapp-debug-row">
          <span className="tg-webapp-debug-label">userId:</span>
          <span className="tg-webapp-debug-value">{debugInfo.userId ?? 'null'}</span>
        </div>
        {user && (
          <div className="tg-webapp-debug-row">
            <span className="tg-webapp-debug-label">user:</span>
            <span className="tg-webapp-debug-value">
              {user.first_name || user.username || `ID: ${user.id}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

