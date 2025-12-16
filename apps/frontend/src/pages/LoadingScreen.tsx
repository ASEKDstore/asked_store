import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { initTelegramWebApp } from '../lib/telegram'
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
  const { user, setTelegramUser } = useUser()
  const navigate = useNavigate()
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Initialize Telegram WebApp and sync user data on mount
  useEffect(() => {
    const result = initTelegramWebApp()
    
    // Set user data if available
    if (result.user) {
      setTelegramUser(result.user)
    }

    // Collect diagnostic info
    const tg = typeof window !== 'undefined' ? (window as any).Telegram : undefined
    const wa = tg?.WebApp
    
    const diag: DiagnosticInfo = {
      hasTelegram: !!tg,
      hasWebApp: !!wa,
      initDataLen: result.initDataLen,
      platform: wa?.platform,
      version: wa?.version,
      userId: result.user?.id,
    }
    setDiagnostics(diag)
  }, [setTelegramUser])

  // Navigate to /app after short delay (always, regardless of Telegram)
  useEffect(() => {
    // Wait for progress to complete, then navigate
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate('/app')
      }, 800)
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

        {/* Диагностика (опционально, для отладки) */}
        {diagnostics && (
          <div className="ls-auth-message" style={{ opacity: 0.5, fontSize: '11px' }}>
            {!diagnostics.hasTelegram && (
              <div style={{ marginBottom: '4px', opacity: 0.7 }}>
                ℹ️ Откройте приложение через Telegram-бота для полного функционала
              </div>
            )}
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
