import { ButtonHTMLAttributes, ReactNode } from 'react'
import { getTelegramWebApp } from '../../features/telegram/tg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ children, variant = 'primary', style, onClick, ...props }: ButtonProps) {
  const tg = getTelegramWebApp()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback при клике
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light')
    }

    onClick?.(e)
  }

  const baseStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    minHeight: '44px',
    ...(variant === 'primary'
      ? {
          background: 'var(--tg-button, #2481cc)',
          color: 'var(--tg-button-text, #ffffff)',
        }
      : {
          background: 'var(--tg-secondary-bg, #e0e0e0)',
          color: 'var(--tg-text, #000000)',
        }),
    ...style,
  }

  return (
    <button style={baseStyle} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}