import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, isTelegram } = useUser()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  
  // Check if Telegram WebApp is available
  const hasTelegramContext = typeof window !== 'undefined' && !!window.Telegram?.WebApp
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user.source === 'telegram' ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Check if we should redirect to telegram-required screen
  useEffect(() => {
    // Wait a bit to allow Telegram WebApp to initialize
    const checkTimer = setTimeout(() => {
      // If no Telegram WebApp context and no initData, redirect to telegram-required
      if (!hasTelegramContext && !window.Telegram?.WebApp?.initData) {
        if (import.meta.env.DEV) {
          console.log('[LoadingScreen] No Telegram context, redirecting to telegram-required')
        }
        navigate('/telegram-required', { replace: true })
      }
    }, 1000) // Wait 1 second for Telegram to initialize

    return () => clearTimeout(checkTimer)
  }, [hasTelegramContext, navigate])

  // Navigate to /app after progress completes OR timeout (always, regardless of Telegram)
  useEffect(() => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return

    // Don't navigate if we're going to telegram-required
    if (!hasTelegramContext && !window.Telegram?.WebApp?.initData) {
      return
    }

    // Navigate when progress reaches 100%
    if (progress >= 100) {
      hasNavigatedRef.current = true
      const timer = setTimeout(() => {
        navigate('/app')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate, hasTelegramContext])

  // Safety timeout: navigate after 2 seconds maximum (only if Telegram context exists)
  useEffect(() => {
    if (hasNavigatedRef.current) return
    if (!hasTelegramContext && !window.Telegram?.WebApp?.initData) {
      return // Don't navigate if no Telegram context
    }

    const safetyTimer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        navigate('/app')
      }
    }, 2000)

    return () => clearTimeout(safetyTimer)
  }, [navigate, hasTelegramContext])

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
