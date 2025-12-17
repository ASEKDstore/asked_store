import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { initTelegram } from '../lib/telegram'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, setFromTelegram } = useUser()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Initialize Telegram WebApp and sync user data on mount (non-blocking)
  useEffect(() => {
    const result = initTelegram()
    
    // Set user from Telegram if available (non-blocking)
    if (result.user) {
      setFromTelegram(result.user)
    }
  }, [setFromTelegram])

  // Navigate to /app after progress completes OR timeout (always, regardless of Telegram)
  useEffect(() => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return

    // Navigate when progress reaches 100%
    if (progress >= 100) {
      hasNavigatedRef.current = true
      const timer = setTimeout(() => {
        navigate('/app')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate])

  // Safety timeout: always navigate after 2 seconds maximum
  useEffect(() => {
    if (hasNavigatedRef.current) return

    const safetyTimer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        navigate('/app')
      }
    }, 2000)

    return () => clearTimeout(safetyTimer)
  }, [navigate])

  const userName = user?.firstName || user?.first_name || user?.name || 'ASKED'
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
