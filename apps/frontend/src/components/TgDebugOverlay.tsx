import React, { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import './TgDebugOverlay.css'

/**
 * Telegram WebApp Debug Overlay
 * Shows diagnostic information about Telegram WebApp availability and user data
 * Only visible in DEV mode or when ?debug=1 is in URL
 */
export const TgDebugOverlay: React.FC = () => {
  const { user, browserMode } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<{
    hasTelegram: boolean
    hasWebApp: boolean
    initDataLen: number
    initDataPreview: string
    userPresent: boolean
    user: any
    platform: string | undefined
    version: string | undefined
    currentUrl: string
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
      const initData = wa?.initData || ''
      const initDataLen = initData.length
      const initDataPreview = initDataLen > 0 
        ? `${initData.substring(0, 12)}... (${initDataLen} chars)`
        : 'empty'
      const tgUser = wa?.initDataUnsafe?.user ?? null
      
      setDebugData({
        hasTelegram: !!(window as any).Telegram,
        hasWebApp: !!wa,
        initDataLen,
        initDataPreview,
        userPresent: !!tgUser,
        user: tgUser,
        platform: wa?.platform,
        version: wa?.version,
        currentUrl: window.location.href,
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
                    <span className="tg-debug-label">initDataPreview:</span>
                    <span className="tg-debug-value">{debugData.initDataPreview}</span>
                  </div>
                  <div className="tg-debug-row">
                    <span className="tg-debug-label">userPresent:</span>
                    <span className="tg-debug-value">{String(debugData.userPresent)}</span>
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
                    <span className="tg-debug-label">currentUrl:</span>
                    <span className="tg-debug-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                      {debugData.currentUrl}
                    </span>
                  </div>
                  <div className="tg-debug-row tg-debug-row-full">
                    <span className="tg-debug-label">user:</span>
                    <pre className="tg-debug-value-pre">
                      {debugData.user ? JSON.stringify(debugData.user, null, 2) : 'null'}
                    </pre>
                  </div>
                  <div className="tg-debug-row tg-debug-row-full">
                    <span className="tg-debug-label">contextUser:</span>
                    <pre className="tg-debug-value-pre">
                      {user ? JSON.stringify({ id: user.id, username: user.username, source: user.source }, null, 2) : 'null'}
                    </pre>
                  </div>
                  <div className="tg-debug-row tg-debug-row-full">
                    <span className="tg-debug-label">browserMode:</span>
                    <span className="tg-debug-value">{String(browserMode)}</span>
                  </div>
                  {!debugData.hasWebApp || debugData.initDataLen === 0 ? (
                    <div className="tg-debug-warning">
                      ⚠️ Если Menu Button = "Open with URL" — initData будет пустой. Нужен Web App button.
                    </div>
                  ) : null}
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

