import { useMemo } from 'react'

/**
 * Hook to initialize Telegram WebApp and extract user data
 * Returns diagnostic information about Telegram WebApp availability
 */
export function useTelegramInit() {
  return useMemo(() => {
    const wa = (window as any).Telegram?.WebApp
    const waPresent = !!wa

    if (!waPresent) {
      if (import.meta.env.DEV) {
        console.log('[TG INIT] WebApp not available')
      }
      return {
        waPresent: false,
        tgUser: null,
        initData: '',
        platform: undefined,
        version: undefined,
      }
    }

    // Initialize WebApp
    try {
      wa.ready?.()
      wa.expand?.()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[TG INIT] Error initializing WebApp:', error)
      }
    }

    const initData = wa.initData || ''
    const initDataUnsafe = wa.initDataUnsafe
    const tgUser = initDataUnsafe?.user || null
    const platform = wa.platform
    const version = wa.version

    // Console logs for diagnostics
    console.log('[TG] initDataUnsafe:', initDataUnsafe)
    console.log('[TG] initDataUnsafe.user:', tgUser)
    console.log('[TG] initData.length:', initData.length)

    // DEV diagnostics
    if (import.meta.env.DEV) {
      const initDataPreview = initData.length > 0 
        ? `${initData.substring(0, 12)}... (${initData.length} chars)`
        : 'empty'
      
      console.log('[TG INIT]', {
        waPresent: true,
        initDataLen: initData.length,
        initDataPreview,
        user: tgUser ? {
          id: tgUser.id,
          username: tgUser.username || '—',
          hasPhoto: !!tgUser.photo_url,
          firstName: tgUser.first_name || '—',
        } : null,
        platform: platform || '—',
        version: version || '—',
        location: window.location.href,
      })
    }

    return {
      waPresent: true,
      tgUser,
      initData,
      platform,
      version,
    }
  }, [])
}

