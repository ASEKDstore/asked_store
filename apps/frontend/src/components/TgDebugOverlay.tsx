import React, { useState, useEffect } from 'react'
import './TgDebugOverlay.css'

/**
 * Telegram WebApp Debug Overlay
 * Shows diagnostic information about Telegram WebApp availability and user data
 * Only visible in DEV mode or when ?debug=1 is in URL
 */
export const TgDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<{
    hasTelegram: boolean
    hasWebApp: boolean
    initDataLen: number
    user: any
    platform: string | undefined
    version: string | undefined
  } | null>(null)

  // Check if debug mode is enabled
  const isDebugEnabled =
    import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug')

  useEffect(() => {
    if (!isDebugEnabled) {
      return
    }

    const updateDebugData = () => {
      const wa = (window as any).Telegram?.WebApp
      setDebugData({
        hasTelegram: !!(window as any).Telegram,
        hasWebApp: !!wa,
        initDataLen: wa?.initData?.length ?? 0,
        user: wa?.initDataUnsafe?.user ?? null,
        platform: wa?.platform,
        version: wa?.version,
      })
    }

    // Update on mount
    updateDebugData()

    // Update periodically (every 500ms) to catch delayed user data
    const interval = setInterval(updateDebugData, 500)

    return () => clearInterval(interval)
  }, [isDebugEnabled])

  if (!isDebugEnabled) {
    return null
  }

  return (
    <>
      <button
        className="tg-debug-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Диагностика Telegram"
      >
        🔍 Диагностика
      </button>

      {isOpen && (
        <div className="tg-debug-overlay" onClick={() => setIsOpen(false)}>
          <div className="tg-debug-content" onClick={(e) => e.stopPropagation()}>
            <div className="tg-debug-header">
              <h2>Telegram WebApp Диагностика</h2>
              <button
                className="tg-debug-close"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="tg-debug-body">
              {debugData ? (
                <div className="tg-debug-info">
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">hasTelegram:</span>
                    <span className="tg-debug-value">{String(debugData.hasTelegram)}</span>
                  </div>
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">hasWebApp:</span>
                    <span className="tg-debug-value">{String(debugData.hasWebApp)}</span>
                  </div>
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">initDataLen:</span>
                    <span className="tg-debug-value">{debugData.initDataLen}</span>
                  </div>
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">platform:</span>
                    <span className="tg-debug-value">{debugData.platform || '—'}</span>
                  </div>
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">version:</span>
                    <span className="tg-debug-value">{debugData.version || '—'}</span>
                  </div>
                  <div className="tg-debug-row tg-debug-row-full">
                    <span className="tg-debug-label">user:</span>
                    <pre className="tg-debug-value-pre">
                      {debugData.user ? JSON.stringify(debugData.user, null, 2) : 'null'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="tg-debug-loading">Загрузка данных...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

