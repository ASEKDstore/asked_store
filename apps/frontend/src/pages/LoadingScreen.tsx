import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, telegramStatus } = useUser()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user.source === 'telegram' ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Redirect to telegram-required screen ONLY if status is 'browser'
  useEffect(() => {
    if (telegramStatus === 'browser') {
      if (import.meta.env.DEV) {
        console.log('[LoadingScreen] Browser mode detected, redirecting to telegram-required')
      }
      navigate('/telegram-required', { replace: true })
    }
  }, [telegramStatus, navigate])

  // Navigate to /app after progress completes OR timeout
  // Only navigate if status is NOT 'browser' (loading or telegram)
  useEffect(() => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return

    // Don't navigate if browser mode (will redirect to telegram-required)
    if (telegramStatus === 'browser') {
      return
    }

    // Navigate when progress reaches 100%
    if (progress >= 100 && telegramStatus !== 'loading') {
      hasNavigatedRef.current = true
      const timer = setTimeout(() => {
        navigate('/app')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate, telegramStatus])

  // Safety timeout: navigate after 2 seconds maximum (only if not browser)
  useEffect(() => {
    if (hasNavigatedRef.current) return
    if (telegramStatus === 'browser') {
      return // Don't navigate if browser mode
    }

    const safetyTimer = setTimeout(() => {
      if (!hasNavigatedRef.current && telegramStatus !== 'loading') {
        hasNavigatedRef.current = true
        navigate('/app')
      }
    }, 2000)

    return () => clearTimeout(safetyTimer)
  }, [navigate, telegramStatus])

  const userName = user.firstName || user.username || 'ASKED'
  const displayName = user.source === 'telegram' ? userName : 'ASKED'

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
