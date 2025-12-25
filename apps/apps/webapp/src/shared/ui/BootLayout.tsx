import { ReactNode } from 'react'

interface BootLayoutProps {
  children: ReactNode
}

/**
 * Layout для экрана загрузки
 * Fullscreen с размытым фоном и dark overlay
 */
export function BootLayout({ children }: BootLayoutProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--tg-bg, #000000)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        zIndex: 9999,
      }}
    >
      {/* Размытый фон с overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          filter: 'blur(40px)',
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Контент */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        {children}
      </div>

      {/* Username бота внизу */}
      <div
        style={{
          position: 'absolute',
          bottom: 'env(safe-area-inset-bottom, 20px)',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          zIndex: 2,
        }}
      >
        @asked_store_bot
      </div>
    </div>
  )
}
