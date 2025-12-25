import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--tg-secondary-bg, #f1f1f1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      {children}
    </div>
  )
}
