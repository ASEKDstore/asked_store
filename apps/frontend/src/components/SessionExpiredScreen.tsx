import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setApiToken } from '../lib/apiClient'
import { safeNavigate, safeReload } from '../utils/navigation'
import './SessionExpiredScreen.css'

/**
 * Screen shown when session expires (401 error)
 */
export function SessionExpiredScreen() {
  const navigate = useNavigate()
  const { retry } = useAuth()
  const [isReAuthing, setIsReAuthing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Perform re-authentication
   */
  const handleReAuth = async () => {
    console.log('[ASKED SESSION] CLICK_REAUTH')
    setIsReAuthing(true)
    setError(null)

    try {
      // Safely get Telegram WebApp
      const tg = window.Telegram?.WebApp
      
      if (!tg) {
        console.warn('[ASKED SESSION] REAUTH_FAIL: Telegram WebApp not found')
        setError('Telegram WebApp не найден. Откройте приложение через Telegram.')
        setIsReAuthing(false)
        return
      }

      const initData = tg.initData || ''
      
      if (!initData) {
        console.warn('[ASKED SESSION] REAUTH_FAIL: initData is empty')
        setError('Не удалось получить данные Telegram. Перезапустите через /start.')
        setIsReAuthing(false)
        return
      }

      console.log('[ASKED SESSION] REAUTH_START', { initDataLength: initData.length })
      
      // Use the same performAuth logic as apiClient
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                        (import.meta as any).env?.VITE_API_URL || 
                        (import.meta as any).env?.VITE_API_BASE || ''
      
      if (!backendUrl) {
        setError('Не настроен URL бэкенда')
        setIsReAuthing(false)
        return
      }

      // Normalize backend URL
      let normalizedUrl = backendUrl.trim()
      if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }

      const authUrl = `${normalizedUrl}/api/auth/telegram`

      // Get backend URL
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                        (import.meta as any).env?.VITE_API_URL || 
                        (import.meta as any).env?.VITE_API_BASE || ''
      
      if (!backendUrl) {
        console.error('[ASKED SESSION] REAUTH_FAIL: No backend URL configured')
        setError('Не настроен URL бэкенда')
        setIsReAuthing(false)
        return
      }

      // Normalize backend URL
      let normalizedUrl = backendUrl.trim()
      if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }

      const authUrl = `${normalizedUrl}/api/auth/telegram`

      // Perform auth request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const responseText = await response.text()
          let errorMessage = `Ошибка авторизации: ${response.status}`
          
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch {
            if (responseText) {
              errorMessage = responseText.substring(0, 100)
            }
          }

          console.error('[ASKED SESSION] REAUTH_FAIL', { status: response.status, error: errorMessage })
          setError(errorMessage)
          setIsReAuthing(false)
          return
        }

        // Parse response
        const data = await response.json()
        const newToken = data.token || data.accessToken || data.jwt

        if (!newToken) {
          console.error('[ASKED SESSION] REAUTH_FAIL: No token in response')
          setError('Токен не получен от сервера')
          setIsReAuthing(false)
          return
        }

        // Save token
        setApiToken(newToken)
        console.log('[ASKED SESSION] REAUTH_OK', { tokenLength: newToken.length })

        // Determine redirect path based on role
        const role = data.role || data.user?.role || 'user'
        const redirectPath = role === 'admin' ? '/app/admin' : '/app'

        // Navigate after successful auth
        setTimeout(() => {
          safeNavigate(redirectPath, navigate)
        }, 100)

      } catch (fetchError) {
        clearTimeout(timeoutId)
        const errorMsg = fetchError instanceof Error ? fetchError.message : 'Network error'
        console.error('[ASKED SESSION] REAUTH_FAIL', { error: errorMsg })
        setError(`Ошибка сети: ${errorMsg}`)
        setIsReAuthing(false)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[ASKED SESSION] REAUTH_FAIL', { error: errorMsg })
      setError(`Ошибка: ${errorMsg}`)
      setIsReAuthing(false)
    }
  }

  /**
   * Navigate to home
   */
  const handleGoHome = () => {
    console.log('[ASKED SESSION] CLICK_HOME')
    safeNavigate('/', navigate)
  }

  return (
    <div className="session-expired-screen">
      <div className="session-expired-content">
        <div className="session-expired-icon">🔒</div>
        <h1 className="session-expired-title">Сессия истекла</h1>
        <p className="session-expired-message">
          Ваша сессия авторизации истекла. Пожалуйста, авторизуйтесь снова.
        </p>
        
        {error && (
          <div className="session-expired-error">
            {error}
          </div>
        )}

        <div className="session-expired-actions">
          <button 
            className="session-expired-retry" 
            onClick={handleReAuth}
            disabled={isReAuthing}
          >
            {isReAuthing ? 'Авторизация...' : 'Повторить авторизацию'}
          </button>
          <button 
            className="session-expired-back" 
            onClick={handleGoHome}
            disabled={isReAuthing}
          >
            Вернуться на главную
          </button>
          {error && (
            <button 
              className="session-expired-reload" 
              onClick={safeReload}
            >
              Перезагрузить страницу
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

