import { useState, useEffect, useRef } from 'react'

export type TelegramWebAppStatus = 'loading' | 'telegram' | 'browser'

export type TelegramUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

export type UseTelegramWebAppResult = {
  status: TelegramWebAppStatus
  user: TelegramUser | null
  telegramId: number | null
  initData: string
  initDataUnsafe: any
}

const MAX_RETRIES = 10
const RETRY_DELAY = 250 // ms

/**
 * Hook to detect Telegram WebApp context with retry logic
 * Works only on client-side, uses status-based model
 * 
 * @returns {UseTelegramWebAppResult} Status, user data, and initData
 */
export function useTelegramWebApp(): UseTelegramWebAppResult {
  const [status, setStatus] = useState<TelegramWebAppStatus>('loading')
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [initData, setInitData] = useState<string>('')
  const [initDataUnsafe, setInitDataUnsafe] = useState<any>(null)
  
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') {
      return
    }

    const checkTelegramWebApp = () => {
      try {
        const wa = window.Telegram?.WebApp

        if (wa) {
          // Initialize WebApp
          wa.ready?.()
          wa.expand?.()

          const currentInitData = wa.initData ?? ''
          const currentInitDataUnsafe = wa.initDataUnsafe ?? null
          const tgUser = currentInitDataUnsafe?.user

          // Update state
          setInitData(currentInitData)
          setInitDataUnsafe(currentInitDataUnsafe)

          if (tgUser && typeof tgUser.id === 'number') {
            // User found - set telegram status
            const telegramUser: TelegramUser = {
              id: tgUser.id,
              username: tgUser.username,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              photo_url: tgUser.photo_url,
            }

            setUser(telegramUser)
            setTelegramId(tgUser.id)
            setStatus('telegram')
            
            // Clear retry timer if user found
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current)
              retryTimerRef.current = null
            }
            retryCountRef.current = 0

            if (import.meta.env.DEV) {
              console.log('[useTelegramWebApp] Telegram WebApp detected, user:', telegramUser)
            }
          } else {
            // WebApp exists but user not yet available - retry
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current++
              
              if (import.meta.env.DEV) {
                console.log(`[useTelegramWebApp] WebApp found but user not available, retry ${retryCountRef.current}/${MAX_RETRIES}`)
              }

              retryTimerRef.current = setTimeout(() => {
                checkTelegramWebApp()
              }, RETRY_DELAY)
            } else {
              // Max retries reached - still no user, but WebApp exists
              // This is still telegram context (maybe user data delayed)
              setStatus('telegram')
              
              if (import.meta.env.DEV) {
                console.warn('[useTelegramWebApp] Max retries reached, WebApp exists but user not available')
              }
            }
          }
        } else {
          // No WebApp - browser mode
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++
            
            if (import.meta.env.DEV) {
              console.log(`[useTelegramWebApp] WebApp not found, retry ${retryCountRef.current}/${MAX_RETRIES}`)
            }

            retryTimerRef.current = setTimeout(() => {
              checkTelegramWebApp()
            }, RETRY_DELAY)
          } else {
            // Max retries reached - no WebApp
            setStatus('browser')
            setUser(null)
            setTelegramId(null)
            setInitData('')
            setInitDataUnsafe(null)
            
            if (import.meta.env.DEV) {
              console.log('[useTelegramWebApp] Browser mode (no Telegram WebApp)')
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[useTelegramWebApp] Error checking Telegram WebApp:', error)
        }
        
        // On error, assume browser mode after retries
        if (retryCountRef.current >= MAX_RETRIES) {
          setStatus('browser')
        }
      }
    }

    // Initial check
    checkTelegramWebApp()

    // Cleanup
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [])

  return {
    status,
    user,
    telegramId,
    initData,
    initDataUnsafe,
  }
}

