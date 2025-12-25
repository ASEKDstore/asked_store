import { ReactNode } from 'react'

interface PageProps {
  children: ReactNode
  className?: string
}

/**
 * Контейнер страницы с поддержкой safe area
 * Учитывает Telegram header и safe area insets
 */
export function Page({ children, className = '' }: PageProps) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 60px)', // +60px для MainButton
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        background: 'var(--tg-bg)',
        color: 'var(--tg-text)',
      }}
    >
      {children}
    </div>
  )
}
