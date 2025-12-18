import { useState, useEffect } from 'react'

/**
 * Telegram WebApp Debug Panel
 * Shows real-time state of window.Telegram.WebApp
 * Updates every 500ms
 * Only visible in DEV mode
 */
export function TgDebugPanel() {
  const [data, setData] = useState<any>({})

  useEffect(() => {
    // Only show in dev mode
    const isDev = import.meta.env.DEV || import.meta.env.VITE_TG_DEBUG === 'true'
    if (!isDev) {
      return
    }

    const tick = () => {
      const w: any = window
      const tg = w?.Telegram
      const wa = tg?.WebApp

      setData({
        hasWindow: typeof window !== 'undefined',
        hasTelegram: !!tg,
        hasWebApp: !!wa,
        initDataLen: wa?.initData?.length ?? 0,
        userId: wa?.initDataUnsafe?.user?.id ?? null,
        platform: wa?.platform ?? null,
        version: wa?.version ?? null,
        colorScheme: wa?.colorScheme ?? null,
        href: typeof window !== 'undefined' ? window.location.href : null,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      })
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [])

  // Only show in dev mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_TG_DEBUG === 'true'
  if (!isDev) {
    return null
  }

  return (
    <pre
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        zIndex: 999999,
        padding: 10,
        borderRadius: 10,
        maxWidth: '95vw',
        maxHeight: '40vh',
        overflow: 'auto',
        fontSize: 12,
        background: 'rgba(0,0,0,0.75)',
        color: 'white',
        fontFamily: 'monospace',
        border: '1px solid rgba(255,255,255,0.2)',
        margin: 0,
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

