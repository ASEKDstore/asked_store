import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, setTelegramUser } = useUser()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  
  // Auth state: always allow progress (guest mode supported)
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : 'unauthenticated'
  
  const progress = useLoadingProgress(authState)

  // Initialize Telegram WebApp and sync user data on mount (non-blocking)
  useEffect(() => {
    // Safely get Telegram WebApp
    const wa = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined
    
    if (wa) {
      // Initialize Telegram WebApp
      try {
        wa.ready?.()
        wa.expand?.()
      } catch (error) {
        console.warn('Failed to initialize Telegram WebApp:', error)
      }

      // Get user data if available
      const tgUser = wa.initDataUnsafe?.user
      if (tgUser) {
        setTelegramUser({
          id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          photo_url: tgUser.photo_url,
        })
      }
    }
  }, [setTelegramUser])

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
