import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { ErrorScreen } from '../components/ErrorScreen'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { status, displayName, error } = useAuth()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  
  // Auth state based on session status
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    status === 'ready' ? 'authenticated' : status === 'authing' ? 'authenticating' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)
  
  // Show error screen if error (after hooks)
  if (status === 'error') {
    return <ErrorScreen />
  }

  // Navigate to /app when session is ready
  useEffect(() => {
    if (hasNavigatedRef.current) return

    if (status === 'ready') {
      // Navigate when progress reaches 100%
      if (progress >= 100) {
        hasNavigatedRef.current = true
        const timer = setTimeout(() => {
          navigate('/app')
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [progress, navigate, status])

  // Safety timeout: navigate after 2 seconds if ready
  useEffect(() => {
    if (hasNavigatedRef.current) return
    if (status !== 'ready') return

    const safetyTimer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        navigate('/app')
      }
    }, 2000)

    return () => clearTimeout(safetyTimer)
  }, [navigate, status])

  // Greeting text - show name if available, otherwise show loading
  const greeting = displayName 
    ? `Привет, ${displayName} 👋`
    : 'Загружаем...'

  return (
    <div className="ls-root">
      <div className="ls-bg" />
      <div className="ls-glass" />

      <div className="ls-content">
        {/* Наклейка на стекле */}
        <div className="ls-sticker">ASKED STORE</div>

        {/* Приветствие */}
        <div className="ls-text">
          <div className="ls-title">{greeting}</div>
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
