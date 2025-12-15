import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { useTelegramAuth } from '../hooks/useTelegramAuth'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { handleLogin, isAuthenticating } = useTelegramAuth()
  
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : (isAuthenticating ? 'authenticating' : 'unauthenticated')
  
  const progress = useLoadingProgress(authState)
  const [showAuthMessage, setShowAuthMessage] = useState(false)

  // Show auth message when progress stops for unauthenticated users
  useEffect(() => {
    if (authState === 'unauthenticated' && progress >= 35) {
      const timer = setTimeout(() => setShowAuthMessage(true), 500)
      return () => clearTimeout(timer)
    }
  }, [authState, progress])

  // Navigate to /app when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate('/app')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate])

  const handleTelegramLogin = async () => {
    try {
      await handleLogin()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const userName = user?.first_name || 'ASKED'
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

        {/* Сообщение об авторизации */}
        {showAuthMessage && !user && (
          <div className="ls-auth-message">
            Для продолжения войдите через Telegram
          </div>
        )}

        {/* Кнопка Telegram */}
        {(!user || showAuthMessage) && (
          <button 
            className="ls-telegram-button"
            onClick={handleTelegramLogin}
            disabled={isAuthenticating}
          >
            <svg 
              className="ls-telegram-icon" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.87 8.8c-.135.608-.479.758-.97.472l-2.68-1.97-1.29 1.24c-.147.147-.27.27-.553.27l.198-2.79 4.94-4.46c.216-.19-.047-.297-.333-.11l-6.1 3.84-2.63-.82c-.574-.18-.59-.574.11-.88l10.26-3.95c.47-.18.88.11.73.68z"/>
            </svg>
            <span>{isAuthenticating ? 'Вход...' : 'Продолжить через Telegram'}</span>
          </button>
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
