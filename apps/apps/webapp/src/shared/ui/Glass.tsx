import { ReactNode } from 'react'

interface GlassProps {
  children: ReactNode
  className?: string
}

/**
 * Glassmorphism компонент
 * Стеклянный эффект с размытием
 */
export function Glass({ children, className = '' }: GlassProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </div>
  )
}
