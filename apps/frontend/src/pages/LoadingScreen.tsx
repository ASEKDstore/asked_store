import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
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
  const { user } = useUser()
  const navigate = useNavigate()
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  
  // Determine if we're in WebApp (for diagnostics only)
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Collect diagnostic info (optional, for debugging)
  useEffect(() => {
    const diag: DiagnosticInfo = {
      hasTelegram: typeof window !== 'undefined' && !!window.Telegram,
      hasWebApp: !!tg,
      initDataLen: tg?.initData?.length || 0,
      platform: tg?.platform,
      version: tg?.version,
      userId: tg?.initDataUnsafe?.user?.id,
    }
    setDiagnostics(diag)
  }, [tg])

  // Navigate to /app when progress reaches 100%
  // Always navigate, regardless of Telegram WebApp presence (guest mode supported)
  useEffect(() => {
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

        {/* Диагностика (опционально, для отладки) */}
        {diagnostics && (
          <div className="ls-auth-message" style={{ opacity: 0.5 }}>
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
