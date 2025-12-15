import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { apiUrl } from '../utils/api'
import './LoadingScreen.css'

type DiagnosticInfo = {
  hasTelegram: boolean
  hasWebApp: boolean
  initDataLen: number
  platform?: string
  version?: string
  userId?: number
}

export function LoadingScreen() {
  const { user, refresh } = useUser()
  const navigate = useNavigate()
  const [authMessage, setAuthMessage] = useState<string>('')
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  
  // Determine if we're in WebApp
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
  const isWebApp = !!tg
  
  // Auth state: if WebApp exists, we're authenticated (even as guest)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    isWebApp ? 'authenticated' : (user ? 'authenticated' : 'unauthenticated')
  
  const progress = useLoadingProgress(authState)

  // Initialize Telegram WebApp
  useEffect(() => {
    // Collect diagnostic info
    const diag: DiagnosticInfo = {
      hasTelegram: typeof window !== 'undefined' && !!window.Telegram,
      hasWebApp: !!tg,
      initDataLen: tg?.initData?.length || 0,
      platform: tg?.platform,
      version: tg?.version,
      userId: tg?.initDataUnsafe?.user?.id,
    }
    setDiagnostics(diag)

    if (!tg) {
      // Not in Telegram WebApp
      setAuthMessage('ℹ️ Откройте приложение через Telegram-бота')
      return
    }

    // Initialize Telegram WebApp (always, if WebApp exists)
    tg?.ready?.()
    tg?.expand?.()

    // Try to get user data from WebApp
    refresh()

    // Try to authenticate with backend if initData is available (non-blocking)
    const initData = tg?.initData
    if (initData && initData.length > 0) {
      // Authenticate in background, don't block UI
      const authenticate = async () => {
        try {
          const apiEndpoint = apiUrl('/api/auth/telegram')
          if (!apiEndpoint) {
            console.warn('API URL is not configured, skipping backend auth')
            return
          }

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          })

          if (response.ok) {
            // Refresh user data from backend
            refresh()
            setAuthMessage('✅ Вход через Telegram выполнен')
          } else {
            // Silent fail - user can still use the app as guest
            console.warn('Backend auth failed, continuing as guest')
            setAuthMessage('') // Don't show error message
          }
        } catch (error) {
          // Silent fail - user can still use the app as guest
          console.warn('Backend auth error, continuing as guest:', error)
          setAuthMessage('') // Don't show error message
        }
      }

      authenticate()
    } else {
      // No initData - user is guest, but can still use the app
      // Don't show message, just allow access
      setAuthMessage('')
    }
  }, [refresh, tg])

  // Navigate to /app when WebApp is detected and progress reaches 100%
  // Don't wait for user - allow guest access
  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
    const isWebApp = !!tg

    // If not in WebApp, don't navigate
    if (!isWebApp) {
      return
    }

    // Navigate when progress reaches 100% (regardless of user)
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate('/app')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate])

  const userName = user?.first_name || user?.firstName || 'ASKED'
  const displayName = user ? userName : 'ASKED'

  return (
    <div className="ls-root">
      <div className="ls-bg" />
      <div className="ls-glass" />

      <div className="ls-content">
        {/* Наклейка на стекле */}
        <div className="ls-sticker">ASKED STORE</div>

        {/* Приветствие */}
        <div className="ls-text">
          <div className="ls-title">Добро пожаловать, {displayName}</div>
          <div className="ls-sub">Внутри — дропы, кастомы и мерч.</div>
        </div>

        {/* Прогресс */}
        <div className="ls-progress">
          <div className="ls-progress-track" />
          <div
            className="ls-progress-thumb"
            style={{ 
              left: `clamp(0px, calc(${progress}% - 90px), calc(100% - 90px))`
            }}
          />
        </div>

        {/* Статус авторизации (текстовый, без кнопок) */}
        {/* Show message only if not in WebApp, or if auth succeeded */}
        {(authMessage || (!isWebApp && diagnostics)) && (
          <div className="ls-auth-message">
            {authMessage && <div>{authMessage}</div>}
            {diagnostics && (
              <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
                <button
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '11px',
                  }}
                >
                  {showDiagnostics ? 'Скрыть' : 'Показать'} диагностику
                </button>
                {showDiagnostics && (
                  <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '10px' }}>
                    <div>hasTelegram: {diagnostics.hasTelegram ? '✅' : '❌'}</div>
                    <div>hasWebApp: {diagnostics.hasWebApp ? '✅' : '❌'}</div>
                    <div>initDataLen: {diagnostics.initDataLen}</div>
                    {diagnostics.platform && <div>platform: {diagnostics.platform}</div>}
                    {diagnostics.version && <div>version: {diagnostics.version}</div>}
                    {diagnostics.userId && <div>userId: {diagnostics.userId}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Низовая мета */}
        <div className="ls-meta">
          <span>v1.16.2</span>
          <span>разработано командой ASKED</span>
          <span>2025</span>
        </div>
      </div>
    </div>
  )
}
