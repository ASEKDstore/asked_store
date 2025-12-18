import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, telegramStatus } = useUser()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  const [hasWebApp, setHasWebApp] = useState<boolean | null>(null)
  
  // Check directly for window.Telegram?.WebApp
  useEffect(() => {
    const checkWebApp = () => {
      const wa = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
      setHasWebApp(!!wa)
    }

    checkWebApp()
    const interval = setInterval(checkWebApp, 500)
    
    return () => clearInterval(interval)
  }, [])

  // Redirect to telegram-required screen ONLY if WebApp is absent
  useEffect(() => {
    if (hasWebApp === false) {
      if (import.meta.env.DEV) {
        console.log('[LoadingScreen] No WebApp detected, redirecting to telegram-required')
      }
      navigate('/telegram-required', { replace: true })
    }
  }, [hasWebApp, navigate])
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user.source === 'telegram' ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Navigate to /app after progress completes OR timeout
  // Only navigate if WebApp exists (hasWebApp === true)
  useEffect(() => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return

    // Don't navigate if no WebApp (will redirect to telegram-required)
    if (hasWebApp === false) {
      return
    }

    // Wait for WebApp check to complete
    if (hasWebApp === null) {
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
  }, [progress, navigate, hasWebApp])

  // Safety timeout: navigate after 2 seconds maximum (only if WebApp exists)
  useEffect(() => {
    if (hasNavigatedRef.current) return
    if (hasWebApp === false) {
      return // Don't navigate if no WebApp
    }
    if (hasWebApp === null) {
      return // Wait for check to complete
    }

    const safetyTimer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        navigate('/app')
      }
    }, 2000)

    return () => clearTimeout(safetyTimer)
  }, [navigate, hasWebApp])

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
