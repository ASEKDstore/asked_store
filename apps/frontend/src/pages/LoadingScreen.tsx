import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { apiUrl } from '../utils/api'
import './LoadingScreen.css'

export function LoadingScreen() {
  const { user, refresh } = useUser()
  const navigate = useNavigate()
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_telegram'>('checking')
  const [authMessage, setAuthMessage] = useState<string>('')
  
  const authState: 'authenticated' | 'unauthenticated' | 'authenticating' = 
    user ? 'authenticated' : (authStatus === 'checking' ? 'authenticating' : 'unauthenticated')
  
  const progress = useLoadingProgress(authState)

  // Auto-login via Telegram WebApp
  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
    
    if (!tg) {
      // Not in Telegram WebApp
      setAuthStatus('not_telegram')
      setAuthMessage('Откройте приложение через Telegram-бота')
      return
    }

    // Initialize Telegram WebApp
    tg?.ready?.()

    // Check if we have initData (user is authenticated via Telegram)
    const initData = tg?.initData
    const hasInitData = !!initData

    if (hasInitData) {
      // Auto-authenticate
      setAuthStatus('checking')
      setAuthMessage('Вы вошли через Telegram')

      // Send initData to backend for verification
      const authenticate = async () => {
        try {
          const response = await fetch(apiUrl('/api/auth/telegram'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          })

          if (response.ok) {
            // Refresh user data from Telegram WebApp
            refresh()
            setAuthStatus('authenticated')
          } else {
            console.error('Auth failed:', await response.text())
            setAuthStatus('not_telegram')
            setAuthMessage('Ошибка авторизации. Откройте приложение через Telegram-бота')
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Even if backend fails, we can still use Telegram WebApp data
          refresh()
          setAuthStatus('authenticated')
          setAuthMessage('Вы вошли через Telegram')
        }
      }

      authenticate()
    } else {
      // No initData - not in Telegram WebApp or not authenticated
      setAuthStatus('not_telegram')
      setAuthMessage('Откройте приложение через Telegram-бота')
    }
  }, [refresh])

  // Navigate to /app when authenticated and progress reaches 100%
  useEffect(() => {
    if (user && progress >= 100) {
      const timer = setTimeout(() => {
        navigate('/app')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [user, progress, navigate])

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
        {authMessage && (
          <div className="ls-auth-message">
            {authStatus === 'authenticated' ? (
              <span>✅ {authMessage}</span>
            ) : (
              <span>ℹ️ {authMessage}</span>
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
