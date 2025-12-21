import React from 'react'
import './Page.css'

interface PageProps {
  children: React.ReactNode
  className?: string
  maxWidth?: string
  padding?: string | number
}

/**
 * Page component for consistent content layout
 * Provides standard padding, max-width, and spacing
 */
export const Page: React.FC<PageProps> = ({
  children,
  className = '',
  maxWidth = '520px',
  padding = '16px',
}) => {
  const paddingValue = typeof padding === 'number' ? `${padding}px` : padding

  return (
    <div
      className={`page ${className}`}
      style={{
        maxWidth,
        padding: paddingValue,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {children}
    </div>
  )
}

